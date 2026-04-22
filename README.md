# Thread Synchronization Visualizer

Interactive OS education tool — visually demonstrates Semaphores, Mutexes, and Monitors.

## Tech Stack
- React 18 + Vite 5
- Tailwind CSS 3
- Fully client-side, no backend

## Setup

```bash
npm install
npm run dev       # → http://localhost:5173
```

## Build

```bash
npm run build     # output in /dist
npm run preview   # preview production build
```

## Deploy

**Vercel:**
```bash
npx vercel
```

**Netlify (drag & drop):**
```bash
npm run build
# drag /dist folder to netlify.com/drop
```

**Netlify CLI:**
```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

## Features

| Section     | What it shows |
|-------------|---------------|
| Semaphore   | Counting semaphore — N concurrent slots, blocking queue, wait/signal |
| Mutex       | Single-owner lock, FIFO wake, owner highlighted, contention queue |
| Monitor     | Bounded buffer, notFull/notEmpty condition variables, producer/consumer roles |

## Thread States
- 🟢 **Running** — thread holds the resource and is executing
- 🟡 **Waiting** — thread is ready, attempting to acquire
- 🔴 **Blocked** — thread is queued, waiting for a signal
