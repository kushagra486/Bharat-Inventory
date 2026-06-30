<div align="center">

<br/>

```
██████╗ ██╗  ██╗ █████╗ ██████╗  █████╗ ████████╗
██╔══██╗██║  ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝
██████╔╝███████║███████║██████╔╝███████║   ██║   
██╔══██╗██╔══██║██╔══██║██╔══██╗██╔══██║   ██║   
██████╔╝██║  ██║██║  ██║██║  ██║██║  ██║   ██║   
╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
    INVENTORY
```

### AI-Powered · Serverless · Real-time Inventory Intelligence

[![Version](https://img.shields.io/badge/version-2.0.0-00d2fd?style=for-the-badge&logo=github)](https://github.com/yourusername/bharat-inventory/releases)
[![License](https://img.shields.io/badge/license-MIT-a874ff?style=for-the-badge)](LICENSE)
[![Supabase](https://img.shields.io/badge/backend-Supabase-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Status](https://img.shields.io/badge/status-active-4ade80?style=for-the-badge)]()
[![Free](https://img.shields.io/badge/cost-100%25%20Free-facc15?style=for-the-badge)]()

<br/>

<!-- TODO: add a real screenshot to docs/screenshots/preview.png and uncomment below -->
<!-- ![Bharat Inventory Screenshot](docs/screenshots/preview.png) -->

> 📸 Screenshot coming soon — open `releases/v2.0-working/bharat-inventory-v2.0.html`
> in a browser to see it live, or drop your own capture in
> `docs/screenshots/preview.png` and uncomment the line above.

</div>

---

## What is Bharat Inventory?

**Bharat Inventory** is a full-stack, serverless, AI-powered product expiry tracking system built for pharmacies, hospitals, warehouses, restaurants, and homes across India.

Track products, get alerts before they expire, scan barcodes, analyse waste with charts, and talk to an AI assistant — all from a single-file web app that works on any device.

---

## Feature Highlights

| Category | Features |
|---|---|
| **Dashboard** | Live stats, expiry alerts, category breakdown, 30-day trend chart |
| **Inventory** | Full CRUD, real-time search, filter by status/category/zone |
| **Scanner** | Barcode scan with product detection + bottom sheet result card |
| **AI Scanner** | Photo-based OCR label detection with confidence scoring |
| **Bulk Import** | CSV / Excel / Google Sheets / AI Batch Scan (PDF) |
| **Deep Intel** | AI forecasting card, weekly movement bar chart, wastage donut |
| **AI Chat** | Claude-powered assistant with live inventory context |
| **Settings** | Profile management, notification toggles, sign out |
| **Auth** | Supabase email/password with session persistence |

---

## Release History

### 🏷️ [v2.0.0](releases/v2.0-working/) — Working Release *(current)*
> Full Supabase backend + Claude AI chat + live data across all pages

- ✅ Real authentication (Supabase Auth)
- ✅ Live CRUD — add, edit, archive products
- ✅ AI Chat powered by `claude-sonnet-4-6`
- ✅ Product scanner saves directly to database
- ✅ All charts driven by real inventory data
- ✅ Session persistence across page reloads
- ✅ Manual Add form with category/unit/location fields
- ✅ Mark as Used archives products instantly
- ✅ Settings saves profile to Supabase

📄 **File:** [`releases/v2.0-working/bharat-inventory-v2.0.html`](releases/v2.0-working/bharat-inventory-v2.0.html)

---

### 🏷️ [v1.0.0](releases/v1.0-prototype/) — Prototype Snapshot
> Design and navigation milestone, captured before backend wiring

- ✅ All 10 screens navigable
- ✅ Luminous Chronos design system (deep navy glassmorphic)
- ✅ Animated charts (Chart.js)
- ✅ Ripple interactions + float-in animations
- ⚠️ Contains placeholder Supabase/Claude credentials — not functional out of the box
- ➡️ Use v2.0.0 for a working build; this tag exists for history/reference only

📄 **File:** [`releases/v1.0-prototype/bharat-inventory-v1.0-prototype.html`](releases/v1.0-prototype/bharat-inventory-v1.0-prototype.html)

---

## Tech Stack

```
Frontend         →  Single HTML file (vanilla JS, no framework)
Auth             →  Supabase Auth (email/password)
Database         →  Supabase PostgreSQL with Row Level Security
Serverless       →  Supabase Edge Functions (planned)
AI Chat          →  Anthropic Claude API (claude-sonnet-4-6)
Charts           →  Chart.js 4.4
Fonts            →  Plus Jakarta Sans · Inter · Space Grotesk
Deployment       →  Any static host (Netlify, Vercel, GitHub Pages)
Cost             →  $0 (free tier everything)
```

---

## Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/bharat-inventory.git
cd bharat-inventory
```

### 2. Set up Supabase
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run [`docs/schema.sql`](docs/schema.sql)
3. Go to **Settings → API** → copy your **Project URL** and **Anon Key**

### 3. Configure the app
Open `releases/v2.0-working/bharat-inventory-v2.0.html` and update:
```js
const SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON = 'YOUR_ANON_KEY_HERE';
```

> ⚠️ **AI Chat note:** the chat feature calls the Anthropic API directly from
> the browser and currently has no API key wired in — by design, since an
> API key must never be placed in client-side code. As shipped, the chat
> button works for navigation but will fall back to a canned response
> instead of a real Claude reply. To make it fully live, add a small
> server-side proxy (e.g. a Supabase Edge Function) that holds your
> Anthropic key and forwards requests — see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#ai-chat)
> for the exact data flow and what needs to change.

### 4. Open in browser
```bash
# Option A — just open the file
open releases/v2.0-working/bharat-inventory-v2.0.html

# Option B — serve locally
npx serve releases/v2.0-working/
```

### 5. Deploy (optional)
```bash
# Deploy to Netlify (free)
npx netlify deploy --dir=releases/v2.0-working --prod

# Deploy to GitHub Pages
# Push to repo → Settings → Pages → Deploy from /releases/v2.0-working
```

---

## Database Schema

See [`docs/schema.sql`](docs/schema.sql) for the complete schema.

**Tables:**
- `categories` — product categories (default set seeded automatically)
- `products` — inventory items with expiry, location, batch info
- `notification_settings` — per-user alert preferences
- `user_profiles` — extended auth profile data

All tables use **Row Level Security** — users can only see their own data.

---

## Project Structure

```
bharat-inventory/
│
├── releases/
│   ├── v1.0-prototype/
│   │   └── bharat-inventory-v1.0-prototype.html   ← Static UI prototype
│   └── v2.0-working/
│       └── bharat-inventory-v2.0.html             ← Full working app
│
├── docs/
│   ├── schema.sql              ← Supabase database schema
│   ├── ARCHITECTURE.md         ← Technical architecture docs
│   ├── CHANGELOG.md            ← Full version history
│   └── screenshots/            ← App preview images
│
├── .github/
│   ├── workflows/
│   │   └── release.yml         ← Auto-release on version tag
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
│
├── README.md
├── CHANGELOG.md
├── LICENSE
└── .gitignore
```

---

## Roadmap

| Version | Features | Status |
|---|---|---|
| v1.0 | UI Prototype — all screens, static demo | ✅ Done |
| v2.0 | Supabase Auth + DB + Claude AI Chat | ✅ Done |
| v2.1 | Push notifications (Expo / Web Push) | 🔜 Planned |
| v2.2 | PDF & CSV export reports | 🔜 Planned |
| v2.3 | Real camera barcode scanning (ZXing) | 🔜 Planned |
| v3.0 | React Native + Expo — Android APK | 🔜 Planned |
| v3.1 | Multi-user / team workspaces | 🔜 Planned |
| v3.2 | IoT temperature logging (ESP32) | 🔜 Planned |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

MIT — free for personal and commercial use.

---

<div align="center">
Built with ❤️ by <strong>Kushagra Gupta</strong> · Bharat Inventory © 2024
</div>
