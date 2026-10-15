# 📹 CCTV Lalu Lintas Live (Jabodetabek & Jalan Tol)

Aplikasi peta interaktif agregator kamera CCTV lalu lintas publik (seperti Oyenza Transit CCTV) berbasis **React 18 / 19 + Vite + Tailwind CSS + Shadcn UI** di frontend dan **Express.js** di backend.

---

## 🚀 Fitur Utama

- **460+ Titik Kamera Realtime**: Terintegrasi langsung dengan sumber CCTV resmi (DKI Jakarta / JakCCTV Balitower, BPJT Kementerian PU, Pemkot Bekasi, Bogor BSW, Tangerang SIPANTAU, Pakuan Network YouTube, dll).
- **Peta Interaktif (Leaflet)**: Peta jalan modern (_CartoDB Voyager_) dengan custom marker kamera berwarna sesuai instansi.
- **Pemutar Live Stream HLS (HLS.js)**:
  - Memutar format video streaming `.m3u8` langsung di browser.
  - Fallback otomatis ke **CORS Proxy Backend Express** jika stream diblokir oleh browser.
  - Fallback ke **`<iframe>` Embed** untuk portal penyedia atau stream YouTube.
  - Kontrol _Fullscreen_ dan _Multi-view Angle Switcher_ (jika 1 lokasi memiliki beberapa sudut kamera).
- **Filter Wilayah & Pencarian Instan**:
  - Filter cepat: Semua, Jakarta (DKI), Jalan Tol (BPJT), Bekasi, Bogor, Tangerang.
  - Pencarian lokasi/nama jalan langsung dengan counter jumlah kamera yang aktif.
- **Deteksi Lokasi Saya (Geolocation)**: Menemukan dan mengarahkan peta ke kamera CCTV terdekat dari lokasi pengguna.

---

## 📂 Struktur Proyek

```text
WEB-CCTV/
├── client/                     # Frontend Web
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # Shadcn UI (Dialog, Button, Badge, Input)
│   │   │   ├── CctvMap.tsx     # Komponen Peta Leaflet & Marker
│   │   │   ├── CctvPlayer.tsx  # Modal Video Player (HLS.js + Proxy Fallback)
│   │   │   └── Navbar.tsx      # Header, Search bar, Filter kategori
│   │   ├── types/
│   │   │   └── cctv.ts         # TypeScript Interfaces
│   │   ├── App.tsx             # Root Application State & Logic
│   │   └── main.tsx
│   ├── vite.config.ts          # Proxy API ke backend (port 5000)
│   └── package.json
│
├── server/                     # Backend API & Proxy
│   ├── src/
│   │   ├── data/
│   │   │   └── cctv-dataset.json # Dataset 465 titik CCTV
│   │   ├── routes/
│   │   │   ├── cctv.routes.js  # API data kamera & filter
│   │   │   └── proxy.routes.js # CORS Proxy HLS stream (.m3u8 & .ts)
│   │   └── server.js           # Entrypoint Express di port 5000
│   └── package.json
│
└── package.json                # Runner Root (menjalankan server & client sekaligus)
```

---

## 🛠️ Cara Menjalankan Aplikasi

Pastikan **Node.js** (v18+) sudah terpasang di komputer Anda.

### 1. Jalankan Server & Client Sekaligus (Rekomendasi)

Di root folder `WEB-CCTV`, jalankan perintah:

```bash
npm run dev
```

Perintah di atas akan otomatis menyalakan:

- **Backend API**: `http://localhost:5000`
- **Frontend Web**: `http://localhost:5173`

Buka browser Anda dan akses: **[http://localhost:5173](http://localhost:5173)**

---

### 2. Menjalankan Secara Terpisah (Opsional)

**Jalankan Backend Server:**

```bash
cd server
npm run dev
```

**Jalankan Frontend Client:**

```bash
cd client
npm run dev
```
