# CourseBeam

Turn any YouTube playlist, "course" playlist, or single video into an interactive
learning dashboard: lesson sidebar, embedded player, automatic progress tracking,
resume-where-you-left-off, timestamped notes, and bookmarks.

Built with Next.js 14 (App Router, TypeScript), Tailwind CSS, Supabase (Postgres +
Auth), Zustand, and the YouTube Data API v3 + IFrame Player API. Deploys free on
Vercel + Supabase.

## Scope note — read this first

The original brief asked for a very large feature set (analytics dashboards,
certificates, PWA/offline, Pomodoro timer, drag-and-drop reordering, multi-language
UI, and more). Building all of that at production quality in one pass isn't
realistic, so this build focuses on the pieces you said matter most right now:

**Built and working:**
- Paste a playlist/course/video URL → imports via YouTube Data API v3
- Interactive dashboard: all courses, per-course progress, remaining time
- Embedded YouTube player (prev/next, autoplay toggle, playback speed, theater
  mode — fullscreen and captions are the player's own native controls)
- Automatic progress tracking at the 25/50/75/90/100% thresholds you specified
- Resume playback at the exact last-watched timestamp, per lesson
- Lesson sidebar with search, sort, and status icons
- Timestamped notes (add/edit/delete/jump-to-timestamp)
- Bookmarks (a timestamp or a whole lesson), listed across the whole course
- Supabase Auth (Google + email/password), Postgres schema with row-level
  security so every table is private to its owner
- Responsive layout, dark theme

**Deliberately deferred** (the schema and architecture leave room for these, but
they're not wired up yet — happy to build any of them next):
- Analytics dashboard (streaks, weekly/monthly charts) — `progress.watch_time_seconds`
  is already being recorded, so this is mostly a charting page
- Completion certificates (PDF)
- PWA / offline support, installable app
- Pomodoro timer, focus mode, daily/weekly goals, drag-and-drop course ordering,
  keyboard shortcuts, notifications
- Multi-language UI (content stays whatever language you import)

## Project structure

```
src/
  app/
    page.tsx                landing page with the import bar
    dashboard/page.tsx      all imported courses
    course/[id]/page.tsx    course dashboard + player (server component, fetches data)
    api/youtube/import/     server route that calls the YouTube Data API
    auth/callback/          OAuth/email confirmation callback
  components/               Sidebar, VideoPlayer, NotesPanel, BookmarksPanel, etc.
  hooks/
    useYouTubePlayer.ts     wraps the YouTube IFrame Player API
    useProgressTracking.ts  polls playback, saves progress at the 25/50/75/90% marks
  lib/
    youtube.ts              YouTube Data API v3 client (playlist + video fetching)
    supabase/                browser/server/middleware Supabase clients
    types.ts                 shared TypeScript types
  store/usePlayerStore.ts    Zustand store for active lesson / theater mode / speed
supabase/schema.sql          full Postgres schema + row-level security policies
```

## 1. Set up Supabase (free tier)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, paste and run `supabase/schema.sql`. This creates every
   table (`courses`, `lessons`, `progress`, `notes`, `bookmarks`, `profiles`) and
   locks each one down with row-level security so users only ever see their own
   data.
3. In **Authentication → Providers**, enable **Email** and, if you want Google
   sign-in, enable **Google** and fill in the OAuth client ID/secret from the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
4. In **Authentication → URL Configuration**, add your site URL and
   `/auth/callback` as a redirect URL (both the `http://localhost:3000` version
   for local dev and your production URL once deployed).
5. Copy your **Project URL** and **anon public key** from Settings → API.

## 2. Get a YouTube Data API key

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **YouTube Data API v3**.
3. Create an API key (Credentials → Create Credentials → API key). Restrict it
   to the YouTube Data API v3 for safety.
4. This key is used **server-side only** (in `/api/youtube/import`) — it's never
   sent to the browser.

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
YOUTUBE_API_KEY=...
```

## 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Deploy free

- **Frontend:** push this repo to GitHub, import it on [Vercel](https://vercel.com),
  add the three environment variables above in the Vercel project settings, deploy.
- **Backend:** already live on Supabase's free tier from step 1 — nothing else
  to deploy.
- Update the Supabase redirect URL and Google OAuth redirect URI to your final
  `https://your-app.vercel.app/auth/callback` once you have a production URL.

## Notes on the YouTube API quota

The free YouTube Data API quota is 10,000 units/day. Importing a playlist costs
roughly `1 (playlist) + 1 per 50 videos (playlistItems pages) + 1 per 50 videos
(durations)` units — a 200-video playlist costs about 10 units, so you can import
comfortably within the free quota.
