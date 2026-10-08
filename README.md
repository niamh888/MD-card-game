# Medical device dashboard and study deck

By St John Lynch.

- `backend-flask/`: Python Flask API. It serves the FDA dashboard data, email sign-in links and saved card ratings.
- `frontend-react/`: React (Vite) app with the dashboard and the study deck.

## Run it (two terminals)

Backend, in `backend-flask`:

```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Frontend, in `frontend-react`:

```
pnpm install
pnpm dev
```

Open http://localhost:5173. The frontend sends `/api/...` requests to Flask on port 5000.

## Signing in during development

No email service is needed. When you ask for a sign-in link, Flask prints the link in the backend terminal. Open it in your browser.
To send real emails, copy `backend-flask/.env.example` to `backend-flask/.env` and add a Resend API key.
