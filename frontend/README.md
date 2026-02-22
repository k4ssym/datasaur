# AI-assisted Diagnosis Frontend

Frontend for the AI-assisted diagnostic system based on Kazakhstan Clinical Protocols.

## Tech Stack

- **Framework:** React 18+ with TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS + Headless UI
- **State:** Zustand
- **Data:** TanStack Query
- **Routing:** React Router v6
- **Fonts:** Aldrich, Alumni Sans (Google Fonts)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Environment

Set `VITE_API_URL` to your backend API base URL (default: `/api`). The dev server proxies `/api` and `/health` to `http://localhost:8000`.

## Routes

- `/` — Landing page
- `/services` — AI services overview
- `/about` — About the platform
- `/login` — Login
- `/register` — Registration
- `/dashboard` — Main diagnosis workspace
- `/batch` — Batch analysis (CSV upload)
- `/history` — Diagnosis history
- `/settings` — Theme, clear history
