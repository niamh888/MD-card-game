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

## Starting and stopping the app

You need **two terminals open at the same time**: one for the backend and one for the frontend. Each one runs a program that keeps going until you stop it, so a terminal is "busy" while its server runs. That's why you need a second terminal rather than typing more commands into the first.

In VS Code, open the terminal with Ctrl+` (the key above Tab). Click the `+` in the terminal panel to open a second one.

### First time only (setting up)

These steps install what the app needs. You only repeat them if the project is freshly downloaded or the package lists change.

Backend, in the first terminal:

```
cd backend-flask
python -m venv venv
pip install -r requirements.txt
```

Frontend, in the second terminal:

```
cd frontend-react
pnpm install
```

What is happening:

- `cd` means "go into this folder". Commands only work from the right folder.
- `python -m venv venv` creates the virtual environment: a private copy of Python for this project, so its packages don't clash with other projects.
- `pip install -r requirements.txt` reads the list in `requirements.txt` and installs every package on it (Flask, requests, and so on) into that private copy. (Activate the environment first, as below, so they go in the right place.)
- `pnpm install` does the same job for the frontend: it reads `package.json` and downloads React, Vite and the rest into a `node_modules` folder.

### Every time: start the backend (terminal 1)

```
cd backend-flask
venv\Scripts\activate
python app.py
```

How you activate depends on which kind of terminal you have (the name is shown at the top of the terminal panel):

| Terminal | Activate with |
| --- | --- |
| Command Prompt | `venv\Scripts\activate` |
| PowerShell | `.\venv\Scripts\Activate.ps1` |
| Git Bash | `source venv/Scripts/activate` |

What is happening:

- **Activating** tells this terminal to use the project's private Python instead of the computer's general one. You'll see `(venv)` appear at the start of the line. It only lasts for that one terminal.
- `python app.py` starts the Flask server. It's ready when you see `Running on http://127.0.0.1:5001`. It now sits there waiting for requests from the frontend.
- **Check it works:** open http://localhost:5001/api/health in your browser. You should see `{"status": "ok"}`. That page exists only to answer "is the backend alive?".

### Every time: start the frontend (terminal 2)

```
cd frontend-react
pnpm dev
```

What is happening:

- `pnpm dev` starts Vite, which builds the React app and serves it to your browser. It's ready when you see `Local: http://localhost:5173/`.
- Open http://localhost:5173 in your browser. That's the app people use.
- Vite watches your files. Save a change and the page updates by itself, with no restart.

### Why both?

The page you see comes from the frontend (port 5173). The numbers on it come from the backend (port 5001). The frontend asks for numbers and the backend answers. If the backend isn't running, the page loads but the dashboard says it's unavailable, and the frontend terminal fills with `ECONNREFUSED` errors. That error means "I knocked on the backend's door and nobody answered".

### Stopping

- In each terminal, press **Ctrl+C**. This tells that server to stop. The terminal goes back to normal and you can type commands again.
- Closing the terminal window (the bin icon) also stops whatever was running in it.
- Stopping one doesn't stop the other. Stop both when you've finished.

### Common problems

| What you see | What it means | Fix |
| --- | --- | --- |
| `ECONNREFUSED` in the frontend terminal | The backend isn't running | Start the backend (terminal 1) |
| `'pnpm' is not recognized` | pnpm isn't installed | Run `npm install -g pnpm`, then reopen the terminal |
| `ModuleNotFoundError: No module named 'flask'` | The virtual environment isn't active, or packages aren't installed | Activate it, then run `pip install -r requirements.txt` |
| `Address already in use` / port is busy | An old copy of the server is still running | Find that terminal and press Ctrl+C, or restart VS Code |
| You changed `app.py` but nothing changed | The backend restarts itself when you save (`debug=True`), but only if it's running | Check terminal 1 is still running and look for errors there |

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

## React idea 1: `useState` (remembering things)

A component is a function that React calls again every time something changes. Normal variables forget their value each time. `useState` remembers.

```tsx
const [data, setData] = useState<DashboardData | null>(null)
```

- `data` is the current remembered value. Right now it is `null`, meaning "nothing yet".
- `setData` is the only correct way to change it.
- `useState(null)` is the starting value. (The `< >` part is a TypeScript label, see below.)

Why not just write `data = newValue`? React wouldn't notice. Calling `setData(newValue)` stores the value **and** tells React to redraw the page. That is how the dashboard goes from "Loading..." to showing charts.

More examples from `Study.tsx`:

```tsx
const [revealed, setRevealed] = useState(false)  // is the definition showing?
const [current, setCurrent] = useState(0)        // which card are we on?
```

The rule: never change the value directly.

```tsx
revealed = true        // wrong: nothing redraws
setRevealed(true)      // right
```

## React idea 2: `useEffect` (doing something at the right moment)

Some jobs, like fetching data, should not run on every redraw. If they did, each answer would trigger a redraw, which would trigger another fetch, forever. `useEffect` runs a job at chosen moments. From `Dashboard.tsx`:

```tsx
useEffect(() => {
  getDashboard().then(setData).catch(() => setFailed(true))
}, [])
```

There are two parts: the function (the job), and the list at the end, which says when to run it again.

| You write | It runs |
| --- | --- |
| `[]` (empty) | Once, when the page first appears |
| `[page]` | Once at the start, and again whenever `page` changes |
| nothing at all | After every redraw (usually causes loops, avoid) |

What happens on our dashboard:

1. The page first draws with no data, so it shows "Loading...".
2. React runs the effect and the request goes to the backend.
3. The answer arrives and `setData(...)` stores it.
4. Changing state makes React redraw, and now the charts appear.
5. The effect does not run again, because the list is empty.

The two work as a pair: `useState` remembers something, `useEffect` does a job (often ending with a `setSomething`), and that change redraws the page.

## TypeScript labels

Our files end in `.ts` and `.tsx` because they are TypeScript: JavaScript plus labels saying what kind of data things are. The labels only help you and the editor. When the app is built they are removed and plain JavaScript is left, so while reading you can ignore the labels and follow the logic first.

```ts
const total: number = 5        // a number
const name: string = 'Niamh'   // text
const done: boolean = false    // true or false
byYear: Count[]                // a list of Count things
activeListings: number | null  // a number, OR nothing (| reads as "or")
```

Your own shapes use `type` (from `src/lib/types.ts`):

```ts
export type Count = { label: string; count: number }
```

This says a `Count` is a thing with a `label` (text) and a `count` (number), like `{ label: 'Radiology', count: 1230 }`.

Labels on a function say what must go in:

```ts
function StatCard({ label, value }: { label: string; value: string }) { ... }
```

Forget the `label`, or pass a number where text is expected, and the editor warns you before you run anything.

In `api.ts`:

```ts
async function request<T>(url: string): Promise<T>
```

`T` is a placeholder for "whatever shape this call returns", and `Promise<T>` means "an answer that arrives later, shaped like T". So `request<DashboardData>('/api/dashboard')` says "ask for the dashboard; the answer will look like `DashboardData`". Then `as T` means "trust me, the data is this shape". TypeScript cannot check that one, so the backend's key names must match `types.ts`.

## Fetching an API (today's topic)

**API** here means "the list of web addresses the backend answers". Think of a restaurant menu: the menu lists what you can order (`/api/health`, `/api/dashboard`, `/api/ratings`...), and the kitchen (the backend) sends back what you asked for.

**Fetching** means the frontend (the browser) placing an order. JavaScript has a built-in function for it, called `fetch`.

The simplest possible fetch:

```ts
const response = await fetch('/api/health')   // 1. place the order, wait for the reply
const data = await response.json()            // 2. turn the reply text into an object (parsing)
console.log(data.status)                      // 3. use it: prints "ok"
```

### Why `await` and `async`?

The reply isn't instant: the request travels to the backend, which does some work and answers. `await` means "wait here until the answer arrives". A function that uses `await` must be marked `async`. While it waits, the rest of the page keeps working instead of freezing.

### Methods: what kind of order is it?

Every request has a **method** that says what you want to do:

| Method | Meaning | Example in our app |
| --- | --- | --- |
| `GET` | "Give me something" (the default for `fetch`) | `/api/dashboard`, `/api/health` |
| `POST` | "Here is something new, do something with it" | asking for a sign-in link |
| `PUT` | "Save or replace this" | saving a card rating |

To send data you add options to `fetch`:

```ts
await fetch('/api/ratings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },   // "the data I'm sending is JSON"
  body: JSON.stringify({ term: 'Hemostasis', rating: 3 }),  // the data, turned into text
})
```

`JSON.stringify` is the opposite of parsing: it turns an object into text so it can travel.

### Did it work? Status codes

Every reply comes with a number saying how it went. You'll see these in the backend terminal:

| Code | Meaning | When it happens in our app |
| --- | --- | --- |
| `200` | OK, here you go | Normal success |
| `400` | Bad request: you sent something wrong | An invalid email or rating |
| `401` | Not signed in | Asking for ratings without signing in |
| `404` | Not found: no such address | A typo in the URL |
| `405` | Method not allowed | Using `GET` on an address that only accepts `POST` |
| `502` | A service the backend depends on failed | The FDA website is down |

`response.ok` is `true` for any 2xx code (200 and friends), so a quick check is `if (!response.ok) { ...something went wrong... }`.

### Putting it together: how our app does it

All our requests go through one helper, `request`, in `frontend-react/src/lib/api.ts`:

```ts
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error ?? 'Something went wrong.')
  return body as T
}
```

Step by step:

1. Place the order with `fetch`, always saying we're sending and expecting JSON.
2. Parse the reply into an object (with a safety net so a broken reply doesn't crash us).
3. If the status wasn't a success, stop and raise an error carrying the backend's message.
4. Otherwise hand the data back.

Then each call is a one-liner built on it:

```ts
export const health = () => request<{ status: string }>('/api/health')
export const getDashboard = () => request<DashboardData>('/api/dashboard')
```

And a page uses it with `useEffect` and `useState`, as in the dashboard: fetch when the page appears, store the answer with `setData`, and the page redraws with the data. If the fetch fails, `.catch(...)` sets an error flag so the page can show a message instead of staying on "Loading...".

### The usual shape of fetching in React

1. **State** for the data (starts empty), and often for "loading" and "failed".
2. **An effect** that runs once, calls the API, and stores the answer in state.
3. **The page** shows "Loading..." while there's no data, an error message if it failed, and the real content once the data arrives.

## Class example: the EventQuest code (`App.jsx`)

In class your lecturer is building an events app called "EventQuest", where you can join events. These are the pieces from his `App.jsx`. They use ideas you already know, in new combinations.

### An effect that depends on state

```js
useEffect(() => {
  const count = joinedIds.length
  document.title = count > 0 ? `EventQuest • Joined: ${count}` : 'EventQuest'
}, [joinedIds])
```

- `joinedIds` is a list (an array) of the ids of the events you've joined. `.length` is how many are in it.
- `document.title` is the text on the browser tab. Setting it changes the tab.
- The list at the end is `[joinedIds]`, so this effect runs **every time `joinedIds` changes**. Join an event and the tab updates straight away.
- Compare `[]` (run once) with `[joinedIds]` (run whenever it changes). That list is the only difference.

### The ternary: a one-line if / else

```js
condition ? valueIfTrue : valueIfFalse
```

Read `?` as "if yes, then" and `:` as "otherwise". So `count > 0 ? 'Joined' : 'None'` means: if count is more than 0, use `'Joined'`, otherwise use `'None'`. You'll see it everywhere in React. In our app: `data.activeListings === null ? 'n/a' : fmt.format(data.activeListings)`.

### Backticks and `${}`: putting values into text

```js
`EventQuest • Joined: ${count}`
```

Text in backticks can contain `${something}`, which is replaced by that value. With `count` = 2 the text becomes `EventQuest • Joined: 2`.

### Adding to and removing from a list (`toggleJoin`)

```js
function toggleJoin(id) {
  setJoinedIds(prev =>
    prev.includes(id)
      ? prev.filter(x => x !== id)   // already joined, so make a list without this id
      : [...prev, id]                // not joined, so make a list with this id added
  )
}
```

"Toggle" means flip: join if you haven't, leave if you have.

- `prev` is the list as it is right now. When the new value depends on the old one, pass a function like this to `setJoinedIds`.
- `prev.includes(id)` asks "is this id already in the list?" and answers true or false.
- `prev.filter(x => x !== id)` makes a **new** list keeping everything *except* this id. (`!==` means "is not the same as".)
- `[...prev, id]` makes a **new** list: the three dots mean "copy everything from `prev`", then `id` is added on the end.
- React needs a **new** list rather than a changed old one. Otherwise it can't tell that anything changed and won't redraw.

Our app uses the same idea to save a rating in `Study.tsx`:

```ts
setRatings((previous) => ({ ...previous, [card.term]: value }))
```

It copies the old ratings, then adds or replaces this card's rating.

### Making a unique id (`handleCreate`)

Each new event needs an id nobody else has. His code builds one from the title:

```js
const idBase = slugify(values.title || 'new-event')   // "Beach Cleanup" -> "beach-cleanup"
let id = idBase || `event-${Date.now()}`              // if that's empty, use the time as an id
let suffix = 1
while (events.some(e => e.id === id)) {               // is that id already taken?
  id = `${idBase}-${suffix++}`                        // try beach-cleanup-1, then -2, ...
}
```

- `values.title || 'new-event'` means "the title, or `'new-event'` if there is no title". (`||` reads as "or".)
- `events.some(e => e.id === id)` asks "does any event already have this id?"
- A `while` loop repeats its block for as long as the condition is true. Here it keeps adding `-1`, `-2` and so on until the id is free.
- `suffix++` means "use the number, then add 1 to it".

So two events called "Beach Cleanup" end up as `beach-cleanup` and `beach-cleanup-1`.

### Arrow functions

`x => x !== id` is a tiny function written briefly: "given `x`, answer whether `x` is not `id`". It's the same as `function (x) { return x !== id }`. You pass these to `filter`, `some` and `includes`.

## Class example: sending data (`saveRsvp`)

```js
saveRsvp: (userId, eventId, status) =>
  request("/api/rsvps", { method: "POST", body: JSON.stringify({ userId, eventId, status }) })
```

- It's one more entry in the `api` object: a small function that sends a "yes, I'm going" to the backend.
- `method: "POST"` means "I'm sending something", unlike the plain "give me" requests.
- `body` is the data being sent. `JSON.stringify` turns it into text so it can travel.
- Ours is the same idea: `saveRating` sends a card's rating with `PUT`.

## Parsing

The backend's answer arrives as plain text, e.g. `{"status": "ok"}`. **Parsing** turns that text into a real object, so `data.status` gives `"ok"`. In `api.ts`:

```ts
const body = await response.json().catch(() => ({}))
```

`response.json()` does the parsing (it takes a moment, so we `await` it). `.catch(() => ({}))` is a safety net: if the reply is not valid JSON, we get an empty object instead of a crash.

## Things to try (the best way to learn)

- Change the heading text on the dashboard in `pages/Dashboard.tsx`, save, and watch the page update.
- Add a new card to the `cards` list at the top of `pages/Study.tsx`.
- Visit http://localhost:5001/api/health in your browser and see the backend answer.
- Run `pytest` in `backend-flask` and `pnpm test` in `frontend-react`, then break something small and see a test fail.
