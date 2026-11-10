# Nuxt E-Commerce Dashboard

Dashboard administrasi e-commerce yang responsif (desktop dan HP), dibuat untuk tes teknis MagangHub.

- **Aplikasi (Vercel):** https://nuxt-ecommerce-dashboard.vercel.app
- **Repositori:** https://github.com/muhamadandy/nuxt-ecommerce-dashboard

## Akun demo

| Peran | Email               | Kata sandi      |
| ----- | ------------------- | --------------- |
| Admin | `admin@example.com` | `AdminDemo123!` |
| Staff | `staff@example.com` | `StaffDemo123!` |

## Teknologi

| Bagian      | Pilihan                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| Framework   | Nuxt 4 (klien di `app/`, backend di `server/` memakai Nitro)            |
| Database    | Neon Postgres (`@neondatabase/serverless`, mode HTTP)                   |
| ORM         | Drizzle ORM, skema di `server/database/schema.ts`                       |
| Autentikasi | `nuxt-auth-utils` (sesi di cookie terenkripsi) + hash kata sandi scrypt |
| UI          | Nuxt UI 4 + Tailwind CSS 4                                              |
| Validasi    | Zod (di server) + pesan di form                                         |
| Deploy      | Vercel                                                                  |

## Setup lokal

Prasyarat: Node.js 22 dan sebuah database Postgres (disarankan Neon, ada paket gratis).

1. Kloning repositori lalu pasang dependensi:
   ```bash
   git clone https://github.com/muhamadandy/nuxt-ecommerce-dashboard.git
   cd nuxt-ecommerce-dashboard
   npm install
   ```
2. Salin contoh variabel lingkungan, lalu isi nilainya:
   ```bash
   cp .env.example .env
   ```
   (Windows PowerShell: `Copy-Item .env.example .env`)
3. Buat rahasia sesi dan tempel ke `NUXT_APP_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
4. Buat tabel di database, lalu isi data contoh:
   ```bash
   npm run db:push
   npm run seed
   ```
5. Jalankan server pengembangan dan buka http://localhost:3000:
   ```bash
   npm run dev
   ```

### Variabel lingkungan

| Variabel                | Fungsi                                                          |
| ----------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`          | Connection string Neon (pooled), dipakai aplikasi saat berjalan |
| `DATABASE_URL_UNPOOLED` | Connection string Neon (direct), dipakai `drizzle-kit push`     |
| `NUXT_APP_SECRET`       | Rahasia acak minimal 32 karakter untuk mengenkripsi cookie sesi |

File `.env` sudah diabaikan Git. Jangan pernah meng-commit nilai asli.

### Skrip npm

| Perintah          | Fungsi                                                                      |
| ----------------- | --------------------------------------------------------------------------- |
| `npm run dev`     | Server pengembangan                                                         |
| `npm run build`   | Build produksi                                                              |
| `npm run db:push` | Menyinkronkan skema Drizzle ke database                                     |
| `npm run seed`    | Mengisi data contoh (dua pengguna, produk, pesanan); dapat dijalankan ulang |

## Data seed

Semua data fiktif, harga dalam Rupiah (IDR).

- 2 pengguna: 1 admin dan 1 staff
- 12 produk di 3 kategori, 2 di antaranya stok rendah (kurang dari 5)
- 10 pesanan yang mencakup keempat status (3 completed, 3 processing, 2 pending, 2 cancelled), 16 item pesanan

## Fitur dan cara memakainya

**Login / logout.** Masuk di `/login` dengan akun demo. Sesi bertahan setelah halaman di-refresh. Tombol **Keluar** ada di header. Semua halaman lain mengarahkan ke `/login` bila belum masuk.

**Dashboard (`/`).** Menampilkan total produk, total pesanan, total nilai pesanan berstatus `completed`, jumlah produk dengan stok kurang dari 5, dan 5 pesanan terbaru. Kartu statistik dapat diklik menuju halaman terkait.

**Produk (`/products`).**

- Daftar nama, kategori, harga, dan stok (produk berstok kurang dari 5 diberi lencana "rendah").
- Cari berdasarkan nama dan filter berdasarkan kategori (dapat dikombinasikan).
- Admin: **Tambah produk**, ikon pensil untuk ubah, ikon tempat sampah untuk hapus (dengan dialog konfirmasi).
- Validasi: nama dan kategori wajib, harga bilangan bulat lebih dari 0, stok bilangan bulat 0 atau lebih. Pesan muncul di bawah kolom yang salah.
- Menghapus produk memakai _soft delete_: produk hilang dari daftar tetapi riwayat pesanan tetap utuh.

**Pesanan (`/orders`).**

- Daftar nomor pesanan, pelanggan, tanggal (WIB), total, dan status.
- Filter berdasarkan status.
- Klik ikon mata (atau kartu di HP) untuk melihat detail: produk, jumlah, harga satuan, dan total per baris.
- Admin dapat mengubah status ke `pending`, `processing`, `completed`, atau `cancelled`.
- Pesanan dibuat lewat seed saja (sesuai ketentuan tes).

**Antarmuka.** Tabel berubah menjadi kartu di layar kecil, ada indikator loading, tampilan kosong (empty state), pesan validasi, notifikasi sukses/error, dan halaman 404/error.

## Cara kerja autentikasi dan peran

1. **Login.** `POST /api/auth/login` mencari pengguna berdasarkan email (tidak peka huruf besar) dan memverifikasi kata sandi dengan scrypt (`server/utils/password.ts`, format `scrypt$N$r$p$salt$hash`, perbandingan _timing-safe_). Bila cocok, sesi dibuat dengan `setUserSession` dan disimpan di cookie terenkripsi memakai `NUXT_APP_SECRET`. Kata sandi tidak pernah disimpan dalam bentuk asli.
2. **Sesi.** Cookie yang sama dibaca kembali saat halaman di-refresh, sehingga pengguna tetap masuk selama sesi berlaku.
3. **Perlindungan API (server).** `server/middleware/auth.ts` mewajibkan login untuk semua `/api/*` kecuali `/api/auth/*`. Tanpa sesi, jawabannya **401**.
4. **Pengecekan peran (server).** Setiap rute tulis memanggil `requireRole(event, ['admin'])` (`server/utils/auth.ts`) paling awal. Staff yang memanggil rute itu mendapat **403**, walaupun memanggilnya langsung tanpa lewat antarmuka.
5. **Perlindungan halaman (klien).** Middleware klien mengarahkan pengguna yang belum masuk ke `/login`, dan pengguna yang sudah masuk keluar dari `/login`.
6. **Antarmuka sadar peran.** Tombol tambah/ubah/hapus produk dan pilihan ubah status pesanan hanya tampil untuk Admin. Ini hanya kemudahan tampilan; keamanan sebenarnya ada di langkah 4.

| Fungsi                             | Admin | Staff       |
| ---------------------------------- | ----- | ----------- |
| Melihat dashboard, produk, pesanan | Ya    | Ya          |
| Tambah, ubah, hapus produk         | Ya    | Tidak (403) |
| Ubah status pesanan                | Ya    | Tidak (403) |

## Struktur database

| Tabel         | Kolom utama                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `users`       | id, name, email (unik), password_hash, role (`admin` / `staff`), created_at                                              |
| `products`    | id, name, category, price (> 0), stock (>= 0), created_at, updated_at, deleted_at                                        |
| `orders`      | id, order_number (unik), customer_name, status (`pending` / `processing` / `completed` / `cancelled`), total, created_at |
| `order_items` | id, order_id (hapus berantai), product_id (set null), product_name, unit_price, quantity                                 |

Keputusan desain: harga disimpan sebagai bilangan bulat Rupiah (tanpa desimal). `order_items` menyimpan salinan (_snapshot_) nama dan harga produk saat pesanan dibuat, sehingga riwayat pesanan tetap benar walau produk diubah atau dihapus.

## Endpoint API

| Metode dan rute                                                           | Akses        |
| ------------------------------------------------------------------------- | ------------ |
| `POST /api/auth/login`, `POST /api/auth/logout`                           | Publik       |
| `GET /api/dashboard`                                                      | Admin, Staff |
| `GET /api/products?q=&category=`                                          | Admin, Staff |
| `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` | Admin        |
| `GET /api/orders?status=` dan `GET /api/orders/:id`                       | Admin, Staff |
| `PATCH /api/orders/:id/status`                                            | Admin        |

## Deploy ke Vercel

1. Impor repositori ke Vercel (preset Nuxt terdeteksi otomatis).
2. Isi `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, dan `NUXT_APP_SECRET` di **Settings, Environment Variables**. Gunakan rahasia sesi yang berbeda dari lokal.
3. Jalankan `npm run db:push` dan `npm run seed` terhadap database yang sama dari komputer lokal.
4. Deploy atau redeploy.

## Masalah yang diketahui

- Mengubah status pesanan (misalnya ke `cancelled`) tidak mengembalikan stok produk; tidak diminta dalam tes.
- Jika sesi habis ketika halaman sudah terbuka, aksi berikutnya menampilkan notifikasi error dan belum otomatis dialihkan ke login (refresh halaman akan mengarahkan ke login).
- Daftar produk dan pesanan belum memakai pagination (data contoh masih kecil).
- Produk yang dihapus (soft delete) belum bisa dipulihkan lewat antarmuka.
- Lingkungan lokal dan produksi memakai satu database Neon yang sama selama pengembangan.
- Belum ada pengujian otomatis; pengujian dilakukan manual di lokal dan di Vercel.
- Tidak ada registrasi, manajemen pengguna, atau pembuatan pesanan lewat antarmuka (sesuai ketentuan tes).

## Alat AI yang dipakai

Saya memakai **Claude (Anthropic)** sebagai asisten selama pengerjaan: untuk merencanakan langkah, menyusun draf kode (skema database, skrip seed, rute server, halaman), dan menjelaskan konsep Nuxt yang baru bagi saya. Setiap bagian saya pasang sendiri, jalankan, uji di lokal dan di Vercel, lalu saya pelajari kodenya agar dapat menjelaskan fitur, dan struktur database.
