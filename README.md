<div align="center">


# 🏯 DKotoba (DKotoba Quiz)
### Platform Pembelajaran Bahasa Jepang Interaktif

![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge&logo=activity)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Alpine.js](https://img.shields.io/badge/Alpine.js-8BC0D0?style=for-the-badge&logo=alpinedotjs&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)

<br />

<p align="center">
  <b>DKotoba</b> adalah platform web modern untuk membantu siswa menguasai kosakata Bahasa Jepang (Kotoba) melalui metode kuis interaktif yang menyenangkan dan efektif.
</p>

[Fitur Utama](#-fitur-utama) • [Teknologi](#-teknologi) • [Struktur Project](#-struktur-project) • [Instalasi](#-instalasi) • [Deploy](#-deploy)

</div>

---

## ✨ Fitur Utama

🎯 **Kuis & Latihan**
- **Latihan Soal JLPT N5 & N4**: Tersedia dalam format Pilihan Ganda dan Essay.
- **Sistem Penilaian Otomatis**: Hasil langsung keluar setelah pengerjaan.

📊 **Progress & Analytics**
- **Real-time Tracking**: Pantau perkembangan belajar secara langsung.
- **Leaderboard**: Bersaing dengan siswa lain untuk menempati peringkat teratas.

👥 **Manajemen Pengguna**
- **Siswa**: Dashboard khusus untuk mengakses materi dan melihat riwayat nilai.
- **Admin**: Panel kontrol lengkap untuk mengelola data siswa, materi, dan soal kuis.

🔐 **Keamanan**
- **Autentikasi Aman**: Login dan registrasi terintegrasi dengan **Google Firebase Authentication**.

---

## 🛠 Teknologi

Project ini dibangun dengan stack teknologi modern yang ringan namun powerful:

| Komponen | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend** | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) | Struktur dasar aplikasi |
| **Styling** | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white) | Framework CSS utility-first untuk desain responsif |
| **Interactivity** | ![Alpine.js](https://img.shields.io/badge/Alpine.js-8BC0D0?logo=alpinedotjs&logoColor=white) | Framework JS ringan untuk state management di UI |
| **Backend** | ![Firebase](https://img.shields.io/badge/Firebase-039BE5?logo=Firebase&logoColor=white) | Authentication & Cloud Firestore Database |
| **Font** | Plus Jakarta Sans | Tipografi modern dan mudah dibaca |

---

## 📂 Struktur Project

```bash
dkotobakuis/
├── 📂 assets/          # Aset statis (Images, CSS custom, JS utilities)
├── 📂 pages/           # Dashboard Admin dan User
│   ├── admin/
│   └── user/
├── 📂 soal/            # File HTML untuk setiap paket kuis
│   ├── soal1/
│   └── khusussam/
├── 📄 auth.html        # Halaman Login & Register
├── 📄 index.html       # Landing Page Utama
└── 📄 README.md        # Dokumentasi Project (Anda di sini)
```

---

## 🚀 Instalasi & Menjalankan Lokal

Ikuti langkah berikut untuk menjalankan project ini di komputer Anda:

1.  **Clone Repository**
    ```bash
    git clone https://github.com/username/dkotobakuis.git
    cd dkotobakuis
    ```

2.  **Jalankan Local Server**
    Karena menggunakan module script dan assets, disarankan menggunakan local server.
    
    *Menggunakan Python:*
    ```bash
    python3 -m http.server 5501
    ```
    
    *Atau menggunakan VS Code Live Server extension.*

3.  **Akses Aplikasi**
    Buka browser dan kunjungi:
    `http://localhost:5501`

---

## 🌐 Deploy

Project ini bersifat statis (kecuali koneksi Firebase yang berjalan di client-side), sehingga sangat mudah di-deploy ke berbagai platform:

- **Vercel** (Direkomendasikan)
- **Netlify**
- **GitHub Pages**

> **Catatan:** Pastikan domain production Anda sudah didaftarkan di **Firebase Console** > **Authentication** > **Settings** > **Authorized Domains** agar fitur login tetap berjalan lancar.

---

<div align="center">

Dibuat dengan ❤️ untuk pembelajaran Bahasa Jepang.
  
</div>
