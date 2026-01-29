# DKotoba - Belajar Bahasa Jepang

DKotoba adalah platform pembelajaran Bahasa Jepang interaktif yang berfokus pada penguasaan kosakata (Kotoba) melalui kuis dan latihan.

## Fitur Utama

- **Kuis Interaktif**: Latihan soal kosakata (JLPT N5 & N4) dengan format Pilihan Ganda dan Essay.
- **Progress Tracking**: Pantau skor dan perkembangan belajar siswa secara real-time.
- **Dashboard Siswa**: Antarmuka khusus siswa untuk melihat daftar materi, kuis yang tersedia, dan riwayat nilai.
- **Dashboard Admin**: Panel pengelolaan lengkap untuk melihat data siswa, menambah materi, membuat kuis baru, dan melihat leaderboard.
- **Leaderboard**: Peringkat siswa terbaik berdasarkan skor kuis.
- **Autentikasi Aman**: Sistem login dan register menggunakan Firebase Authentication.

## Teknologi yang Digunakan

- **Frontend**: HTML5, Tailwind CSS (Styling), Alpine.js (Interactivity).
- **Backend/Database**: Google Firebase (Authentication & Cloud Firestore).
- **Font**: Plus Jakarta Sans.

## Cara Menjalankan Project (Lokal)

1.  Pastikan Anda memiliki koneksi internet (untuk memuat CDN Tailwind, Alpine, dan Firebase).
2.  Clone repository ini atau download filenya.
3.  Buka terminal di folder project.
4.  Jalankan local server, misalnya menggunakan Python:
    ```bash
    python3 -m http.server 5501
    ```
5.  Buka browser dan akses: `http://localhost:5501`

## Struktur Folder

- `pages/`: Halaman dashboard untuk admin dan user.
- `soal/`: File kuis (HTML).
- `assets/`: Aset statis (JS, CSS, Images).
- `auth.html`: Halaman Login dan Register.
- `index.html`: Landing page utama.

## Deploy

Project ini siap di-deploy ke platform hosting statis seperti **Vercel**, **Netlify**, atau **GitHub Pages**. Pastikan konfigurasi Firebase sudah disesuaikan dengan domain production Anda.

---
*Dibuat untuk tujuan edukasi dan pembelajaran Bahasa Jepang.*
