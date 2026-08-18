# Sistem Tempahan Unit Kebudayaan
### Cultural Unit Booking System

Sistem tempahan dalam talian untuk **dewan/studio** dan **peralatan kebudayaan**, dibina menggunakan Next.js, Supabase, dan dideploy melalui Vercel.

*An online booking system for cultural halls/studios and equipment, built with Next.js, Supabase, and deployed on Vercel.*

---

## 📋 Ciri-ciri / Features

- **Tempahan pelbagai slot** — sokongan untuk tempahan berbilang slot masa dalam satu transaksi
  *Multi-slot booking support for reserving multiple time slots in a single transaction*
- **Kalendar interaktif** — pemilihan tarikh & slot melalui kalendar dan date picker
  *Interactive calendar and date picker for slot selection*
- **Tarikh sekatan (Blackout Dates)** — tetapkan tarikh yang tidak boleh ditempah
  *Set blackout dates to block out unavailable booking dates*
- **Kod QR untuk tempahan** — janakan kod QR sebagai bukti/resit tempahan
  *QR code generation for booking confirmation/receipts*
- **Susun atur seret-dan-lepas** — susun kemudahan/peralatan mengikut keutamaan secara drag-and-drop
  *Drag-to-reorder facilities/equipment listing*
- **Notifikasi Telegram** — makluman automatik untuk tempahan baru melalui Telegram
  *Automatic Telegram notifications for new bookings*
- **Loceng notifikasi** — makluman dalam sistem (in-app) untuk pentadbir
  *In-app notification bell for admin alerts*
- **Papan pentadbir (Admin Dashboard)** — urus dan kelompokkan tempahan pelbagai slot, lengkap dengan carta statistik
  *Admin panel with grouped multi-slot booking management and analytics charts*
- **Dwibahasa** — antara muka tersedia dalam Bahasa Melayu dan English
  *Bilingual interface (Malay & English)*
- **Had masa tempahan (Booking Timer)** — slot terkunci sementara semasa proses tempahan untuk elak konflik
  *Temporary slot lock/timer during checkout to prevent double-booking*
- **Progressive Web App (PWA)** — boleh dipasang terus pada peranti mudah alih/desktop seperti aplikasi biasa
  *Installable as a native-like app on mobile/desktop*

---

## 🛠️ Tech Stack

| Komponen / Component | Teknologi / Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) + React 19 |
| Gaya / Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Pangkalan Data & Auth / Database & Auth | [Supabase](https://supabase.com) (`@supabase/ssr`, `@supabase/supabase-js`) |
| Kalendar & Tarikh / Calendar & Date | `react-calendar`, `react-datepicker` |
| Kod QR / QR Code | `qrcode`, `html2canvas` |
| Carta / Charts | `recharts` |
| PWA | `next-pwa` |
| Bahasa / Language | TypeScript |
| Hosting / Deployment | [Vercel](https://vercel.com) |
| Notifikasi / Notifications | Telegram Bot API |

---

## 🚀 Getting Started

### 1. Klon repositori / Clone the repository

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

### 2. Pasang dependencies / Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Sediakan environment variables / Set up environment variables

Cipta fail `.env.local` di root projek dan isikan maklumat berikut:
*Create a `.env.local` file at the project root with the following:*

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

### 4. Jalankan pelayan pembangunan / Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Buka [http://localhost:3000](http://localhost:3000) dalam pelayar untuk melihat hasilnya.
*Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.*

Anda boleh mula mengedit halaman dengan mengubah suai `app/page.tsx`. Halaman akan auto-update semasa anda mengedit fail.
*You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.*

---

## 📁 Struktur Projek / Project Structure

```
├── app/                # Next.js App Router pages
├── components/         # Reusable UI components
├── lib/                # Utility functions & Supabase client
├── public/              # Static assets
└── ...
```

---

## 🌐 Deployment

Cara paling mudah untuk deploy aplikasi Next.js ini ialah menggunakan [Vercel Platform](https://vercel.com/new).
*The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new).*

Setiap push ke branch bukan `main` akan menjana **Preview Deployment**, manakala push ke `main` akan mengemas kini **Production**.
*Every push to a non-`main` branch generates a Preview Deployment, while pushes to `main` update Production.*

---

## 📚 Rujukan Lanjut / Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Learn Next.js](https://nextjs.org/learn)

---

## 📝 Lesen / License

Projek ini adalah untuk kegunaan dalaman unit kebudayaan.
*This project is intended for internal use by the cultural unit.*
