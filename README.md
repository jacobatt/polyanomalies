# PolyAnomalies — Claude Code handoff

You're porting an existing Streamlit dashboard to Next.js, using a finished hi-fi prototype as the visual target.

## Read these in order
1. **`spec.md`** — what we're building, the decisions, real data shape, API contracts
2. **`migration.md`** — DB migrations, what to keep from the old repo, new folder structure
3. **`tokens.md`** — colors, spacing, type — copy verbatim
4. **`components.md`** — component inventory with props
5. **`tasks.md`** — ordered task list, work through it top to bottom

## Visual target
Open `prototype/PolyAnomalies.html` in a browser. The relevant section is **"Main dashboard · 3 directions" → B · Trading desk**. Match it pixel-for-pixel.

The polish-round artboards (trade drawer, empty states, mobile) live in the **"Polish round · B"** section at the bottom of the same file.

Other screens to match:
- Per-market detail
- Wallet profile
- Alert configuration

## What's out of scope for v1
- Auth, accounts, login
- Per-user watchlists
- Email/Telegram/webhook alert channels (Discord only)
- Score logic changes — `score.py` is the source of truth, do not modify the formula
- Mobile native app

## Ground rules
- Match the prototype. If something is ambiguous, the prototype wins, then ask.
- Do not invent new pages or sections.
- The actual database schema differs from the clean shape the prototype implies. **Read `spec.md` § "Real database shape" before writing any query.**
- Do not change the score formula in `score.py`. You will, however, need to call it from `ingest.py` so the score is persisted (see `migration.md` § "DB migrations").
