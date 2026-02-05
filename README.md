<div align="center">

# 🇯🇵 DKotoba Kuis

**Advanced Japanese Learning Dashboard & Quiz Platform**
<br>
*Master N5 Vocabulary with interactive quizzes and real-time tracking.*

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-Pro-3178C6?style=for-the-badge&logo=typescript)

</div>

---

## ✨ Overview

**DKotoba Kuis** is a comprehensive e-learning platform designed for Japanese language students. It combines a modern, responsive **Admin Dashboard** for teachers with an engaging **Interactive Quiz Interface** for students.

Built with performance and scalability in mind using **Next.js 14** and **Supabase**.

## 🚀 Key Features

### 👑 For Administrators
*   **📊 Real-time Dashboard**: Live monitoring of student activities and quiz attempts.
*   **📈 Analytics & Charts**: Weekly stats, average scores, and popular quizzes visualized.
*   **🏆 Leaderboard System**: Track top-performing students globally or per quiz.
*   **📚 Content Management**: Easily create quizzes, manage questions, and organize study materials.

### 🎓 For Students
*   **⚡ Interactive Quizzes**: Fast, engaging Javascript-based quizzes (supports legacy & modern).
*   **💾 Auto-Save**: Scores and progress are automatically saved to the cloud.
*   **📱 Mobile Friendly**: Optimized for learning on the go.

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS + Heroicons |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Visualization** | Recharts |

## 📂 Project Structure

```bash
├── 📁 app
│   ├── 📂 dashboard/admin  # Admin Portal logic
│   └── 📂 dashboard/user   # Student Portal logic
├── 📁 components           # Reusable UI Blocks (Sidebar, Charts)
├── 📁 lib                  # Supabase Client Config
└── 📁 public/soal          # Static Quiz Modules (Client-side)
```

## ⚡ Getting Started

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Kaa278/dkjpnko.git
    cd dkotobakuis
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create `.env.local` and add your keys:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    ```

4.  **Launch**
    ```bash
    npm run dev
    ```

---

<div align="center">

Made with ❤️ by **DKotoba Team**

</div>
