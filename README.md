# DKotoba Kuis

A quiz and learning management dashboard for Japanese language learners (N5 level). Built with **Next.js 14**, **Tailwind CSS**, and **Supabase**.

## Features

### 🔹 Admin Dashboard
-   **Overview**: View statistics (Total Students, Quizzes, Active Quizzes).
-   **Activity Tracking**: Monitor daily quiz attempts and weekly activity charts.
-   **Leaderboard**: View top students based on quiz scores and speed.
-   **Content Management**: Manage quizzes, questions, and learning materials.
-   **Student Management**: View and manage enrolled students.

### 🔹 Student Features
-   **Quiz Data**: Static quiz interface (legacy support) linked to the main dashboard.
-   **Score Tracking**: Scores are automatically saved to the Supabase database.

## Tech Stack
-   **Framework**: Next.js 14 (App Router)
-   **Styling**: Tailwind CSS
-   **Database**: Supabase (PostgreSQL)
-   **Auth**: Supabase Auth
-   **Icons**: Heroicons
-   **Charts**: Recharts

## Setup & Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Kaa278/dkotoba_kuis.git
    cd dkotoba_kuis
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env.local` file and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## Database Schema

Ensure your Supabase database has the required tables:
-   `profiles`: Users/Admins
-   `quizzes`: Quiz metadata
-   `quiz_questions`: Questions for each quiz
-   `quiz_attempts`: Student attempt history
-   `learning_materials`: Study content
-   `material_categories`: Categories for content

> **Note**: If you encounter missing table errors, please refer to the `migration_guide.md` (if available) or check the source code for schema definitions.

## Project Structure

-   `app/dashboard/admin`: Admin dashboard pages and components.
-   `app/dashboard/user`: User/Student dashboard pages.
-   `public/soal/soal1`: Interactive quiz (client-side app).
-   `components`: Reusable UI components.
-   `lib`: Supabase client configuration.
