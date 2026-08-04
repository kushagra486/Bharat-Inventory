# ⏰ Expiry Dashboard

A **100% free, open-source, serverless** product expiry tracker for Web & Android.

Track products, get alerts before they expire, view analytics, and reduce waste — all without any paid services or subscriptions.

---

## ✨ Features

- 📦 **Product Management** — Add, edit, delete, archive, duplicate products
- 🔔 **Smart Alerts** — Notifications at 30, 15, 7, 3, 1 day before expiry
- 📊 **Analytics Dashboard** — Charts, category breakdowns, inventory health
- 📅 **Calendar View** — See what expires on each day
- 📷 **Barcode Scanner** — Scan product barcodes with your phone camera
- 📄 **PDF & CSV Reports** — Export full inventory reports
- 🌐 **Web + Android** — Same app runs in browser and as APK
- 🔐 **Secure Auth** — Appwrite authentication with per-user document permissions
- 💯 **Free Forever** — No paid APIs, no subscriptions

---

## 🛠️ Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Frontend (Web + Android) | React Native + Expo | Free |
| Database | Appwrite Databases | Free |
| Auth | Appwrite Auth | Free |
| Charts | react-native-chart-kit | Free |
| Barcode | Expo Camera | Free |
| PDF Reports | Expo Print | Free |
| Web Deploy | Vercel | Free |
| APK Build | EAS Build | Free |

---

## 🚀 Setup Instructions

### Step 1 — Clone the project

```bash
git clone https://github.com/yourusername/expiry-dashboard
cd expiry-dashboard
npm install
```

### Step 2 — Set up Appwrite

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io) → Create a new project (free)
2. Go to **Settings → API Keys** → Create a Server API Key with Databases scopes
3. Run the provisioning script to create the database, collections, and default categories:
   ```bash
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1 \
   APPWRITE_PROJECT=your-project-id \
   APPWRITE_KEY=your-server-api-key \
   bash appwrite/setup.sh
   ```
4. Go to **Settings** → Copy your Project ID

### Step 3 — Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
EXPO_PUBLIC_APPWRITE_DATABASE_ID=bharat_inventory
```

### Step 4 — Run the app

```bash
# Web browser
npm run web

# Android (needs Android emulator or real device with Expo Go)
npm run android

# iOS (Mac only)
npm run ios
```

---

## 📱 Build Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account (free)
eas login

# Build APK (free tier: 30 builds/month)
eas build --platform android --profile preview
```

The APK download link will appear after ~10 minutes. Share it with anyone to install directly!

---

## 🌐 Deploy Web to Vercel

```bash
# Build for web
npx expo export --platform web

# Deploy to Vercel (free)
npx vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

---

## 📁 Project Structure

```
expiry-dashboard/
├── app/
│   ├── _layout.tsx          # Root layout + auth provider
│   ├── auth/
│   │   ├── login.tsx        # Login screen
│   │   └── signup.tsx       # Signup screen
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Bottom tab navigation
│   │   ├── dashboard.tsx    # Main dashboard
│   │   ├── products.tsx     # Products list
│   │   ├── calendar.tsx     # Calendar view
│   │   ├── analytics.tsx    # Charts & analytics
│   │   └── settings.tsx     # Settings, reports, notifications
│   └── products/
│       ├── add.tsx          # Add/edit product
│       ├── scan.tsx         # Barcode scanner
│       └── [id].tsx         # Product detail
├── components/              # Reusable UI components
├── hooks/
│   ├── useAuth.tsx          # Authentication context
│   └── useProducts.ts       # Products data hook
├── lib/
│   ├── appwrite.ts          # Appwrite client
│   ├── db.ts                # All database queries
│   └── utils.ts             # Helper functions
├── types/index.ts           # TypeScript types
├── constants/index.ts       # Colors, fonts, config
├── appwrite/setup.sh        # Database provisioning script (run this first!)
├── app.config.ts            # Expo config
└── eas.json                 # Android APK build config
```

---

## 🔒 Security

- Each collection uses document-level permissions, scoped to the owning user
- Each user can only see their own products
- Authentication via Appwrite Auth (email/password)
- No data shared between users

---

## 🤝 Contributing

This is open source! PRs welcome.

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📜 License

MIT License — free for personal and commercial use.

---

Made with ❤️ by Kushagra Gupta
