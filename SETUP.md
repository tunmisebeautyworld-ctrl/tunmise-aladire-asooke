# Tunmise Aladire Asooke — Setup Guide 🧵

A modern Nigerian fashion e-commerce website built with Next.js 14, Firebase, and Paystack.

---

## Quick Start

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Set up your .env.local (see step below)

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your store.

---

## Step 1 — Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. **Create a new project**: `tunmise-aladire-asooke`
3. Add a **Web App** and copy the config
4. Enable **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable **Email/Password**
   - Enable **Google**
5. Create **Firestore Database**:
   - Go to Firestore → Create database
   - Start in **test mode** (update security rules before going live)
6. Enable **Storage** for product image uploads
7. Paste your config values into `.env.local`

---

## Step 2 — Paystack Setup

1. Sign up at [paystack.com](https://paystack.com)
2. Go to **Settings → API Keys & Webhooks**
3. Copy your **Public Key** (starts with `pk_test_...`) → `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
4. Copy your **Secret Key** (starts with `sk_test_...`) → `PAYSTACK_SECRET_KEY`

---

## Step 3 — Make Yourself an Admin

After creating an account on the website:

1. Go to [Firebase Console](https://console.firebase.google.com) → Firestore
2. Open the **`users`** collection
3. Find your document (match by `uid` or `email`)
4. Change the `role` field from `"customer"` to `"admin"`

You will now see "Admin Dashboard" in your user menu.

---

## Step 4 — Add Products

1. Log in with your admin account
2. Go to `/admin`
3. Click **Products** tab → **Add Product**
4. Fill in name, price, stock, sizes, colors, and image URLs
5. Check "Feature on homepage" to show it in the hero grid

---

## Firestore Security Rules (apply before going live)

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /orders/{id} {
      allow read, write: if request.auth != null;
    }
    match /users/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Project Structure

```
clothes-store/
├── app/
│   ├── page.tsx              ← Homepage
│   ├── layout.tsx            ← Root layout (Navbar + Footer)
│   ├── products/
│   │   ├── page.tsx          ← Product listing with filters
│   │   └── [id]/page.tsx     ← Product detail
│   ├── login/page.tsx        ← Login
│   ├── signup/page.tsx       ← Sign Up
│   ├── checkout/page.tsx     ← Checkout + Paystack
│   ├── orders/page.tsx       ← Order history
│   └── admin/
│       ├── page.tsx          ← Admin dashboard
│       └── products/new/     ← Add new product
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── cart/CartDrawer.tsx
│   └── product/
│       ├── ProductCard.tsx
│       └── ProductGrid.tsx
├── hooks/
│   ├── useAuth.ts            ← Firebase auth context
│   └── useCart.ts            ← Zustand cart store
├── lib/
│   ├── firebase.ts
│   ├── firestore.ts
│   └── paystack.ts
└── types/index.ts
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Auth | Firebase Authentication |
| Database | Firestore |
| Storage | Firebase Storage |
| Payments | Paystack (NGN) |
| State | Zustand (cart) |
| Notifications | react-hot-toast |

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel deploy
```

Add your `.env.local` variables to Vercel's Environment Variables dashboard.
