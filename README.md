# IoT Botnet Defender

React + TypeScript + Vite dashboard for IoT botnet detection. Authentication and
data storage are powered by **Firebase** (Firebase Auth + Realtime Database).
Dataset analysis runs on a separate FastAPI backend.

## Tech stack

- **Auth:** Firebase Authentication (Email/Password + Google OAuth)
- **Database:** Firebase Realtime Database (per-user data, secured by rules)
- **Frontend:** React 19, Vite, Tailwind, Recharts
- **Backend:** FastAPI autoencoder service (see `../backend`)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your Firebase web config:

```bash
cp .env.example .env.local
```

All credentials are read from `VITE_FIREBASE_*` environment variables — nothing
is hard-coded. Find these in the Firebase console under
**Project settings → General → Your apps → SDK setup and configuration**.

> `VITE_FIREBASE_DATABASE_URL` is **not** part of the basic config snippet. Copy
> it from **Realtime Database** in the console (e.g.
> `https://<project-id>-default-rtdb.firebaseio.com`).

### 3. Enable Firebase services

In the Firebase console for the `iot-botnet-detector` project:

1. **Authentication → Sign-in method** → enable **Email/Password** and **Google**.
2. **Authentication → Settings → Authorized domains** → add `localhost` and your
   production domain.
3. **Realtime Database** → create a database.

### 4. Deploy the database security rules

The rules in `database.rules.json` deny all access by default and grant each
authenticated user access only to their own subtree (`users/{uid}`):

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only database --project iot-botnet-detector
```

## Develop

```bash
npm run dev      # start the Vite dev server
npm run build    # type-check + production build
npm run lint     # eslint
```

## Data model (Realtime Database)

```
users/
  {uid}/
    datasets/          # uploaded dataset records
    botnet_results/    # per-record predictions
    traffic_overview/  # per-dataset normal/attack aggregates
    activity_history/  # audit log
    active_threats/    # ongoing threats
```

Every record stores a numeric `created_at` (epoch ms) used for ordering.
