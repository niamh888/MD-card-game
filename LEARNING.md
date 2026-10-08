# How this app fits together (in plain English)

You don't need to understand all of this at once. Read the first section, then come back to the rest when a word in class sounds familiar.

## The big picture

The app has two halves that talk to each other, like a restaurant:

- **Frontend (`frontend-react`)** is the dining room. It's what people see and click. It's written in React.
- **Backend (`backend-flask`)** is the kitchen. It does the work people can't see: fetching the FDA numbers, checking who is signed in, saving ratings. It's written in Python with Flask.

The frontend never fetches the FDA data or touches the database itself. It sends a request to the backend, like a waiter passing an order to the kitchen, and the backend sends back an answer.

```
Browser  <-->  Frontend (React, port 5173)  <-->  Backend (Flask, port 5001)  <-->  FDA website, database
```

Both must be running at once, each in its own terminal.

## What each folder is for

```
MD-card-game/
  backend-flask/
    app.py            the whole backend: every URL it answers
    test_app.py       automatic checks that the backend works (run with: pytest)
    requirements.txt  the list of Python packages it needs
    venv/             a private copy of Python and its packages (you never edit this)
    data.db           the small database file (created automatically, never uploaded)
  frontend-react/
    index.html        the one web page; React draws everything inside it
    vite.config.ts    settings for Vite, the tool that runs the frontend
    src/
      main.tsx        where the app starts
      App.tsx         the list of pages: which web address shows which page
      pages/          one file per page (Dashboard, Study, SignIn, Verify)
      components/     reusable pieces: the charts and the world map
      lib/api.ts      every request to the backend, in one place
      lib/types.ts    the shape of the data the backend sends
      index.css       the brand colours (navy, gold, off-white)
      test/           setup for the frontend tests
```

## What happens when you open the dashboard

1. You go to http://localhost:5173. Vite sends your browser the page and the React code.
2. React shows the Dashboard page (`pages/Dashboard.tsx`). It starts with "Loading...".
3. Straight away, the page asks the backend for the numbers: `getDashboard()` in `lib/api.ts` requests `/api/dashboard`.
4. Vite sees the address starts with `/api` and passes the request on to Flask (that's the "proxy" in `vite.config.ts`).
5. Flask (`app.py`, the `dashboard` function) downloads the FDA spreadsheet, counts things, and answers with the numbers as JSON. It remembers the answer for a day.
6. React receives the numbers, stores them with `setData`, and redraws the page with the charts and map.

## What happens when you sign in

There's no password. The person proves they own an email address.

1. You type your email on the Sign in page. React sends it to Flask (`/api/auth/request`).
2. Flask makes a long random token, stores a scrambled copy, and emails you a link containing it. In development it prints the link in the backend terminal instead.
3. You click the link. It opens the Verify page (`/auth/verify?token=...`), which sends the token to Flask (`/api/auth/verify`).
4. Flask checks the token is real, recent and unused, deletes it so it can't be used twice, and creates a **session**. It gives your browser a **cookie** (a small note) saying "this is session X".
5. From then on, every request carries the cookie, so Flask knows who you are. That's how your card ratings are saved to *your* account.

## Words you'll hear in class

| Word | What it means here |
| --- | --- |
| **Component** | A function that returns a piece of the page, e.g. `Dashboard` or `StatCard`. |
| **State (`useState`)** | A value React remembers. When you change it, React redraws the page. |
| **Effect (`useEffect`)** | Code that runs at a certain moment, e.g. once when a page first appears (used to fetch data). |
| **Props** | Information passed into a component, like arguments to a function. |
| **Route** | A web address the app answers. In React, `App.tsx` lists them; in Flask, each `@app.get("/api/...")` is one. |
| **API** | The set of URLs the backend offers. Ours all start with `/api/`. |
| **JSON** | A text format for sending data, e.g. `{"status": "ok"}`. Flask's `jsonify` creates it. |
| **Request / response** | Frontend asks, backend answers. |
| **Proxy** | Vite passing `/api` requests on to Flask, so the browser only talks to one address. |
| **Virtual environment (`venv`)** | A private copy of Python for one project, so packages don't clash. |
| **Test** | A small piece of code that checks another piece of code works. |

## Things to try (the best way to learn)

- Change the heading text on the dashboard in `pages/Dashboard.tsx`, save, and watch the page update.
- Add a new card to the `cards` list at the top of `pages/Study.tsx`.
- Visit http://localhost:5001/api/health in your browser and see the backend answer.
- Run `pytest` in `backend-flask` and `pnpm test` in `frontend-react`, then break something small and see a test fail.
