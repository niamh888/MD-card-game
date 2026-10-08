"""Flask backend: FDA dashboard data, email sign-in links and saved card ratings.

How the pieces fit together:
  - The React app (frontend-react) never talks to the FDA or the database directly.
    It asks this Flask app for data using URLs that start with /api/.
  - Each @app.get / @app.post / @app.put below is a "route": a URL this server answers.
  - jsonify turns a Python dictionary into JSON, which is what React reads.
"""

import hashlib
import io
import os
import secrets
import sqlite3
import threading
import time
from collections import Counter
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from openpyxl import load_workbook

# Read settings from a .env file (if there is one) so secrets are not written in the code.
load_dotenv()

# Settings. os.environ.get("NAME", "default") reads a setting, or uses the default if it is missing.
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "")
DB_PATH = os.path.join(os.path.dirname(__file__), "data.db")

# Where the data comes from: the FDA's AI-enabled device spreadsheet, and the openFDA API.
AI_LIST_URL = "https://www.fda.gov/media/178540/download"
REGISTRATION_URL = "https://api.fda.gov/device/registrationlisting.json"
# The FDA website blocks requests that do not look like a normal browser.
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; MedicalDeviceDashboard/1.0)"}
CACHE_SECONDS = 24 * 60 * 60  # keep FDA results for a day instead of re-downloading on every page view
LOGIN_LINK_MINUTES = 15  # how long an emailed sign-in link works
SESSION_DAYS = 30  # how long someone stays signed in

# Create the Flask application. Everything below attaches routes to it.
app = Flask(__name__)


# ---------------------------------------------------------------- database

def get_db():
    """Open the SQLite database for this request (once), and reuse it if asked again.

    Flask's `g` is a scratch space that lasts for one request.
    """
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


# Flask runs this automatically at the end of every request to close the database.
@app.teardown_appcontext
def close_db(_error):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create the tables the first time the app runs. IF NOT EXISTS makes it safe to run every time."""
    with sqlite3.connect(DB_PATH) as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS login_tokens (
                token_hash TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                expires_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at TEXT NOT NULL
            );
            -- rating: 1 = needs review, 2 = getting there, 3 = I knew it
            CREATE TABLE IF NOT EXISTS card_ratings (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                card_term TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 3),
                updated_at TEXT NOT NULL,
                PRIMARY KEY (user_id, card_term)
            );
            """
        )


def now():
    """The current time in UTC, so times are the same wherever the server runs."""
    return datetime.now(timezone.utc)


def hash_token(token):
    """Scramble a token (one-way) before storing it, so a leaked database cannot be used to sign in."""
    return hashlib.sha256(token.encode()).hexdigest()


# ---------------------------------------------------------------- health check

@app.get("/api/health")
def health():
    """GET /api/health: a quick way to check the backend is running.

    It does no work and needs no sign-in. If you get {"status": "ok"} back, the server is up.
    """
    return jsonify(status="ok")


# ---------------------------------------------------------------- dashboard

# A simple memory store for the dashboard numbers, plus a lock so two requests do not refill it at once.
_cache = {"data": None, "fetched_at": 0.0}
_cache_lock = threading.Lock()


def tally(values):
    """Count how often each value appears, biggest first.

    tally(["a", "b", "a"]) -> [{"label": "a", "count": 2}, {"label": "b", "count": 1}]
    """
    return [{"label": label, "count": count} for label, count in Counter(values).most_common()]


def parse_date(value):
    """The FDA writes dates like 06/29/2026 (month/day/year). Turn that text into a real date."""
    if isinstance(value, datetime):
        return value
    return datetime.strptime(str(value).strip(), "%m/%d/%Y")


def fetch_ai_devices():
    """Download the FDA's AI device spreadsheet and turn each row into a small dictionary."""
    response = requests.get(AI_LIST_URL, headers=HEADERS, timeout=60)
    response.raise_for_status()
    sheet = load_workbook(io.BytesIO(response.content), read_only=True).active
    devices = []
    for row in list(sheet.iter_rows(values_only=True))[1:]:
        if not row or not row[0]:
            continue
        # Columns: 0 = decision date, 3 = company, 4 = medical specialty.
        devices.append(
            {
                "date": parse_date(row[0]),
                "company": str(row[3] or "").strip(),
                "specialty": str(row[4] or "Unknown").strip(),
            }
        )
    return devices


def fetch_active_listings():
    """Ask openFDA how many active device listings exist. Returns None if the FDA cannot be reached."""
    try:
        response = requests.get(
            REGISTRATION_URL,
            params={"search": "registration.status_code:1", "limit": 1},
            headers=HEADERS,
            timeout=30,
        )
        response.raise_for_status()
        return response.json()["meta"]["results"]["total"]
    except (requests.RequestException, KeyError, ValueError):
        return None


def fetch_listings_by_country():
    """Ask openFDA to count active device listings per country (used for the world map)."""
    try:
        response = requests.get(
            REGISTRATION_URL,
            params={
                "search": "registration.status_code:1",
                "count": "registration.iso_country_code",
                "limit": 1000,
            },
            headers=HEADERS,
            timeout=30,
        )
        response.raise_for_status()
        return [{"label": r["term"], "count": r["count"]} for r in response.json()["results"]]
    except (requests.RequestException, KeyError, ValueError):
        return []


def build_dashboard():
    """Gather and calculate every number the dashboard shows.

    The key names (aiTotal, byYear...) must match what the React app expects (see src/lib/types.ts).
    """
    devices = fetch_ai_devices()
    by_year = sorted(tally(str(d["date"].year) for d in devices), key=lambda item: int(item["label"]))
    latest = by_year[-1]
    return {
        "aiTotal": len(devices),
        "aiCompanies": len({d["company"].lower() for d in devices}),
        "latestYear": int(latest["label"]),
        "latestYearCount": latest["count"],
        "byYear": by_year,
        "bySpecialty": tally(d["specialty"] for d in devices),
        "topCompanies": tally(d["company"] for d in devices)[:20],
        "activeListings": fetch_active_listings(),
        "listingsByCountry": fetch_listings_by_country(),
        "latestDecision": max(d["date"] for d in devices).strftime("%m/%d/%Y"),
    }


@app.get("/api/dashboard")
def dashboard():
    """GET /api/dashboard: send the dashboard numbers as JSON."""
    with _cache_lock:
        # Rebuild the numbers only if we have none yet, or they are over a day old.
        if _cache["data"] is None or time.time() - _cache["fetched_at"] > CACHE_SECONDS:
            try:
                _cache["data"] = build_dashboard()
                _cache["fetched_at"] = time.time()
            except (requests.RequestException, ValueError, IndexError) as error:
                app.logger.error("Could not build dashboard data: %s", error)
                # If the FDA is down but we have older numbers, keep serving those.
                # 502 means "an outside service we depend on failed".
                if _cache["data"] is None:
                    return jsonify(error="FDA data is unavailable right now."), 502
        return jsonify(_cache["data"])


# ---------------------------------------------------------------- sign-in

def current_user():
    """Work out who is signed in from the "sid" cookie. Returns None if nobody is (or the session expired)."""
    token = request.cookies.get("sid")
    if not token:
        return None
    row = get_db().execute(
        """SELECT users.id, users.email, sessions.expires_at FROM sessions
           JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ?""",
        (hash_token(token),),
    ).fetchone()
    if row is None or datetime.fromisoformat(row["expires_at"]) < now():
        return None
    return row


def send_login_email(email, link):
    """Email the sign-in link using Resend. With no Resend key set, print it in this terminal instead."""
    if not (RESEND_API_KEY and EMAIL_FROM):
        print(f"\n--- Sign-in link for {email} (email sending is not configured) ---\n{link}\n", flush=True)
        return
    response = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
        json={
            "from": EMAIL_FROM,
            "to": [email],
            "subject": "Your sign-in link",
            "text": f"Click to sign in (valid for {LOGIN_LINK_MINUTES} minutes):\n\n{link}\n\nIf you did not ask for this, ignore this email.",
        },
        timeout=30,
    )
    response.raise_for_status()


@app.post("/api/auth/request")
def auth_request():
    """Step 1 of sign-in: the person gives their email and we send them a one-time link.

    There is no password. Whoever can open the email can sign in.
    """
    email = str((request.get_json(silent=True) or {}).get("email", "")).strip().lower()
    if "@" not in email or len(email) > 254:
        return jsonify(error="Please enter a valid email address."), 400
    token = secrets.token_urlsafe(32)  # a long random string nobody could guess
    db = get_db()
    db.execute("DELETE FROM login_tokens WHERE expires_at < ?", (now().isoformat(),))
    db.execute(
        "INSERT INTO login_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)",
        (hash_token(token), email, (now() + timedelta(minutes=LOGIN_LINK_MINUTES)).isoformat()),
    )
    db.commit()
    try:
        send_login_email(email, f"{FRONTEND_URL}/auth/verify?token={token}")
    except requests.RequestException:
        return jsonify(error="Could not send the email. Please try again."), 502
    return jsonify(sent=True)


@app.post("/api/auth/verify")
def auth_verify():
    """Step 2: the person clicked the link. Swap the one-time token for a signed-in session."""
    token = str((request.get_json(silent=True) or {}).get("token", ""))
    db = get_db()
    row = db.execute(
        "SELECT email, expires_at FROM login_tokens WHERE token_hash = ?", (hash_token(token),)
    ).fetchone()
    if row is None or datetime.fromisoformat(row["expires_at"]) < now():
        return jsonify(error="This sign-in link is invalid or has expired."), 400
    # Delete the token straight away so the link only works once.
    db.execute("DELETE FROM login_tokens WHERE token_hash = ?", (hash_token(token),))
    # First time we see this email? Create the account. Otherwise this does nothing.
    db.execute(
        "INSERT OR IGNORE INTO users (email, created_at) VALUES (?, ?)", (row["email"], now().isoformat())
    )
    user = db.execute("SELECT id, email FROM users WHERE email = ?", (row["email"],)).fetchone()
    session_token = secrets.token_urlsafe(32)
    db.execute(
        "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
        (hash_token(session_token), user["id"], (now() + timedelta(days=SESSION_DAYS)).isoformat()),
    )
    db.commit()
    response = jsonify(email=user["email"])
    # The cookie is how the browser proves who it is on later requests.
    # httponly: page JavaScript cannot read it. samesite: it is not sent from other websites.
    response.set_cookie(
        "sid",
        session_token,
        max_age=SESSION_DAYS * 24 * 3600,
        httponly=True,
        samesite="Lax",
        secure=FRONTEND_URL.startswith("https://"),
    )
    return response


@app.get("/api/me")
def me():
    """Tell the React app who is signed in (or user: null)."""
    user = current_user()
    return jsonify(user=None if user is None else {"email": user["email"]})


@app.post("/api/auth/logout")
def logout():
    """Sign out: delete the session from the database and remove the cookie."""
    token = request.cookies.get("sid")
    if token:
        db = get_db()
        db.execute("DELETE FROM sessions WHERE token_hash = ?", (hash_token(token),))
        db.commit()
    response = jsonify(ok=True)
    response.delete_cookie("sid")
    return response


# ---------------------------------------------------------------- card ratings

@app.get("/api/ratings")
def get_ratings():
    """Return the signed-in person's saved ratings as {card term: rating}. 401 means "not signed in"."""
    user = current_user()
    if user is None:
        return jsonify(error="Not signed in."), 401
    rows = get_db().execute(
        "SELECT card_term, rating FROM card_ratings WHERE user_id = ?", (user["id"],)
    ).fetchall()
    return jsonify({row["card_term"]: row["rating"] for row in rows})


@app.put("/api/ratings")
def put_rating():
    """Save one rating (1, 2 or 3) for a card. Rating the same card again replaces the old rating."""
    user = current_user()
    if user is None:
        return jsonify(error="Not signed in."), 401
    body = request.get_json(silent=True) or {}
    term, rating = str(body.get("term", "")).strip(), body.get("rating")
    if not term or len(term) > 200 or rating not in (1, 2, 3):
        return jsonify(error="Invalid rating."), 400
    db = get_db()
    # "ON CONFLICT ... DO UPDATE" = insert a new row, or update the existing row for this person and card.
    db.execute(
        """INSERT INTO card_ratings (user_id, card_term, rating, updated_at) VALUES (?, ?, ?, ?)
           ON CONFLICT (user_id, card_term) DO UPDATE SET rating = excluded.rating, updated_at = excluded.updated_at""",
        (user["id"], term, rating, now().isoformat()),
    )
    db.commit()
    return jsonify(saved=True)


# Make sure the tables exist, then start the server when you run `python app.py`.
init_db()

if __name__ == "__main__":
    # debug=True restarts the server when you save the file and shows detailed errors (development only).
    # Port 5001 (not 5000) because macOS uses 5000 for AirPlay. The React dev server's proxy points here too.
    app.run(port=5001, debug=True)
