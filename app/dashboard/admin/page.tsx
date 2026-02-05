"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminSidebar from "./AdminSidebar";
import {
    HomeIcon,
    UsersIcon,
    PencilSquareIcon,
    TrophyIcon,
    ChartBarIcon,
    PlusIcon,
    TrashIcon,
    PencilIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    Bars3Icon,
    XMarkIcon,
    ClockIcon,
    ArrowDownTrayIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    BookOpenIcon,
    LinkIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    DocumentArrowDownIcon,
    EyeIcon,
    EyeSlashIcon,
    ArrowLeftIcon,
    CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { format, subDays, isSameDay } from "date-fns";
import { id } from "date-fns/locale";

type Notification = { type: "success" | "error"; message: string };

type Profile = {
    id: string;
    username: string | null;
    full_name: string | null;
    role: "user" | "admin";
    password?: string;
    status?: "aktif" | "nonaktif" | "block";
    created_at: string;
};

type Quiz = {
    id: string;
    title: string;
    description: string | null;
    external_link: string | null;
    level: string | null;
    time_limit: number | null;
    deadline_at: string | null;
    is_active: boolean;
    total_questions: number;
    created_at: string;
};

type QuizAttempt = {
    id: string;
    user_id: string;
    quiz_id: string;
    score: number;
    duration_seconds: number | null;
    completed_at: string | null;
    created_at: string;
};

type LeaderboardRow = {
    user_id: string;
    full_name: string | null;
    username: string | null;
    total_score: number;
    quizzes_done: number;
    avg_score: number;
    total_duration_seconds: number;
};

type MaterialCategory = {
    id: string;
    name: string;
    created_at: string;
};

type LearningMaterial = {
    id: string;
    title: string;
    body: string;
    category_id: string | null;
    level: string;
    created_at: string;
    updated_at: string;
};

function formatSeconds(seconds: number) {
    if (!seconds || seconds <= 0) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m <= 0) return `${s}s`;
    return `${m}m ${s}s`;
}

function downloadCSV(filename: string, rows: Record<string, any>[]) {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const csv = [
        headers.join(","),
        ...rows.map((r) =>
            headers
                .map((h) => {
                    const val = r[h] ?? "";
                    const safe = String(val).replace(/"/g, '""');
                    return `"${safe}"`;
                })
                .join(",")
        ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Menu structure with submenu
type MenuItem = {
    id: string;
    label: string;
    icon: any;
    submenu?: { id: string; label: string }[];
};

const menuStructure: MenuItem[] = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: HomeIcon,
        submenu: [
            { id: "dashboard-ringkasan", label: "Ringkasan" },
            { id: "dashboard-aktivitas", label: "Aktivitas Hari Ini" },
            { id: "dashboard-statistik", label: "Statistik Mingguan" },
        ],
    },
    {
        id: "konten",
        label: "Konten / Materi",
        icon: BookOpenIcon,
        submenu: [
            { id: "konten-daftar", label: "Daftar Materi" },
            { id: "konten-tambah", label: "Tambah Materi" },
            { id: "konten-kategori", label: "Kategori Materi" },
        ],
    },
    {
        id: "kuis",
        label: "Kuis / Soal",
        icon: PencilSquareIcon,
        submenu: [
            { id: "kuis-daftar", label: "Daftar Kuis" },
            { id: "kuis-buat", label: "Buat Kuis Baru" },
            { id: "kuis-bank", label: "Bank Soal" },
        ],
    },
    {
        id: "peringkat",
        label: "Peringkat",
        icon: TrophyIcon,
        submenu: [
            { id: "peringkat-global", label: "Leaderboard Global" },
            { id: "peringkat-perkuis", label: "Per Kuis" },
            { id: "peringkat-export", label: "Export Data" },
        ],
    },
    {
        id: "siswa",
        label: "Siswa",
        icon: UsersIcon,
        submenu: [
            { id: "siswa-daftar", label: "Daftar Siswa" },
            { id: "siswa-detail", label: "Detail Siswa" },
            { id: "siswa-riwayat", label: "Riwayat Attempt" },
            { id: "siswa-role", label: "Manajemen Role" },
        ],
    },
    {
        id: "analytics",
        label: "Laporan / Analytics",
        icon: ChartBarIcon,
        submenu: [
            { id: "analytics-harian", label: "Attempt Harian" },
            { id: "analytics-populer", label: "Kuis Populer" },
            { id: "analytics-rata", label: "Rata-rata Skor" },
            { id: "analytics-aktif", label: "Siswa Aktif" },
        ],
    },
];

export default function AdminDashboard() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [currentView, setCurrentView] = useState("dashboard-ringkasan");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(["dashboard"]));

    // Data
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalQuizzes: 0,
        activeQuizzes: 0,
        attemptsToday: 0,
    });

    const [userList, setUserList] = useState<Profile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
    const [quizList, setQuizList] = useState<Quiz[]>([]);
    const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [questionList, setQuestionList] = useState<any[]>([]);
    const [filteredQuestions, setFilteredQuestions] = useState<any[]>([]);

    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
    const [profileSearchQuery, setProfileSearchQuery] = useState("");

    const [materialList, setMaterialList] = useState<LearningMaterial[]>([]);
    const [filteredMaterials, setFilteredMaterials] = useState<LearningMaterial[]>([]);
    const [categoryList, setCategoryList] = useState<MaterialCategory[]>([]);
    const [materialSearchQuery, setMaterialSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [materialLevelFilter, setMaterialLevelFilter] = useState("all");

    // Leaderboard
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
    const [top5, setTop5] = useState<LeaderboardRow[]>([]);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState("");
    const [quizSearchQuery, setQuizSearchQuery] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [activitySearchQuery, setActivitySearchQuery] = useState("");

    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [userSortOrder, setUserSortOrder] = useState<"newest" | "oldest">("newest");
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    // Leaderboard filters
    const [lbLevelFilter, setLbLevelFilter] = useState("all");
    const [lbQuizFilter, setLbQuizFilter] = useState("all");
    const [lbSort, setLbSort] = useState<"score" | "time" | "score_time">("score");

    // Quiz Creation Mode
    const [quizCreationMode, setQuizCreationMode] = useState<"external" | "manual" | null>(null);

    // Modals
    const [quizModalOpen, setQuizModalOpen] = useState(false);
    const [quizModalMode, setQuizModalMode] = useState<"add" | "edit">("add");

    const [quizForm, setQuizForm] = useState({
        id: "",
        title: "",
        description: "",
        external_link: "",
        level: "N5",
        time_limit: 60,
        deadline_at: "",
        is_active: true,
        total_questions: 0,
    });

    const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

    const [questionForm, setQuestionForm] = useState({
        id: "",
        question_text: "",
        romaji: "",
        type: "multiple_choice",
        options: ["", "", "", ""],
        correct_answer: "",
    });

    const [materialForm, setMaterialForm] = useState({
        id: "",
        title: "",
        body: "",
        category_id: "",
        level: "N5",
    });

    const [categoryForm, setCategoryForm] = useState({
        id: "",
        name: "",
    });

    const [materialModalOpen, setMaterialModalOpen] = useState(false);
    const [materialModalMode, setMaterialModalMode] = useState<"add" | "edit">("add");
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [categoryModalMode, setCategoryModalMode] = useState<"add" | "edit">("add");

    const [notification, setNotification] = useState<Notification | null>(null);

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: HomeIcon },
        { id: "kuis", label: "Kuis / Soal", icon: PencilSquareIcon },
        { id: "peringkat", label: "Peringkat", icon: TrophyIcon },
        { id: "siswa", label: "Siswa", icon: UsersIcon },
        { id: "analytics", label: "Laporan / Analytics", icon: ChartBarIcon },
    ] as const;

    const showNotification = (type: "success" | "error", message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 2500);
    };

    const toggleMenu = (menuId: string) => {
        setExpandedMenus((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(menuId)) {
                newSet.delete(menuId);
            } else {
                newSet.add(menuId);
            }
            return newSet;
        });
    };

    const navigateToSubmenu = (submenuId: string, parentId: string) => {
        setCurrentView(submenuId);
        // Reset creation mode logic when navigating
        setQuizCreationMode(null);
        setActiveQuizId(null);
        if (submenuId !== "siswa-detail") {
            setSelectedStudentId(null);
        }
        setQuizForm({
            id: "",
            title: "",
            description: "",
            external_link: "",
            level: "N5",
            time_limit: 60,
            deadline_at: "",
            is_active: true,
            total_questions: 0,
        });

        if (!expandedMenus.has(parentId)) {
            setExpandedMenus((prev) => new Set(prev).add(parentId));
        }
        setSidebarOpen(false);
    };

    const renderBreadcrumbs = () => {
        for (const menu of menuStructure) {
            if (menu.submenu) {
                const submenu = menu.submenu.find((s) => s.id === currentView);
                if (submenu) {
                    return (
                        <div className="flex items-center gap-2 text-lg md:text-xl">
                            <span className="text-slate-400 font-medium">{menu.label}</span>
                            <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                            <span className="text-slate-900 font-black">{submenu.label}</span>
                        </div>
                    );
                }
            }
        }
        return <span className="text-slate-900 font-black text-lg md:text-xl">Dashboard</span>;
    };

    useEffect(() => {
        checkAdmin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkAdmin = async () => {
        try {
            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/auth?mode=login");
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profileError) {
                router.push("/auth?mode=login");
                return;
            }

            if (profile?.role !== "admin") {
                router.push("/dashboard/user");
                return;
            }

            setCurrentUser({ ...user, ...profile });

            await fetchAllData();
        } catch (e) {
            console.error(e);
            router.push("/auth?mode=login");
        } finally {
            setLoading(false);
        }
    };

    const fetchAllData = async () => {
        // Students
        const { data: users, error: usersError } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "user")
            .order("created_at", { ascending: false });

        if (usersError) console.error("❌ Fetch Users Error:", usersError);

        if (users) {
            setUserList(users);
            setFilteredUsers(users);
            setStats((prev) => ({ ...prev, totalStudents: users.length }));
        }

        // All Profiles (for role management)
        const { data: all_p, error: allPError } = await supabase
            .from("profiles")
            .select("*")
            .order("full_name", { ascending: true });

        if (allPError) console.error("❌ Fetch All Profiles Error:", allPError);

        if (all_p) {
            setAllProfiles(all_p);
            setFilteredProfiles(all_p);
        }

        // Quizzes
        const { data: quizzes, error: quizzesError } = await supabase
            .from("quizzes")
            .select("*")
            .order("created_at", { ascending: false });

        if (quizzesError) console.error("❌ Fetch Quizzes Error:", quizzesError);

        if (quizzes) {
            setQuizList(quizzes);
            setFilteredQuizzes(quizzes);
            setStats((prev) => ({
                ...prev,
                totalQuizzes: quizzes.length,
                activeQuizzes: quizzes.filter((q) => q.is_active).length,
            }));
        }

        // Attempts (ambil semua dulu, nanti bisa pagination kalau besar)
        const { data: allAttempts, error: attemptsError } = await supabase
            .from("quiz_attempts")
            .select("*")
            .order("completed_at", { ascending: false });

        if (attemptsError) console.error("❌ Fetch Attempts Error:", attemptsError);

        console.log('📥 Fetching attempts:', { allAttempts, attemptsError });

        if (allAttempts) {
            console.log('✅ Setting attempts:', allAttempts.length, 'items');
            setAttempts(allAttempts);
        } else {
            console.log('❌ No attempts data received');
        }

        // Questions
        const { data: questions, error: questionsError } = await supabase
            .from("quiz_questions")
            .select("*")
            .order("order_index", { ascending: true }); // Changed from created_at to order_index

        if (questionsError) {
            // Only log if it's NOT a "column does not exist" error to reduce noise
            if (!questionsError.message.includes("column")) {
                console.error("❌ Fetch Questions Error:", questionsError);
            } else {
                console.warn("⚠️ 'created_at' column missing in quiz_questions, using 'order_index' instead.");
            }
        }

        if (questions) {
            setQuestionList(questions);
            setFilteredQuestions(questions);
        }

        // Attempts Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count } = await supabase
            .from("quiz_attempts")
            .select("*", { count: "exact", head: true })
            .gte("completed_at", today.toISOString()); // Changed to completed_at for consistency

        setStats((prev) => ({ ...prev, attemptsToday: count || 0 }));

        // Materials
        const { data: materials, error: materialsError } = await supabase
            .from("learning_materials")
            .select("*")
            .order("created_at", { ascending: false });

        if (materialsError) {
            // Suppress 404/400 errors for missing tables
            if (materialsError.code !== "42P01" && !materialsError.message.includes("does not exist")) {
                console.error("❌ Fetch Materials Error:", materialsError);
            }
        }

        if (materials) {
            setMaterialList(materials);
            setFilteredMaterials(materials);
        }

        // Categories
        const { data: categories, error: categoriesError } = await supabase
            .from("material_categories")
            .select("*")
            .order("name", { ascending: true });

        if (categoriesError) {
            // Suppress 404/400 errors for missing tables
            if (categoriesError.code !== "42P01" && !categoriesError.message.includes("does not exist")) {
                console.error("❌ Fetch Categories Error:", categoriesError);
            }
        }

        if (categories) {
            setCategoryList(categories);
        }
    };

    // Build leaderboard in-memory (simple + cepat untuk MVP)
    useEffect(() => {
        console.log('🔍 Leaderboard Debug:', {
            attemptsCount: attempts.length,
            allProfilesCount: allProfiles.length,
            quizListCount: quizList.length,
            lbLevelFilter,
            lbQuizFilter,
            lbSort
        });

        if (!attempts.length) {
            console.log('⚠️ No attempts found, setting empty leaderboard');
            setLeaderboard([]);
            setTop5([]);
            return;
        }

        if (!allProfiles.length) {
            console.log('⚠️ No profiles loaded yet, skipping leaderboard calculation');
            return;
        }

        const profileMap = new Map<string, Profile>();
        allProfiles.forEach((u) => profileMap.set(u.id, u));

        const quizMap = new Map<string, Quiz>();
        quizList.forEach((q) => quizMap.set(q.id, q));

        // filter attempts by quiz / level
        const filteredAttempts = attempts.filter((a) => {
            if (lbQuizFilter !== "all" && a.quiz_id !== lbQuizFilter) return false;

            if (lbLevelFilter !== "all") {
                const quiz = quizMap.get(a.quiz_id);
                if (!quiz) return false;
                if ((quiz.level || "").toUpperCase() !== lbLevelFilter) return false;
            }

            return true;
        });

        console.log('📊 Filtered attempts:', filteredAttempts.length);

        const agg = new Map<string, LeaderboardRow>();

        for (const a of filteredAttempts) {
            const p = profileMap.get(a.user_id);

            const row = agg.get(a.user_id) || {
                user_id: a.user_id,
                full_name: p?.full_name || null,
                username: p?.username || null,
                total_score: 0,
                quizzes_done: 0,
                avg_score: 0,
                total_duration_seconds: 0,
            };

            row.total_score += Number(a.score || 0);
            row.quizzes_done += 1;
            row.total_duration_seconds += Number(a.duration_seconds || 0);

            agg.set(a.user_id, row);
        }

        const rows = Array.from(agg.values()).map((r) => ({
            ...r,
            avg_score: r.quizzes_done ? Math.round(r.total_score / r.quizzes_done) : 0,
        }));

        console.log('✅ Leaderboard rows generated:', rows.length, rows);

        // sort
        rows.sort((a, b) => {
            if (lbSort === "time") {
                // lebih cepat lebih tinggi (duration kecil)
                // Jika waktu sama, skor lebih tinggi di atas
                if (a.total_duration_seconds === b.total_duration_seconds) {
                    return b.total_score - a.total_score;
                }
                return a.total_duration_seconds - b.total_duration_seconds;
            }

            if (lbSort === "score_time") {
                // Skor tertinggi di atas, jika sama cari yang lebih cepat
                if (b.total_score === a.total_score) {
                    return a.total_duration_seconds - b.total_duration_seconds;
                }
                return b.total_score - a.total_score;
            }

            // Default: Skor tertinggi di atas, jika sama cari yang lebih cepat
            if (b.total_score === a.total_score) {
                return a.total_duration_seconds - b.total_duration_seconds;
            }
            return b.total_score - a.total_score;
        });

        setLeaderboard(rows);
        setTop5(rows.slice(0, 5));
    }, [attempts, allProfiles, quizList, lbLevelFilter, lbQuizFilter, lbSort]);

    // Student Search
    const handleUserSearch = (e: any) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        const filtered = userList.filter(
            (u) =>
                (u.full_name?.toLowerCase().includes(query) ?? false) ||
                (u.username?.toLowerCase().includes(query) ?? false)
        );

        setFilteredUsers(filtered);
    };

    const handleProfileSearch = (e: any) => {
        const query = e.target.value.toLowerCase();
        setProfileSearchQuery(query);

        const filtered = allProfiles.filter(
            (p) =>
                (p.full_name?.toLowerCase().includes(query) ?? false) ||
                (p.username?.toLowerCase().includes(query) ?? false)
        );

        setFilteredProfiles(filtered);
    };

    const toggleUserRole = async (userId: string, currentRole: "user" | "admin") => {
        if (userId === currentUser?.id) {
            showNotification("error", "Anda tidak bisa menurunkan jabatan diri sendiri!");
            return;
        }

        const nextRole = currentRole === "admin" ? "user" : "admin";
        const confirmMsg = `Ubah role user ini menjadi ${nextRole.toUpperCase()}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const { error } = await supabase
                .from("profiles")
                .update({ role: nextRole })
                .eq("id", userId);

            if (error) throw error;

            showNotification("success", `Role berhasil diubah menjadi ${nextRole}`);
            await fetchAllData();
        } catch (e: any) {
            showNotification("error", "Gagal mengubah role");
        }
    };

    // Material Management Logic
    const handleMaterialSearch = (e: any) => {
        const query = e.target.value.toLowerCase();
        setMaterialSearchQuery(query);
        filterMaterials(query, categoryFilter, materialLevelFilter);
    };

    const filterMaterials = (query: string, category: string, level: string) => {
        let filtered = materialList.filter((m) => {
            const matchesSearch =
                (m.title || "").toLowerCase().includes(query) ||
                (m.body || "").toLowerCase().includes(query);
            const matchesCategory = category === "all" || m.category_id === category;
            const matchesLevel = level === "all" || m.level === level;
            return matchesSearch && matchesCategory && matchesLevel;
        });
        setFilteredMaterials(filtered);
    };

    const saveMaterial = async () => {
        if (!materialForm.title || !materialForm.body) {
            showNotification("error", "Judul dan isi materi wajib diisi!");
            return;
        }

        try {
            const payload = {
                title: materialForm.title,
                body: materialForm.body,
                category_id: materialForm.category_id || null,
                level: materialForm.level,
                updated_at: new Date().toISOString(),
            };

            if (materialModalMode === "add") {
                const { error } = await supabase.from("learning_materials").insert([payload]);
                if (error) throw error;
                showNotification("success", "Materi berhasil ditambahkan!");
            } else {
                const { error } = await supabase
                    .from("learning_materials")
                    .update(payload)
                    .eq("id", materialForm.id);
                if (error) throw error;
                showNotification("success", "Materi berhasil diperbarui!");
            }

            setMaterialModalOpen(false);
            fetchAllData();
        } catch (err: any) {
            showNotification("error", "Gagal menyimpan materi: " + err.message);
        }
    };

    const deleteMaterial = async (id: string) => {
        if (!window.confirm("Hapus materi ini?")) return;
        try {
            const { error, data } = await supabase.from("learning_materials").delete().eq("id", id).select();
            if (error) throw error;
            if (!data || data.length === 0) throw new Error("Item tidak ditemukan atau izin ditolak");

            showNotification("success", "Materi berhasil dihapus!");
            fetchAllData();
        } catch (err: any) {
            showNotification("error", "Gagal menghapus materi: " + err.message);
        }
    };

    const editMaterial = (m: LearningMaterial) => {
        setMaterialForm({
            id: m.id,
            title: m.title,
            body: m.body,
            category_id: m.category_id || "",
            level: m.level,
        });
        setMaterialModalMode("edit");
        setMaterialModalOpen(true);
    };

    // Category Management Logic
    const saveCategory = async () => {
        if (!categoryForm.name) {
            showNotification("error", "Nama kategori wajib diisi!");
            return;
        }

        try {
            if (categoryModalMode === "add") {
                const { error } = await supabase.from("material_categories").insert([{ name: categoryForm.name }]);
                if (error) throw error;
                showNotification("success", "Kategori berhasil ditambahkan!");
            } else {
                const { error } = await supabase
                    .from("material_categories")
                    .update({ name: categoryForm.name })
                    .eq("id", categoryForm.id);
                if (error) throw error;
                showNotification("success", "Kategori berhasil diperbarui!");
            }

            setCategoryModalOpen(false);
            fetchAllData();
        } catch (err: any) {
            showNotification("error", "Gagal menyimpan kategori: " + err.message);
        }
    };

    const deleteCategory = async (id: string) => {
        if (!window.confirm("Hapus kategori ini? Materi dengan kategori ini akan menjadi 'Tanpa Kategori'.")) return;
        try {
            const { error, data } = await supabase.from("material_categories").delete().eq("id", id).select();
            if (error) throw error;
            if (!data || data.length === 0) throw new Error("Item tidak ditemukan atau izin ditolak");

            showNotification("success", "Kategori berhasil dihapus!");
            fetchAllData();
        } catch (err: any) {
            showNotification("error", "Gagal menghapus kategori: " + err.message);
        }
    };

    // Quiz Search & Filter
    useEffect(() => {
        let filtered = [...quizList];

        if (quizSearchQuery) {
            filtered = filtered.filter((q) =>
                (q.title || "").toLowerCase().includes(quizSearchQuery.toLowerCase())
            );
        }

        if (levelFilter !== "all") {
            filtered = filtered.filter(
                (q) => (q.level || "").toUpperCase() === levelFilter
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter((q) =>
                statusFilter === "active" ? q.is_active : !q.is_active
            );
        }

        setFilteredQuizzes(filtered);
    }, [quizSearchQuery, levelFilter, statusFilter, quizList]);

    // Quiz CRUD
    const openQuizModal = (mode: "add" | "edit", quiz?: Quiz) => {
        setQuizModalMode(mode);

        if (quiz) {
            setQuizForm({
                id: quiz.id,
                title: quiz.title,
                description: quiz.description || "",
                external_link: quiz.external_link || "",
                level: (quiz.level || "N5").toUpperCase(),
                time_limit: quiz.time_limit || 0,
                deadline_at: quiz.deadline_at
                    ? new Date(quiz.deadline_at).toISOString().slice(0, 16)
                    : "",
                is_active: quiz.is_active,
                total_questions: quiz.total_questions || 0,
            });
        } else {
            setQuizForm({
                id: "",
                title: "",
                description: "",
                external_link: "",
                level: "N5",
                time_limit: 0,
                deadline_at: "",
                is_active: true,
                total_questions: 0,
            });
        }

        setQuizModalOpen(true);
    };

    const saveQuiz = async () => {
        try {
            if (!quizForm.title.trim()) {
                showNotification("error", "Judul kuis wajib diisi");
                return;
            }

            const quizData = {
                title: quizForm.title.trim(),
                description: quizForm.description?.trim() || null,
                external_link: quizForm.external_link?.trim() || null,
                level: quizForm.level,
                deadline_at: quizForm.deadline_at ? new Date(quizForm.deadline_at).toISOString() : null,
                is_active: quizForm.is_active,
                total_questions: Number(quizForm.total_questions) || 0,
            };

            if (quizModalMode === "add" && !quizForm.id) {
                const newId = `quiz-${Date.now()}`;
                const { error } = await supabase.from("quizzes").insert([{ id: newId, ...quizData }]);
                if (error) throw error;

                setActiveQuizId(newId);
                setQuizForm({ ...quizForm, id: newId });
                showNotification("success", "Info kuis berhasil disimpan! Sekarang Anda bisa menambah soal.");
            } else {
                const targetId = quizForm.id;
                const { error } = await supabase.from("quizzes").update(quizData).eq("id", targetId);
                if (error) throw error;
                showNotification("success", "Info kuis berhasil diupdate");
            }

            await fetchAllData();
            setQuizModalOpen(false);
        } catch (e: any) {
            showNotification("error", e.message || "Gagal menyimpan kuis");
        }
    };

    const saveManualQuestion = async () => {
        try {
            const targetQuizId = activeQuizId || quizForm.id;

            if (!targetQuizId) {
                showNotification("error", "Simpan info kuis di sebelah kiri terlebih dahulu!");
                return;
            }

            if (!questionForm.question_text.trim()) {
                showNotification("error", "Teks pertanyaan wajib diisi");
                return;
            }

            const questionData = {
                quiz_id: targetQuizId,
                question_text: questionForm.question_text.trim(),
                romaji: questionForm.romaji?.trim() || null,
                type: questionForm.type,
                options: questionForm.type === "multiple_choice" ? questionForm.options : null,
                correct_answer: questionForm.correct_answer.trim(),
            };

            if (questionForm.id) {
                // Update existing
                const { error } = await supabase
                    .from("quiz_questions")
                    .update(questionData)
                    .eq("id", questionForm.id);
                if (error) throw error;
                showNotification("success", "Pertanyaan berhasil diupdate!");
            } else {
                // Insert new
                const questionId = `q-${Date.now()}`;
                const { error } = await supabase.from("quiz_questions").insert([
                    {
                        id: questionId,
                        ...questionData,
                        order_index: questionList.filter((q) => q.quiz_id === targetQuizId).length,
                    },
                ]);
                if (error) throw error;
                showNotification("success", "Pertanyaan berhasil ditambahkan ke kuis!");
            }

            // Reset question form only
            setQuestionForm({
                id: "",
                question_text: "",
                romaji: "",
                type: "multiple_choice",
                options: ["", "", "", ""],
                correct_answer: "",
            });

            await fetchAllData();
        } catch (e: any) {
            showNotification("error", e.message || "Gagal menyimpan pertanyaan");
        }
    };

    const deleteQuestion = async (id: string) => {
        if (!confirm("Yakin hapus pertanyaan ini?")) return;
        try {
            const { error, data } = await supabase.from("quiz_questions").delete().eq("id", id).select();
            if (error) throw error;
            if (!data || data.length === 0) throw new Error("Item tidak ditemukan atau izin ditolak");

            showNotification("success", "Pertanyaan berhasil dihapus");
            await fetchAllData();
        } catch (e: any) {
            showNotification("error", e.message || "Gagal menghapus pertanyaan");
        }
    };

    const editQuestion = (q: any) => {
        setQuestionForm({
            id: q.id,
            question_text: q.question_text || "",
            romaji: q.romaji || "",
            type: q.type || "multiple_choice",
            options: q.options || ["", "", "", ""],
            correct_answer: q.correct_answer || "",
        });
        // Switch view to kuis-buat if not already there, and if quiz matches
        if (currentView !== "kuis-buat") {
            setCurrentView("kuis-buat");
            // Also need to set the quizForm to the parent quiz
            const quiz = quizList.find(qz => qz.id === q.quiz_id);
            if (quiz) {
                setQuizForm({
                    id: quiz.id,
                    title: quiz.title,
                    description: quiz.description || "",
                    external_link: quiz.external_link || "",
                    level: quiz.level || "N5",
                    time_limit: quiz.time_limit || 0,
                    deadline_at: quiz.deadline_at ? new Date(quiz.deadline_at).toISOString().slice(0, 16) : "",
                    is_active: quiz.is_active,
                    total_questions: quiz.total_questions || 0,
                });
                setActiveQuizId(quiz.id);
            }
        }
    };

    const deleteQuiz = async (id: string) => {
        if (!confirm("Yakin hapus kuis ini? Attempt yang terkait akan ikut terhapus (jika FK cascade).")) return;

        const { error, data } = await supabase.from("quizzes").delete().eq("id", id).select();

        if (error) {
            showNotification("error", error.message);
        } else if (!data || data.length === 0) {
            showNotification("error", "Gagal menghapus kuis. Pastikan Anda memiliki izin admin atau kuis masih ada.");
        } else {
            showNotification("success", "Kuis berhasil dihapus");
            await fetchAllData();
        }
    };

    const toggleQuizStatus = async (quiz: Quiz) => {
        const { error } = await supabase
            .from("quizzes")
            .update({ is_active: !quiz.is_active })
            .eq("id", quiz.id);

        if (error) showNotification("error", error.message);
        else {
            showNotification(
                "success",
                `Kuis ${!quiz.is_active ? "diaktifkan" : "dinonaktifkan"}`
            );
            await fetchAllData();
        }
    };

    const exportLeaderboard = (filename = "dkotoba_leaderboard.csv") => {
        const rows = leaderboard.map((r, idx) => ({
            rank: idx + 1,
            full_name: r.full_name || "-",
            username: r.username ? `@${r.username}` : "-",
            total_score: r.total_score,
            quizzes_done: r.quizzes_done,
            avg_score: r.avg_score,
            total_time: formatSeconds(r.total_duration_seconds),
        }));

        downloadCSV(filename, rows);
        showNotification("success", "Leaderboard berhasil diexport");
    };

    const exportStudents = () => {
        const rows = userList.map((u, idx) => {
            const lbRow = leaderboard.find((x) => x.user_id === u.id);
            return {
                no: idx + 1,
                full_name: u.full_name || "-",
                username: u.username || "-",
                password: u.password || "********",
                total_score: lbRow?.total_score || 0,
                joined_at: format(new Date(u.created_at), "yyyy-MM-dd HH:mm:ss"),
            };
        });

        downloadCSV("dkotoba_students.csv", rows);
        showNotification("success", "Data siswa berhasil diexport");
    };

    const exportAttempts = () => {
        const rows = attempts.map((a) => {
            const user = userList.find((u) => u.id === a.user_id);
            const quiz = quizList.find((q) => q.id === a.quiz_id);
            return {
                id: a.id,
                student_name: user?.full_name || "Unknown",
                quiz_title: quiz?.title || "Unknown",
                score: a.score,
                duration: formatSeconds(a.duration_seconds || 0),
                created_at: format(new Date(a.created_at), "yyyy-MM-dd HH:mm:ss"),
            };
        });

        downloadCSV("dkotoba_attempts.csv", rows);
        showNotification("success", "Riwayat attempt berhasil diexport");
    };

    const dailyAttemptData = useMemo(() => {
        const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
        return days.map((day) => {
            const count = attempts.filter((a) =>
                isSameDay(new Date(a.created_at), day)
            ).length;
            return {
                date: format(day, "dd MMM", { locale: id }),
                attempts: count,
            };
        });
    }, [attempts]);

    const popularQuizzesData = useMemo(() => {
        const counts = attempts.reduce((acc: any, cur) => {
            acc[cur.quiz_id] = (acc[cur.quiz_id] || 0) + 1;
            return acc;
        }, {});

        return quizList
            .map((q) => ({
                title: q.title,
                total_attempt: counts[q.id] || 0,
            }))
            .sort((a, b) => b.total_attempt - a.total_attempt)
            .slice(0, 10);
    }, [attempts, quizList]);

    const averageScoreData = useMemo(() => {
        const scoresMap = new Map<string, { total: number, count: number }>();
        attempts.forEach((a) => {
            const existing = scoresMap.get(a.quiz_id) || { total: 0, count: 0 };
            scoresMap.set(a.quiz_id, {
                total: existing.total + Number(a.score || 0),
                count: existing.count + 1
            });
        });

        return Array.from(scoresMap.entries())
            .map(([quiz_id, data]) => ({
                name: quizList.find(q => q.id === quiz_id)?.title || "Unknown",
                avg: Math.round(data.total / data.count)
            }))
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 10);
    }, [attempts, quizList]);

    const activeStudentsData = useMemo(() => {
        const studentMap = new Map<string, number>();
        attempts.forEach((a) => {
            studentMap.set(a.user_id, (studentMap.get(a.user_id) || 0) + 1);
        });

        return Array.from(studentMap.entries())
            .map(([user_id, count]) => {
                const user = allProfiles.find(u => u.id === user_id);
                return {
                    id: user_id,
                    name: user?.full_name || "Unknown",
                    username: user?.username || "-",
                    count
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [attempts, allProfiles]);

    const quizOptionsForFilter = useMemo(() => {
        return quizList.map((q) => ({
            id: q.id,
            title: q.title,
            level: (q.level || "").toUpperCase(),
        }));
    }, [quizList]);

    const recentAttemptsDataTable = useMemo(() => {
        const profileMap = new Map<string, Profile>();
        userList.forEach((u) => profileMap.set(u.id, u));

        const quizMap = new Map<string, Quiz>();
        quizList.forEach((q) => quizMap.set(q.id, q));

        return attempts.slice(0, 5).map((a) => ({
            ...a,
            created_at: a.created_at || a.completed_at || new Date().toISOString(), // Fallback
            student_name: profileMap.get(a.user_id)?.full_name || "Tanpa Nama",
            quiz_title: quizMap.get(a.quiz_id)?.title || "Kuis Tidak Diketahui",
        }));
    }, [attempts, userList, quizList]);

    const todayAttemptsDataTable = useMemo(() => {
        const profileMap = new Map<string, Profile>();
        userList.forEach((u) => profileMap.set(u.id, u));

        const quizMap = new Map<string, Quiz>();
        quizList.forEach((q) => quizMap.set(q.id, q));

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        let filtered = attempts.filter((a) => {
            const time = a.completed_at || a.created_at || new Date().toISOString();
            return new Date(time) >= startOfToday;
        });

        if (activitySearchQuery) {
            const q = activitySearchQuery.toLowerCase();
            filtered = filtered.filter((a) => {
                const studentName = profileMap.get(a.user_id)?.full_name || "";
                const quizTitle = quizMap.get(a.quiz_id)?.title || "";
                return studentName.toLowerCase().includes(q) || quizTitle.toLowerCase().includes(q);
            });
        }

        return filtered.map((a) => ({
            ...a,
            created_at: a.created_at || a.completed_at || new Date().toISOString(), // Fallback
            student_name: profileMap.get(a.user_id)?.full_name || "Tanpa Nama",
            quiz_title: quizMap.get(a.quiz_id)?.title || "Kuis Tidak Diketahui",
            level: quizMap.get(a.quiz_id)?.level || "N5",
        }));
    }, [attempts, userList, quizList, activitySearchQuery]);

    const weeklyStatsData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

        return last7Days.map((date) => {
            const dayAttempts = attempts.filter((a) => {
                const time = a.completed_at || a.created_at || new Date().toISOString();
                return isSameDay(new Date(time), date);
            });

            return {
                label: format(date, "EEE", { locale: id }),
                date: format(date, "d MMM", { locale: id }),
                count: dayAttempts.length,
                avgScore: dayAttempts.length
                    ? Math.round(
                        dayAttempts.reduce((acc, a) => acc + Number(a.score || 0), 0) /
                        dayAttempts.length
                    )
                    : 0,
            };
        });
    }, [attempts]);

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            { }
            <AdminSidebar
                menuStructure={menuStructure}
                currentView={currentView}
                expandedMenus={expandedMenus}
                currentUser={currentUser}
                sidebarOpen={sidebarOpen}
                onToggleMenu={toggleMenu}
                onNavigateToSubmenu={navigateToSubmenu}
                onCloseSidebar={() => setSidebarOpen(false)}
            />

            { }
            <div className="flex-1 flex flex-col min-w-0">
                { }
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden text-slate-600"
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        <div className="flex items-center">
                            {renderBreadcrumbs()}
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push("/auth");
                        }}
                        className="text-sm font-semibold text-slate-600 hover:text-slate-800"
                    >
                        Logout
                    </button>
                </header>

                { }
                {notification && (
                    <div
                        className={`absolute top-20 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-white animate-slide-in-right ${notification.type === "success" ? "bg-green-500" : "bg-red-500"
                            }`}
                    >
                        {notification.message}
                    </div>
                )}

                { }
                <main className={`flex-1 p-4 flex flex-col ${['siswa-detail', 'siswa-riwayat', 'siswa-role', 'analytics-harian', 'analytics-populer', 'analytics-rata', 'analytics-aktif', 'konten-daftar', 'konten-tambah', 'konten-kategori'].includes(currentView) ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                    { }
                    {currentView === "dashboard-ringkasan" && (
                        <div className="space-y-8 animate-fade-in">
                            { }
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:-translate-y-1 transition-transform">
                                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                                        <UsersIcon className="w-5 h-5 text-blue-600" />
                                        <p className="text-sm font-bold uppercase tracking-wide">
                                            Total Siswa
                                        </p>
                                    </div>
                                    <p className="text-4xl font-black text-slate-900">{stats.totalStudents}</p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:-translate-y-1 transition-transform">
                                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                                        <PencilSquareIcon className="w-5 h-5 text-indigo-500" />
                                        <p className="text-sm font-bold uppercase tracking-wide">
                                            Total Kuis
                                        </p>
                                    </div>
                                    <p className="text-4xl font-black text-slate-900">
                                        {stats.totalQuizzes}
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:-translate-y-1 transition-transform">
                                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                        <p className="text-sm font-bold uppercase tracking-wide">
                                            Kuis Aktif
                                        </p>
                                    </div>
                                    <p className="text-4xl font-black text-slate-900">{stats.activeQuizzes}</p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:-translate-y-1 transition-transform">
                                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                                        <ClockIcon className="w-5 h-5 text-orange-500" />
                                        <p className="text-sm font-bold uppercase tracking-wide">
                                            Attempt Hari Ini
                                        </p>
                                    </div>
                                    <p className="text-4xl font-black text-slate-900">{stats.attemptsToday}</p>
                                </div>
                            </div>

                            { }
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                { }
                                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                                        <div className="flex items-center gap-3">
                                            <TrophyIcon className="w-6 h-6 text-yellow-500" />
                                            <h3 className="font-bold text-lg text-slate-800">
                                                Top 5 Siswa
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => setCurrentView("peringkat")}
                                            className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline"
                                        >
                                            Lihat Semua
                                        </button>
                                    </div>

                                    <div className="p-2">
                                        {top5.map((user, index) => (
                                            <div
                                                key={user.user_id}
                                                className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors"
                                            >
                                                <div
                                                    className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-lg ${index === 0
                                                        ? "bg-yellow-400 text-white shadow-lg shadow-yellow-400/40"
                                                        : index === 1
                                                            ? "bg-slate-300 text-slate-700"
                                                            : index === 2
                                                                ? "bg-orange-400 text-white"
                                                                : "bg-slate-100 text-slate-500"
                                                        }`}
                                                >
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800">
                                                        {user.full_name || "Tanpa Nama"}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-mono">
                                                        @{user.username || "-"}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-blue-600">
                                                        {user.total_score} XP
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {user.quizzes_done} kuis
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        {top5.length === 0 && (
                                            <div className="p-8 text-center text-slate-400">
                                                Belum ada attempt yang masuk.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                { }
                                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-white">
                                        <ChartBarIcon className="w-6 h-6 text-purple-500" />
                                        <h3 className="font-bold text-lg text-slate-800">
                                            Aktivitas Ringkas
                                        </h3>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        <div className="flex gap-4">
                                            <div className="w-2.5 h-2.5 mt-2 rounded-full border-2 border-blue-500 shrink-0"></div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">
                                                    <span className="font-bold">
                                                        {stats.totalStudents}
                                                    </span>{" "}
                                                    siswa terdaftar
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Total keseluruhan
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-2.5 h-2.5 mt-2 rounded-full border-2 border-green-500 shrink-0"></div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">
                                                    <span className="font-bold">{stats.activeQuizzes}</span>{" "}
                                                    kuis aktif
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Published / tersedia
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-2.5 h-2.5 mt-2 rounded-full border-2 border-orange-500 shrink-0"></div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">
                                                    <span className="font-bold">{stats.attemptsToday}</span>{" "}
                                                    attempt hari ini
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Update berdasarkan `quiz_attempts`
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                onClick={() => setCurrentView("peringkat-global")}
                                                className="w-full py-3 rounded-xl border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-900 hover:text-white transition-all"
                                            >
                                                Buka Peringkat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            { }
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                                    <div className="flex items-center gap-3">
                                        <ClockIcon className="w-6 h-6 text-blue-600" />
                                        <h3 className="font-bold text-lg text-slate-800">
                                            Attempt Terbaru
                                        </h3>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Siswa</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Kuis</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Skor</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Waktu</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Jam</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {recentAttemptsDataTable.map((a) => (
                                                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-800">{a.student_name}</td>
                                                    <td className="px-6 py-4 text-slate-600 font-medium">{a.quiz_title}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 border-2 border-green-500 text-green-700 rounded-full text-xs font-black">
                                                            {a.score} XP
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-mono text-slate-500">
                                                        {formatSeconds(a.duration_seconds || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-400">
                                                        {new Date(a.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                                    </td>
                                                </tr>
                                            ))}
                                            {recentAttemptsDataTable.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                        Belum ada aktivitas kuis terbaru.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    { }
                    {currentView === "dashboard-aktivitas" && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        Aktivitas Hari Ini
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">
                                        {new Date().toLocaleDateString("id-ID", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama siswa atau kuis..."
                                        value={activitySearchQuery}
                                        onChange={(e) => setActivitySearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold">
                                            <tr>
                                                <th className="px-6 py-4">Jam</th>
                                                <th className="px-6 py-4">Siswa</th>
                                                <th className="px-6 py-4">Kuis</th>
                                                <th className="px-6 py-4">Skor</th>
                                                <th className="px-6 py-4">Durasi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {todayAttemptsDataTable.map((a) => (
                                                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-500">
                                                        {new Date(a.created_at).toLocaleTimeString("id-ID", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                                {a.student_name.charAt(0)}
                                                            </div>
                                                            <span className="font-bold text-slate-700">{a.student_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-800">{a.quiz_title}</span>
                                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider">{(a.level || "N5").toUpperCase()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 border-2 border-green-500 text-green-700 rounded-full text-[10px] font-black">
                                                            {a.score} XP
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-mono text-slate-500">
                                                        <div className="flex items-center gap-1.5">
                                                            <ClockIcon className="w-4 h-4" />
                                                            {formatSeconds(a.duration_seconds || 0)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {todayAttemptsDataTable.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                        Belum ada aktivitas hari ini.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    { }
                    {currentView === "dashboard-statistik" && (
                        <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        Statistik Mingguan
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Tren aktivitas platform 7 hari terakhir
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                                <div className="lg:col-span-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                                    <div className="flex items-center justify-between mb-8 shrink-0">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <ChartBarIcon className="w-5 h-5 text-blue-600" />
                                            Grafik Attempt
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
                                                <span>Attempts</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 w-full min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={weeklyStatsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="label"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "#fff",
                                                        border: "1px solid #e2e8f0",
                                                        borderRadius: "12px",
                                                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                                    }}
                                                    itemStyle={{ fontWeight: "bold", color: "#1e293b" }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="count"
                                                    stroke="#3b82f6"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorCount)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6">
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Minggu Ini</p>
                                        <p className="text-5xl font-black text-slate-900">
                                            {weeklyStatsData.reduce((acc, curr) => acc + curr.count, 0)}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-2 font-medium italic">Quiz attempts</p>
                                    </div>

                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rata-rata Skor</p>
                                        <p className="text-5xl font-black text-emerald-600">
                                            {weeklyStatsData.length ? Math.round(weeklyStatsData.reduce((acc, curr) => acc + curr.avgScore, 0) / weeklyStatsData.length) : 0}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-2 font-medium italic">XP per kuis</p>
                                    </div>

                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hari Teraktif</p>
                                        <p className="text-3xl font-black text-slate-900">
                                            {weeklyStatsData.length ? weeklyStatsData.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), weeklyStatsData[0]).label : "-"}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-2 font-medium italic">Paling banyak attempt</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    { }
                    {currentView === "kuis-daftar" && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        Manajemen Kuis
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Kelola semua kuis dan soal
                                    </p>
                                </div>

                            </div>

                            { }
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Cari kuis..."
                                                value={quizSearchQuery}
                                                onChange={(e) => setQuizSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <select
                                        value={levelFilter}
                                        onChange={(e) => setLevelFilter(e.target.value)}
                                        className="px-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                    >
                                        <option value="all">Semua Level</option>
                                        <option value="N5">N5</option>
                                        <option value="N4">N4</option>
                                        <option value="N3">N3</option>
                                        <option value="N2">N2</option>
                                        <option value="N1">N1</option>
                                    </select>

                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                    >
                                        <option value="all">Semua Status</option>
                                        <option value="active">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>
                            </div>

                            { }
                            <div className="grid gap-4">
                                {filteredQuizzes.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                                        <PencilSquareIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                        <p className="text-slate-500 font-medium">
                                            Belum ada kuis. Buat kuis pertama Anda!
                                        </p>
                                    </div>
                                ) : (
                                    filteredQuizzes.map((quiz) => (
                                        <div
                                            key={quiz.id}
                                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 transition-all group"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        <h3 className="font-bold text-lg text-slate-800">
                                                            {quiz.title}
                                                        </h3>

                                                        <span
                                                            className={`px-3 py-1 rounded-full text-[10px] font-black border-2 ${quiz.is_active
                                                                ? "border-green-500 text-green-700"
                                                                : "border-slate-300 text-slate-500"
                                                                }`}
                                                        >
                                                            {quiz.is_active ? "PUBLISHED" : "DRAFT"}
                                                        </span>

                                                        <span className="px-3 py-1 rounded-full text-[10px] font-black border-2 border-blue-300 text-blue-600 uppercase">
                                                            {quiz.level || "N5"}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-slate-500 mb-3">
                                                        {quiz.description || "Tidak ada deskripsi"}
                                                    </p>

                                                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase">

                                                        {quiz.deadline_at && (
                                                            <span className="flex items-center gap-1 text-orange-500 normal-case">
                                                                Deadline:{" "}
                                                                {new Date(quiz.deadline_at).toLocaleString(
                                                                    "id-ID"
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleQuizStatus(quiz)}
                                                        className={`p-2 rounded-lg transition-colors ${quiz.is_active
                                                            ? "text-green-600 hover:bg-green-50"
                                                            : "text-slate-400 hover:bg-slate-50"
                                                            }`}
                                                        title={quiz.is_active ? "Nonaktifkan" : "Aktifkan"}
                                                    >
                                                        {quiz.is_active ? (
                                                            <CheckCircleIcon className="w-5 h-5" />
                                                        ) : (
                                                            <XCircleIcon className="w-5 h-5" />
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => openQuizModal("edit", quiz)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>

                                                    <button
                                                        onClick={() => deleteQuiz(quiz.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    { }
                    {currentView === "kuis-buat" && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        Buat Kuis Baru
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Siapkan kuis dan pertanyaan pertamanya
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    { }
                                    {activeQuizId && (
                                        <button
                                            onClick={() => setCurrentView("kuis-daftar")}
                                            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
                                        >
                                            <ChevronDownIcon className="w-4 h-4 rotate-90" />
                                            Kembali
                                        </button>
                                    )}

                                    { }
                                    {(!activeQuizId && quizCreationMode !== null) && (
                                        <button
                                            onClick={() => setQuizCreationMode(null)}
                                            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
                                        >
                                            <ChevronDownIcon className="w-4 h-4 rotate-90" />
                                            Kembali
                                        </button>
                                    )}
                                </div>
                            </div>

                            { }
                            {(!activeQuizId && !quizForm.id && quizCreationMode === null) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                    <button
                                        onClick={() => setQuizCreationMode("external")}
                                        className="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all text-left flex flex-col gap-4"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <LinkIcon className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 mb-2">Link Eksternal</h3>
                                            <p className="text-slate-500 text-sm leading-relaxed">
                                                Sisipkan materi pembelajaran dari link website lain. Cocok untuk referensi bacaan atau video luar.
                                            </p>
                                        </div>
                                        <div className="mt-auto pt-4 flex items-center gap-2 text-blue-600 font-bold text-sm">
                                            <span>Pilih Metode Ini</span>
                                            <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setQuizCreationMode("manual")}
                                        className="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all text-left flex flex-col gap-4"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <DocumentTextIcon className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 mb-2">Input Manual</h3>
                                            <p className="text-slate-500 text-sm leading-relaxed">
                                                Buat pertanyaan dan jawaban secara manual (Pilihan Ganda atau Essay/Romaji).
                                            </p>
                                        </div>
                                        <div className="mt-auto pt-4 flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                            <span>Pilih Metode Ini</span>
                                            <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                </div>
                            ) : (

                                <div className={`grid grid-cols-1 ${quizCreationMode === "external" ? "max-w-2xl mx-auto" : "lg:grid-cols-2"} gap-6 items-start`}>
                                    { }
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">
                                            1. Informasi Kuis {quizCreationMode === "external" ? "(Eksternal)" : "(Manual)"}
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                                    Judul Kuis *
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: Latihan N5 - Partikel"
                                                    value={quizForm.title}
                                                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                                                    className="w-full p-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                                />
                                            </div>

                                            { }
                                            {(quizCreationMode === "external" || quizForm.external_link) && (
                                                <div className="animate-fade-in">
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                                        Link Eksternal (Wajib) *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="https://exampler.com/quiz"
                                                        value={quizForm.external_link || ""}
                                                        onChange={(e) => setQuizForm({ ...quizForm, external_link: e.target.value })}
                                                        className="w-full p-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium font-mono text-sm text-blue-600"
                                                    />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                                        Level
                                                    </label>
                                                    <select
                                                        value={quizForm.level || "N5"}
                                                        onChange={(e) => setQuizForm({ ...quizForm, level: e.target.value })}
                                                        className="w-full p-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                                    >
                                                        <option value="N5">N5</option>
                                                        <option value="N4">N4</option>
                                                        <option value="N3">N3</option>
                                                        <option value="N2">N2</option>
                                                        <option value="N1">N1</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                                        Deadline
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={quizForm.deadline_at || ""}
                                                        onChange={(e) => setQuizForm({ ...quizForm, deadline_at: e.target.value })}
                                                        className="w-full p-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                                    Jumlah Soal (Total)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={quizForm.total_questions || ""}
                                                    onChange={(e) => setQuizForm({ ...quizForm, total_questions: parseInt(e.target.value) || 0 })}
                                                    className="w-full p-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="is_active_form_redesign"
                                                    checked={quizForm.is_active}
                                                    onChange={(e) => setQuizForm({ ...quizForm, is_active: e.target.checked })}
                                                    className="w-5 h-5 accent-blue-600 rounded"
                                                />
                                                <label htmlFor="is_active_form_redesign" className="font-bold text-slate-700">
                                                    Publish Langsung
                                                </label>
                                            </div>

                                            <button
                                                onClick={saveQuiz}
                                                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-blue-100 hover:bg-blue-700 transition-all text-sm"
                                            >
                                                Simpan Info Kuis
                                            </button>
                                        </div>
                                    </div>

                                    { }
                                    {quizCreationMode !== "external" && (
                                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">
                                                2. Draft Pertanyaan Pertama
                                            </h3>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                                        Tipe Soal
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setQuestionForm({ ...questionForm, type: "multiple_choice" })}
                                                            className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${questionForm.type === "multiple_choice" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                                                        >
                                                            Pilihan Ganda
                                                        </button>
                                                        <button
                                                            onClick={() => setQuestionForm({ ...questionForm, type: "essay" })}
                                                            className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${questionForm.type === "essay" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                                                        >
                                                            Essay / Romaji
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                                        Teks Pertanyaan
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        placeholder="Contoh: Apa arti dari kata 'Taberu'?"
                                                        value={questionForm.question_text}
                                                        onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                                                        className="w-full p-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                                    />
                                                </div>

                                                {questionForm.type === "multiple_choice" && (
                                                    <div className="space-y-3">
                                                        <label className="block text-sm font-bold text-slate-700">Pilihan Jawaban</label>
                                                        {questionForm.options.map((opt, idx) => (
                                                            <div key={idx} className="flex gap-2 items-center">
                                                                <span className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-bold text-slate-400">
                                                                    {String.fromCharCode(65 + idx)}
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    placeholder={`Pilihan ${idx + 1}`}
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const newOpts = [...questionForm.options];
                                                                        newOpts[idx] = e.target.value;
                                                                        setQuestionForm({ ...questionForm, options: newOpts });
                                                                    }}
                                                                    className="flex-1 p-2.5 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium text-sm"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                                        {questionForm.type === "multiple_choice" ? "Kunci Jawaban (Teks)" : "Kunci Jawaban / Romaji"}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder={questionForm.type === "multiple_choice" ? "Tulis teks jawaban yang benar" : "Contoh: taberu"}
                                                        value={questionForm.correct_answer}
                                                        onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                                                        className="w-full p-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                                    />
                                                </div>

                                                <div className="pt-4 border-t border-slate-50 flex justify-end">
                                                    <button
                                                        onClick={saveManualQuestion}
                                                        disabled={!quizForm.id && !activeQuizId}
                                                        className={`px-8 py-3 rounded-xl font-black shadow-lg shadow-blue-200 transition-all ${(!quizForm.id && !activeQuizId) ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                                                    >
                                                        {questionForm.id ? "Update Soal" : "Simpan Soal"} {(!quizForm.id && !activeQuizId) && "(Simpan Kiri Dulu)"}
                                                    </button>
                                                </div>
                                            </div>

                                            { }
                                            {(activeQuizId || quizForm.id) && (
                                                <div className="mt-8 pt-8 border-t border-slate-100">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                                            Daftar Soal Kuis Ini
                                                        </h4>
                                                        <span className="text-xs font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                                                            {questionList.filter(q => q.quiz_id === (activeQuizId || quizForm.id)).length} Soal
                                                        </span>
                                                    </div>

                                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {questionList
                                                            .filter(q => q.quiz_id === (activeQuizId || quizForm.id))
                                                            .map((q, idx) => (
                                                                <div key={q.id} className="group bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-blue-200 transition-all">
                                                                    <div className="flex justify-between items-start gap-4">
                                                                        <div className="flex-1 min-w-0 text-left">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase">
                                                                                    Soal {idx + 1}
                                                                                </span>
                                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                                    {q.type === 'multiple_choice' ? 'MC' : 'Essay'}
                                                                                </span>
                                                                            </div>
                                                                            <p className="font-bold text-slate-700 text-sm line-clamp-2">
                                                                                {q.question_text}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <button
                                                                                onClick={() => editQuestion(q)}
                                                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                                                                            >
                                                                                <PencilIcon className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => deleteQuestion(q.id)}
                                                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                                                                            >
                                                                                <TrashIcon className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        {questionList.filter(q => q.quiz_id === (activeQuizId || quizForm.id)).length === 0 && (
                                                            <div className="text-center py-10 px-4 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                                                <p className="text-slate-400 text-sm italic">
                                                                    Belum ada soal. Simpan draft pertama Anda!
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    )}

                    { }
                    {currentView === "kuis-bank" && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">
                                    Bank Soal
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    Koleksi semua soal dari berbagai kuis
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold">
                                            <tr>
                                                <th className="px-6 py-4">Soal</th>
                                                <th className="px-6 py-4">Kuis</th>
                                                <th className="px-6 py-4">Tipe</th>
                                                <th className="px-6 py-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {questionList.map((q: any) => {
                                                const quiz = quizList.find((qz) => qz.id === q.quiz_id);
                                                return (
                                                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-slate-700 line-clamp-1">{q.question_text || 'Tanpa Pertanyaan'}</p>
                                                            {q.romaji && <p className="text-xs text-slate-400 font-mono mt-0.5">{q.romaji}</p>}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                                                {quiz?.title || "Unknown"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-slate-500">
                                                            {q.type === 'multiple_choice' ? 'MC' : 'Essay'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => editQuestion(q)}
                                                                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                                                >
                                                                    <PencilIcon className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteQuestion(q.id)}
                                                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                                                >
                                                                    <TrashIcon className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {questionList.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                        Belum ada soal di bank soal.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    { }
                    {currentView === "peringkat-global" && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        Peringkat Siswa
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Ranking berdasarkan performa kuis tertinggi
                                    </p>
                                </div>

                                <button
                                    onClick={() => exportLeaderboard()}
                                    className="border-2 border-blue-600 text-blue-600 px-5 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                >
                                    <ArrowDownTrayIcon className="w-5 h-5" />
                                    Export CSV
                                </button>
                            </div>

                            { }
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <select
                                        value={lbLevelFilter}
                                        onChange={(e) => setLbLevelFilter(e.target.value)}
                                        className="px-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                    >
                                        <option value="all">Semua Level</option>
                                        <option value="N5">N5</option>
                                        <option value="N4">N4</option>
                                        <option value="N3">N3</option>
                                        <option value="N2">N2</option>
                                        <option value="N1">N1</option>
                                    </select>

                                    <select
                                        value={lbQuizFilter}
                                        onChange={(e) => setLbQuizFilter(e.target.value)}
                                        className="px-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                    >
                                        <option value="all">Semua Kuis</option>
                                        {quizOptionsForFilter.map((q) => (
                                            <option key={q.id} value={q.id}>
                                                {q.title}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={lbSort}
                                        onChange={(e) => setLbSort(e.target.value as any)}
                                        className="px-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                    >
                                        <option value="score">Urut: Skor</option>
                                        <option value="time">Urut: Waktu (lebih cepat)</option>
                                        <option value="score_time">Urut: Skor & Waktu</option>
                                    </select>
                                </div>
                            </div>

                            { }
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold">
                                            <tr>
                                                <th className="px-6 py-4">Rank</th>
                                                <th className="px-6 py-4">Nama</th>
                                                <th className="px-6 py-4">Username</th>
                                                <th className="px-6 py-4 text-right">Skor Total</th>
                                                <th className="px-6 py-4 text-right">Kuis Selesai</th>
                                                <th className="px-6 py-4 text-right">Rata-rata</th>
                                                <th className="px-6 py-4 text-right">Waktu</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {leaderboard.map((row, idx) => (
                                                <tr
                                                    key={row.user_id}
                                                    className="hover:bg-slate-50 transition-colors"
                                                >
                                                    <td className="px-6 py-4 font-black text-slate-700">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-700">
                                                        {row.full_name || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 font-mono">
                                                        @{row.username || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-blue-600">
                                                        {row.total_score}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                                                        {row.quizzes_done}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                                                        {row.avg_score}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-500">
                                                        {formatSeconds(row.total_duration_seconds)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {leaderboard.length === 0 && (
                                        <div className="p-12 text-center text-slate-400">
                                            Belum ada data attempt untuk filter ini.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    { }
                    {currentView === "peringkat-perkuis" && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        Analisis Per Kuis
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Pilih kuis untuk melihat detail performa siswa
                                    </p>
                                </div>
                                <select
                                    value={lbQuizFilter}
                                    onChange={(e) => setLbQuizFilter(e.target.value)}
                                    className="px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold text-slate-700 min-w-[250px] shadow-sm"
                                >
                                    <option value="all">-- Pilih Kuis --</option>
                                    {quizList.map((q) => (
                                        <option key={q.id} value={q.id}>
                                            {q.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {lbQuizFilter !== "all" ? (
                                <>
                                    { }
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Attempt</p>
                                            <p className="text-2xl font-black text-slate-800 mt-1">
                                                {attempts.filter(a => a.quiz_id === lbQuizFilter).length}
                                            </p>
                                        </div>
                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rata-rata Skor</p>
                                            <p className="text-2xl font-black text-blue-600 mt-1">
                                                {(() => {
                                                    const qAtts = attempts.filter(a => a.quiz_id === lbQuizFilter);
                                                    if (!qAtts.length) return 0;
                                                    const sum = qAtts.reduce((acc, a) => acc + (a.score || 0), 0);
                                                    return Math.round(sum / qAtts.length);
                                                })()}
                                            </p>
                                        </div>
                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skor Tertinggi</p>
                                            <p className="text-2xl font-black text-emerald-600 mt-1">
                                                {(() => {
                                                    const qAtts = attempts.filter(a => a.quiz_id === lbQuizFilter);
                                                    if (!qAtts.length) return 0;
                                                    return Math.max(...qAtts.map(a => a.score || 0));
                                                })()}
                                            </p>
                                        </div>
                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Tercepat</p>
                                            <p className="text-2xl font-black text-orange-600 mt-1 text-sm truncate">
                                                {(() => {
                                                    const qAtts = attempts.filter(a => a.quiz_id === lbQuizFilter && a.duration_seconds);
                                                    if (!qAtts.length) return "-";
                                                    const fastest = Math.min(...qAtts.map(a => a.duration_seconds || 999999));
                                                    return formatSeconds(fastest);
                                                })()}
                                            </p>
                                        </div>
                                    </div>

                                    { }
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                            <h3 className="font-bold text-slate-700">Peringkat Siswa</h3>
                                            <div className="flex gap-2">
                                                <select
                                                    value={lbSort}
                                                    onChange={(e) => setLbSort(e.target.value as any)}
                                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none"
                                                >
                                                    <option value="score">Urut: Skor</option>
                                                    <option value="time">Urut: Waktu</option>
                                                    <option value="score_time">Urut: Skor & Waktu</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                                                    <tr>
                                                        <th className="px-6 py-4">Rank</th>
                                                        <th className="px-6 py-4">Nama</th>
                                                        <th className="px-6 py-4 text-right">Skor</th>
                                                        <th className="px-6 py-4 text-right">Waktu</th>
                                                        <th className="px-6 py-4 text-right">Attempt</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {leaderboard.map((row, idx) => (
                                                        <tr key={row.user_id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? "bg-yellow-100 text-yellow-700" :
                                                                    idx === 1 ? "bg-slate-100 text-slate-600" :
                                                                        idx === 2 ? "bg-orange-100 text-orange-700" :
                                                                            "text-slate-400"
                                                                    }`}>
                                                                    {idx + 1}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="font-bold text-slate-700 text-sm">{row.full_name || "-"}</p>
                                                                <p className="text-[10px] text-slate-400 font-mono italic">@{row.username || "-"}</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-black text-blue-600">
                                                                {row.total_score}
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-bold text-slate-500 text-sm">
                                                                {formatSeconds(row.total_duration_seconds)}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black">
                                                                    {row.quizzes_done}x
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {leaderboard.length === 0 && (
                                                <div className="p-12 text-center">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <TrophyIcon className="w-8 h-8 text-slate-200" />
                                                    </div>
                                                    <p className="text-slate-400 text-sm italic">Belum ada data untuk kuis ini.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
                                    <div className="w-20 h-20 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <TrophyIcon className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Pilih Kuis Terlebih Dahulu</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto">
                                        Gunakan dropdown di atas untuk memilih kuis yang ingin Anda analisis datanya.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    { }
                    {currentView === "peringkat-export" && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">
                                    Export Data
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    Unduh data sistem dalam format CSV untuk analisis eksternal
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                { }
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <TrophyIcon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Leaderboard</h3>
                                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                        Export data peringkat siswa saat ini berdasarkan filter yang sedang aktif (level/kuis).
                                    </p>
                                    <button
                                        onClick={() => exportLeaderboard("dkotoba_leaderboard_filtered.csv")}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ArrowDownTrayIcon className="w-5 h-5" />
                                        Export CSV
                                    </button>
                                </div>

                                { }
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <UsersIcon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Data Siswa</h3>
                                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                        Export daftar lengkap seluruh siswa yang terdaftar di sistem beserta informasi profil mereka.
                                    </p>
                                    <button
                                        onClick={exportStudents}
                                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ArrowDownTrayIcon className="w-5 h-5" />
                                        Export CSV
                                    </button>
                                </div>

                                { }
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <ChartBarIcon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Riwayat Attempt</h3>
                                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                        Export seluruh log pengerjaan kuis oleh semua siswa (skor, waktu, dan tanggal selesai).
                                    </p>
                                    <button
                                        onClick={exportAttempts}
                                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ArrowDownTrayIcon className="w-5 h-5" />
                                        Export CSV
                                    </button>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                                        <DocumentArrowDownIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-800">Tips Export Data</h4>
                                        <p className="text-sm text-blue-600 mt-1 leading-relaxed">
                                            File CSV yang diunduh dapat dibuka menggunakan aplikasi spreadsheet seperti Google Sheets atau Microsoft Excel. Jika ada karakter Jepang yang tidak muncul dengan benar, pastikan Anda membukanya dengan encoding UTF-8.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === "siswa-detail" && (
                        <div className="h-full flex flex-col space-y-6 animate-fade-in overflow-hidden">
                            {(() => {
                                const student = userList.find(u => u.id === selectedStudentId);
                                if (!student) return (
                                    <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
                                        <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p>Silakan pilih siswa dari daftar</p>
                                        <button
                                            onClick={() => setCurrentView("siswa-daftar")}
                                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold"
                                        >
                                            Buka Daftar Siswa
                                        </button>
                                    </div>
                                );

                                const studentAttempts = attempts.filter(a => a.user_id === student.id)
                                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                                const lbRowIndex = leaderboard.findIndex(l => l.user_id === student.id);
                                const totalScore = lbRowIndex !== -1 ? leaderboard[lbRowIndex].total_score : 0;
                                const rank = lbRowIndex !== -1 ? lbRowIndex + 1 : "-";

                                return (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => setCurrentView("siswa-daftar")}
                                                    className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-slate-600"
                                                >
                                                    <ArrowLeftIcon className="w-5 h-5" />
                                                </button>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-800">Detail Profil Siswa</h2>
                                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                                        <span>Siswa</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="font-medium text-slate-700">{student.full_name}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={async () => {
                                                        const nextStatus = student.status === "aktif" ? "nonaktif" : "aktif";
                                                        const { error } = await supabase
                                                            .from('profiles')
                                                            .update({ status: nextStatus })
                                                            .eq('id', student.id);

                                                        if (!error) {
                                                            showNotification("success", `Status siswa berhasil diubah ke ${nextStatus}`);
                                                            fetchAllData();
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${student.status === "aktif"
                                                        ? "bg-white text-red-600 border-red-100 hover:bg-red-50"
                                                        : "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                                        }`}
                                                >
                                                    {student.status === "aktif" ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full flex-1 min-h-0 px-1 py-1">
                                            { }
                                            <div className="lg:col-span-3 space-y-4 h-full">
                                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group flex flex-col justify-between">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                                    <div className="relative">
                                                        <div className="flex items-center gap-4 mb-8">
                                                            <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                                                                {student.full_name?.charAt(0).toUpperCase() || "?"}
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <h3 className="font-black text-slate-800 text-2xl leading-none mb-2 truncate" title={student.full_name || ""}>
                                                                    {student.full_name}
                                                                </h3>
                                                                <p className="text-slate-400 font-mono text-sm">@{student.username}</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Akun</span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${student.status === "aktif" ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"
                                                                    }`}>
                                                                    {student.status || "aktif"}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</span>
                                                                <span className="font-mono text-xs font-bold text-slate-700">{student.password || "••••••••"}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terdaftar Pada</span>
                                                                <span className="text-xs font-bold text-slate-700">
                                                                    {new Date(student.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm relative overflow-hidden group flex flex-col justify-center min-h-[120px]">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                                    <div className="relative text-center">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Metrik Performa Utama</p>

                                                        <div className="space-y-3">
                                                            <div>
                                                                <p className="text-5xl font-black tracking-tighter text-slate-900 leading-none">{totalScore}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-[0.15em]">Total XP Terkumpul</p>
                                                            </div>

                                                            <div className="pt-3 border-t border-slate-50 w-2/3 mx-auto">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <TrophyIcon className="w-4 h-4 text-amber-500" />
                                                                    <p className="text-2xl font-black text-blue-600">#{rank}</p>
                                                                </div>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Peringkat Global</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                { }
                                                <div className="bg-white p-5 rounded-2xl border-2 border-indigo-50 shadow-sm relative overflow-hidden flex-1 group">
                                                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                                    <div className="relative h-full flex flex-col justify-between">
                                                        <div>
                                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Target Milestone</p>
                                                            <h4 className="text-lg font-black leading-tight text-slate-800">Capaian Menuju N5</h4>
                                                        </div>

                                                        <div className="mt-4">
                                                            <div className="flex justify-between text-[10px] font-bold mb-2">
                                                                <span className="text-slate-400 uppercase">Progres Level</span>
                                                                <span className="text-indigo-600">{Math.min(100, Math.round((totalScore / 1000) * 100))}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                                                    style={{ width: `${Math.min(100, Math.round((totalScore / 1000) * 100))}%` }}
                                                                ></div>
                                                            </div>
                                                            <p className="text-[9px] text-slate-400 mt-2 font-medium italic">
                                                                *{1000 - (totalScore % 1000)} XP lagi untuk milestone berikutnya.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            { }
                                            <div className="lg:col-span-9 space-y-4 flex flex-col h-full overflow-hidden">
                                                { }
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-200 transition-colors h-[100px] flex items-center">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                                <CheckBadgeIcon className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Kuis Lulus</p>
                                                                <p className="text-2xl font-black text-slate-900">{studentAttempts.length}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-emerald-200 transition-colors h-[120px] flex items-center">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                                <ChartBarIcon className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rata-rata Skor</p>
                                                                <p className="text-2xl font-black text-slate-900">
                                                                    {studentAttempts.length > 0
                                                                        ? Math.round(studentAttempts.reduce((a, b) => a + (Number(b.score) || 0), 0) / studentAttempts.length)
                                                                        : 0
                                                                    }%
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-amber-200 transition-colors h-[120px] flex items-center">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                                                                <ClockIcon className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimasi Waktu</p>
                                                                <p className="text-2xl font-black text-slate-900">
                                                                    {Math.round(studentAttempts.reduce((a, b) => a + (Number(b.duration_seconds) || 0), 0) / 60)}m
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                { }
                                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                                                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                                            <h4 className="font-black text-slate-800 text-sm tracking-wider uppercase">Log Aktivitas</h4>
                                                        </div>
                                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                                            {studentAttempts.length} AKTIVITAS
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 overflow-x-auto">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                                                                    <th className="px-8 py-4">Informasi Kuis</th>
                                                                    <th className="px-8 py-4 text-center">Level</th>
                                                                    <th className="px-8 py-4 text-center">Performa</th>
                                                                    <th className="px-8 py-4 text-center">Durasi</th>
                                                                    <th className="px-8 py-4 text-right">Tanggal Selesai</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50">
                                                                {studentAttempts.map((a, idx) => {
                                                                    const quiz = quizList.find(q => q.id === a.quiz_id);
                                                                    return (
                                                                        <tr key={a.id} className="hover:bg-blue-50/30 transition-all group/tr">
                                                                            <td className="px-8 py-5">
                                                                                <div className="font-black text-slate-800 text-sm group-hover/tr:text-blue-700 transition-colors">{quiz?.title || "Quiz Terhapus"}</div>
                                                                                <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-2">
                                                                                    <span className="opacity-50">ID:</span> {quiz?.id?.slice(0, 8)}...
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-8 py-5 text-center">
                                                                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black group-hover/tr:bg-blue-100 group-hover/tr:text-blue-600 transition-all">
                                                                                    {quiz?.level || "-"}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-8 py-5 text-center">
                                                                                <div className="flex flex-col items-center gap-1">
                                                                                    <span className={`font-black text-base ${Number(a.score) >= 80 ? "text-emerald-600" : Number(a.score) >= 60 ? "text-amber-600" : "text-red-500"
                                                                                        }`}>{a.score}%</span>
                                                                                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                                        <div
                                                                                            className={`h-full rounded-full ${Number(a.score) >= 80 ? "bg-emerald-500" : Number(a.score) >= 60 ? "bg-amber-500" : "bg-red-500"
                                                                                                }`}
                                                                                            style={{ width: `${a.score}%` }}
                                                                                        ></div>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-8 py-5 text-center">
                                                                                <div className="flex items-center justify-center gap-1.5 text-slate-500">
                                                                                    <ClockIcon className="w-3.5 h-3.5 opacity-40" />
                                                                                    <span className="text-xs font-bold">{a.duration_seconds}s</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-8 py-5 text-right">
                                                                                <div className="text-xs text-slate-800 font-black">
                                                                                    {new Date(a.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                                </div>
                                                                                <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                                                    Pukul {new Date(a.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                                {studentAttempts.length === 0 && (
                                                                    <tr>
                                                                        <td colSpan={5} className="px-8 py-32 text-center">
                                                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                                                <DocumentTextIcon className="w-16 h-16" />
                                                                                <p className="font-black text-sm uppercase tracking-widest">Belum ada riwayat aktivitas kuis</p>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                    {currentView === "siswa-riwayat" && (
                        <div className="space-y-6 animate-fade-in h-full flex flex-col">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">Riwayat Seluruh Aktivitas</h2>
                                    <p className="text-sm text-slate-500 mt-1 font-medium">Monitoring performa kuis dari seluruh siswa</p>
                                </div>
                                <div className="relative w-full md:w-96">
                                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama siswa atau judul kuis..."
                                        value={activitySearchQuery}
                                        onChange={(e) => setActivitySearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 text-sm border border-slate-100 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-4 text-center">No</th>
                                                <th className="px-6 py-4">Siswa</th>
                                                <th className="px-6 py-4">Kuis</th>
                                                <th className="px-6 py-4 text-center">Skor</th>
                                                <th className="px-6 py-4 text-center">Durasi</th>
                                                <th className="px-6 py-4 text-right">Tanggal Selesai</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {attempts
                                                .filter(a => {
                                                    const s = allProfiles.find(u => u.id === a.user_id);
                                                    const q = quizList.find(qz => qz.id === a.quiz_id);
                                                    const qry = activitySearchQuery.toLowerCase();
                                                    return !activitySearchQuery ||
                                                        s?.full_name?.toLowerCase().includes(qry) ||
                                                        s?.username?.toLowerCase().includes(qry) ||
                                                        q?.title?.toLowerCase().includes(qry);
                                                })
                                                .map((a, idx) => {
                                                    const s = allProfiles.find(u => u.id === a.user_id);
                                                    const q = quizList.find(qz => qz.id === a.quiz_id);
                                                    return (
                                                        <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="px-6 py-4 text-center font-mono text-[10px] text-slate-300">
                                                                {String(idx + 1).padStart(2, '0')}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <p className="font-bold text-slate-700 text-sm leading-none mb-1">{s?.full_name || "-"}</p>
                                                                    <p className="font-mono text-[10px] text-slate-400">@{s?.username || "-"}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <p className="font-bold text-slate-700 text-sm leading-none mb-1">{q?.title || "-"}</p>
                                                                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-black uppercase tracking-tighter border border-slate-200">
                                                                        LEVEL {q?.level || "N5"}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="inline-flex flex-col items-center">
                                                                    <span className="text-sm font-black text-slate-800 leading-none">{a.score}</span>
                                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${a.score >= 80 ? 'bg-emerald-50 text-emerald-600' :
                                                                        a.score >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                                                        }`}>
                                                                        {a.score}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center font-mono text-xs text-slate-500 font-bold">
                                                                <div className="flex items-center justify-center gap-1.5">
                                                                    <ClockIcon className="w-3.5 h-3.5 opacity-40" />
                                                                    {a.duration_seconds ? (
                                                                        <span>{Math.floor(a.duration_seconds / 60)}m {a.duration_seconds % 60}s</span>
                                                                    ) : "-"}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex flex-col items-end">
                                                                    <p className="text-xs font-bold text-slate-600">
                                                                        {new Date(a.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                                        {new Date(a.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === "siswa-role" && (
                        <div className="space-y-6 animate-fade-in h-full flex flex-col overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">Manajemen Role & Akses</h2>
                                    <p className="text-sm text-slate-500 mt-1 font-medium">Atur hak akses admin dan siswa</p>
                                </div>
                                <div className="relative w-full md:w-96">
                                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari user (nama/username)..."
                                        value={profileSearchQuery}
                                        onChange={handleProfileSearch}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 text-sm border border-slate-100 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-4">Informasi User</th>
                                                <th className="px-6 py-4">Terdaftar Pada</th>
                                                <th className="px-6 py-4 text-center">Role Saat Ini</th>
                                                <th className="px-6 py-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredProfiles.map((p) => (
                                                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${p.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {p.full_name?.charAt(0).toUpperCase() || "?"}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-700 text-sm leading-none mb-1">{p.full_name || "-"}</p>
                                                                <p className="font-mono text-[10px] text-slate-400">@{p.username || "-"}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-bold text-slate-600">
                                                            {new Date(p.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${p.role === 'admin'
                                                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                            : 'bg-slate-50 text-slate-500 border-slate-200'
                                                            }`}>
                                                            {p.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => toggleUserRole(p.id, p.role)}
                                                            disabled={p.id === currentUser?.id}
                                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${p.role === 'admin'
                                                                ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white'
                                                                : 'bg-blue-600 text-white border border-blue-500 hover:bg-blue-700 shadow-sm shadow-blue-500/20'
                                                                }`}
                                                        >
                                                            {p.role === 'admin' ? 'Ubah ke User' : 'Ubah ke Admin'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-amber-50 border-t border-amber-100">
                                    <div className="flex items-center gap-2 text-amber-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider">Catatan: Role Admin memiliki akses penuh ke seluruh dashboard.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    { }
                    {currentView === "siswa-daftar" && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        Manajemen Siswa
                                    </h2>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Cari dan pantau progress siswa
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-100">
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <div className="relative flex-1">
                                            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Cari siswa..."
                                                value={searchQuery}
                                                onChange={handleUserSearch}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 text-sm"
                                            />
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <div className="relative">
                                                <ClockIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <select
                                                    value={userSortOrder}
                                                    onChange={(e) => setUserSortOrder(e.target.value as any)}
                                                    className="pl-9 pr-8 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 text-sm appearance-none font-medium text-slate-600 cursor-pointer"
                                                >
                                                    <option value="newest">Terbaru</option>
                                                    <option value="oldest">Terlama</option>
                                                </select>
                                                <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                                            <tr>
                                                <th className="px-4 py-3 text-center" style={{ width: '5%' }}>No</th>
                                                <th className="px-4 py-3" style={{ width: '25%' }}>Nama Lengkap</th>
                                                <th className="px-4 py-3" style={{ width: '15%' }}>Username</th>
                                                <th className="px-4 py-3" style={{ width: '12%' }}>Password</th>
                                                <th className="px-4 py-3 text-center" style={{ width: '10%' }}>Status</th>
                                                <th className="px-4 py-3 text-right" style={{ width: '10%' }}>Skor XP</th>
                                                <th className="px-4 py-3 text-right" style={{ width: '23%' }}>Waktu Gabung</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {[...filteredUsers]
                                                .sort((a, b) => {
                                                    const dateA = new Date(a.created_at).getTime();
                                                    const dateB = new Date(b.created_at).getTime();
                                                    return userSortOrder === "newest" ? dateB - dateA : dateA - dateB;
                                                })
                                                .map((u, idx) => {
                                                    const lbRow = leaderboard.find((x) => x.user_id === u.id);
                                                    const totalScore = lbRow?.total_score || 0;

                                                    return (
                                                        <tr
                                                            key={u.id}
                                                            onClick={() => {
                                                                setSelectedStudentId(u.id);
                                                                setCurrentView("siswa-detail");
                                                            }}
                                                            className="hover:bg-slate-50/70 transition-colors group/row border-b border-slate-50 cursor-pointer"
                                                        >
                                                            <td className="px-4 py-4 font-mono text-[10px] text-slate-300 text-center">
                                                                {String(idx + 1).padStart(2, '0')}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="font-bold text-slate-700 text-sm tracking-tight truncate">{u.full_name || "-"}</div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="text-slate-400 font-mono text-[10px] group-hover/row:text-slate-600 transition-colors">
                                                                    @{u.username || "-"}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 font-mono text-xs text-slate-500">
                                                                <div className="flex items-center justify-between gap-2 w-full max-w-[100px]">
                                                                    <span className={`transition-all duration-300 truncate ${visiblePasswords.has(u.id) ? "text-slate-600 font-bold" : "text-slate-200"}`}>
                                                                        {visiblePasswords.has(u.id) ? (u.password || "No Pass") : "••••••••"}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => {
                                                                            const next = new Set(visiblePasswords);
                                                                            if (next.has(u.id)) next.delete(u.id);
                                                                            else next.add(u.id);
                                                                            setVisiblePasswords(next);
                                                                        }}
                                                                        className="p-1 opacity-0 group-hover/row:opacity-100 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-all shrink-0"
                                                                    >
                                                                        {visiblePasswords.has(u.id) ? (
                                                                            <EyeSlashIcon className="w-3.5 h-3.5" />
                                                                        ) : (
                                                                            <EyeIcon className="w-3.5 h-3.5" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${u.status === "aktif" || !u.status
                                                                    ? "bg-emerald-50/50 text-emerald-600 border border-emerald-100"
                                                                    : u.status === "nonaktif"
                                                                        ? "bg-slate-50 text-slate-400 border border-slate-100"
                                                                        : "bg-red-50/50 text-red-600 border border-red-100"
                                                                    }`}>
                                                                    {u.status || "aktif"}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-right font-black text-blue-600 text-sm">
                                                                {totalScore.toLocaleString()}<span className="text-[9px] text-slate-300 ml-1">XP</span>
                                                            </td>
                                                            <td className="px-4 py-4 text-right font-medium whitespace-nowrap">
                                                                <span className="text-[10px] text-slate-600 font-bold">
                                                                    {new Date(u.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 mx-1">•</span>
                                                                <span className="text-[9px] text-slate-400 font-bold">
                                                                    {new Date(u.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>

                                    {filteredUsers.length === 0 && (
                                        <div className="p-12 text-center text-slate-400">
                                            Tidak ada siswa ditemukan
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    { }
                    {currentView === "analytics-harian" && (
                        <div className="space-y-6 animate-fade-in h-full flex flex-col overflow-hidden">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">
                                    Laporan / Analytics
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    Ringkasan performa sistem (MVP)
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase">
                                        Total Attempt
                                    </p>
                                    <p className="text-3xl font-black text-slate-800 mt-2">
                                        {attempts.length}
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase">
                                        Quiz Terbanyak Dikerjakan
                                    </p>
                                    <p className="text-lg font-black text-slate-800 mt-2">
                                        {(() => {
                                            if (!attempts.length) return "-";
                                            const countMap = new Map<string, number>();
                                            attempts.forEach((a) => {
                                                countMap.set(a.quiz_id, (countMap.get(a.quiz_id) || 0) + 1);
                                            });
                                            const top = Array.from(countMap.entries()).sort(
                                                (a, b) => b[1] - a[1]
                                            )[0];
                                            const quiz = quizList.find((q) => q.id === top[0]);
                                            return quiz?.title || top[0];
                                        })()}
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase">
                                        Rata-rata Skor
                                    </p>
                                    <p className="text-3xl font-black text-slate-800 mt-2">
                                        {(() => {
                                            if (!attempts.length) return 0;
                                            const sum = attempts.reduce((acc, a) => acc + Number(a.score || 0), 0);
                                            return Math.round(sum / attempts.length);
                                        })()}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800">Tren Aktivitas 7 Hari Terakhir</h3>
                                        <p className="text-xs text-slate-500 font-medium">Jumlah pengerjaan kuis harian</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Total Attempt</span>
                                    </div>
                                </div>
                                <div className="flex-1 w-full min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dailyAttemptData}>
                                            <defs>
                                                <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e2e8f0',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                    padding: '8px 12px'
                                                }}
                                                labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px', fontSize: '10px' }}
                                                itemStyle={{ fontWeight: 700, color: '#3b82f6', fontSize: '12px', padding: 0 }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="attempts"
                                                stroke="#3b82f6"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorAttempts)"
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === "analytics-populer" && (
                        <div className="space-y-6 animate-fade-in h-full flex flex-col overflow-hidden">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">10 Kuis dengan Pengerjaan Terbanyak</h3>
                                        <p className="text-sm text-slate-500">Berdasarkan total attempt siswa</p>
                                    </div>
                                </div>

                                <div className="flex-1 w-full min-h-0">
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={popularQuizzesData}
                                                layout="vertical"
                                                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    dataKey="title"
                                                    type="category"
                                                    width={150}
                                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Bar dataKey="total_attempt" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                                                    {popularQuizzesData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#1d4ed8' : '#3b82f6'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === "analytics-rata" && (
                        <div className="space-y-6 animate-fade-in h-full flex flex-col overflow-hidden">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Rata-rata Skor</h2>
                                <p className="text-slate-500 text-sm mt-1">10 Kuis dengan rata-rata skor tertinggi</p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
                                <div className="flex-1 w-full min-h-0">
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={averageScoreData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                                                    interval={0}
                                                    angle={-15}
                                                    textAnchor="end"
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                                    domain={[0, 100]}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{
                                                        backgroundColor: '#fff',
                                                        borderRadius: '12px',
                                                        border: '1px solid #e2e8f0',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                    }}
                                                    itemStyle={{ fontWeight: 700, color: '#10b981', fontSize: '12px' }}
                                                    formatter={(value) => [`${value}%`, 'Rata-rata Skor']}
                                                />
                                                <Bar dataKey="avg" radius={[4, 4, 0, 0]} barSize={40}>
                                                    {averageScoreData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill="#10b981" fillOpacity={1 - (index * 0.08)} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === "analytics-aktif" && (
                        <div className="space-y-6 animate-fade-in h-full flex flex-col overflow-hidden">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Siswa Paling Aktif</h2>
                                <p className="text-slate-500 text-sm mt-1">10 Siswa dengan jumlah pengerjaan kuis terbanyak</p>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-4 w-16 text-center">Rank</th>
                                                <th className="px-6 py-4">Nama Siswa</th>
                                                <th className="px-6 py-4 text-center">Total Attempt</th>
                                                <th className="px-6 py-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {activeStudentsData.map((s, idx) => (
                                                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-100 text-amber-600' :
                                                            idx === 1 ? 'bg-slate-100 text-slate-500' :
                                                                idx === 2 ? 'bg-orange-50 text-orange-600' :
                                                                    'bg-white text-slate-400 border border-slate-100'
                                                            }`}>
                                                            {idx + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-bold text-slate-700 text-sm leading-none mb-1">{s.name}</p>
                                                            <p className="font-mono text-[10px] text-slate-400">@{s.username}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                                                            {s.count} <span className="text-[10px] text-blue-400 font-bold ml-1 uppercase">Kuis</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedStudentId(s.id);
                                                                setCurrentView("siswa-detail");
                                                            }}
                                                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                                                        >
                                                            Lihat Detail
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    { }
                    {currentView === "konten-daftar" && (
                        <div className="space-y-6 animate-fade-in h-full flex flex-col overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Daftar Materi</h2>
                                    <p className="text-slate-500 text-sm mt-1">Kelola seluruh materi pembelajaran Anda</p>
                                </div>
                                <button
                                    onClick={() => setCurrentView("konten-tambah")}
                                    className="bg-blue-600 text-white px-5 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    Tambah Materi
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 shrink-0">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2 relative">
                                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari judul atau isi materi..."
                                            value={materialSearchQuery}
                                            onChange={handleMaterialSearch}
                                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                        />
                                    </div>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => {
                                            setCategoryFilter(e.target.value);
                                            filterMaterials(materialSearchQuery, e.target.value, materialLevelFilter);
                                        }}
                                        className="px-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                    >
                                        <option value="all">Semua Kategori</option>
                                        {categoryList.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={materialLevelFilter}
                                        onChange={(e) => {
                                            setMaterialLevelFilter(e.target.value);
                                            filterMaterials(materialSearchQuery, categoryFilter, e.target.value);
                                        }}
                                        className="px-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                    >
                                        <option value="all">Semua Level</option>
                                        <option value="N5">N5</option>
                                        <option value="N4">N4</option>
                                        <option value="N3">N3</option>
                                        <option value="N2">N2</option>
                                        <option value="N1">N1</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-6 py-4">Materi</th>
                                                <th className="px-6 py-4">Kategori</th>
                                                <th className="px-6 py-4">Level</th>
                                                <th className="px-6 py-4">Update</th>
                                                <th className="px-6 py-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredMaterials.map((m) => {
                                                const cat = categoryList.find(c => c.id === m.category_id);
                                                return (
                                                    <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-slate-700 text-sm line-clamp-1">{m.title}</p>
                                                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{m.body}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                                                                {cat?.name || "Tanpa Kategori"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                                                {m.level}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-[10px] text-slate-500 font-bold">
                                                                {new Date(m.updated_at).toLocaleDateString("id-ID")}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => editMaterial(m)}
                                                                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                                                >
                                                                    <PencilIcon className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteMaterial(m.id)}
                                                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                                                >
                                                                    <TrashIcon className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredMaterials.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                                                        Belum ada materi ditemukan.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === "konten-tambah" && (
                        <div className="space-y-6 animate-fade-in h-full flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => {
                                            setCurrentView("konten-daftar");
                                            setMaterialForm({ id: "", title: "", body: "", category_id: "", level: "N5" });
                                            setMaterialModalMode("add");
                                        }}
                                        className="flex items-center gap-2 p-2 px-4 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all text-slate-500 hover:text-slate-800 font-bold group"
                                    >
                                        <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                                        <span>Kembali</span>
                                    </button>
                                    <div className="h-8 w-[1px] bg-slate-200"></div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">
                                            {materialModalMode === "add" ? "Tambah Materi Baru" : "Edit Materi"}
                                        </h2>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Materi Pembelajaran</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setCurrentView("konten-daftar");
                                            setMaterialForm({ id: "", title: "", body: "", category_id: "", level: "N5" });
                                            setMaterialModalMode("add");
                                        }}
                                        className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={saveMaterial}
                                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm"
                                    >
                                        {materialModalMode === "add" ? "Publikasikan" : "Simpan Perubahan"}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden">
                                { }
                                <div className="md:w-[350px] space-y-6 overflow-y-auto pr-2">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Judul Materi *</label>
                                            <input
                                                type="text"
                                                value={materialForm.title}
                                                onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                                                placeholder="Contoh: Partikel WA dan GA"
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold text-slate-700"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kategori</label>
                                            <select
                                                value={materialForm.category_id}
                                                onChange={(e) => setMaterialForm({ ...materialForm, category_id: e.target.value })}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold text-slate-700 appearance-none"
                                            >
                                                <option value="">-- Tanpa Kategori --</option>
                                                {categoryList.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Level JLPT</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["N5", "N4", "N3", "N2", "N1"].map((lvl) => (
                                                    <button
                                                        key={lvl}
                                                        onClick={() => setMaterialForm({ ...materialForm, level: lvl })}
                                                        className={`py-3 rounded-xl font-black text-sm transition-all border ${materialForm.level === lvl
                                                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white"
                                                            }`}
                                                    >
                                                        {lvl}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                            <BookOpenIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-blue-900 mb-1">Tips Menulis</h4>
                                            <p className="text-[11px] text-blue-600/80 font-medium leading-relaxed">
                                                Gunakan bahasa yang mudah dimengerti. Anda bisa menyisipkan contoh kalimat untuk mempermudah pemahaman siswa.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                { }
                                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                                    <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Isi Materi Pembelajaran *</label>
                                        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                                            {materialForm.body.length} Karakter
                                        </span>
                                    </div>
                                    <textarea
                                        value={materialForm.body}
                                        onChange={(e) => setMaterialForm({ ...materialForm, body: e.target.value })}
                                        placeholder="Tulis materi pembelajaran di sini... (Mendukung teks panjang)"
                                        className="w-full flex-1 p-8 outline-none font-medium text-slate-700 resize-none leading-relaxed text-lg"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === "konten-kategori" && (
                        <div className="space-y-6 animate-fade-in h-full flex flex-col overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Kategori Materi</h2>
                                    <p className="text-slate-500 text-sm mt-1">Kelola kategori untuk mengelompokkan materi</p>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nama kategori baru..."
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        className="px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500 font-bold"
                                    />
                                    <button
                                        onClick={() => {
                                            setCategoryModalMode("add");
                                            saveCategory();
                                        }}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                        Simpan
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-8">
                                {categoryList.map((c) => (
                                    <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        const newName = window.prompt("Ubah nama kategori:", c.name);
                                                        if (newName) {
                                                            setCategoryForm({ id: c.id, name: newName });
                                                            setCategoryModalMode("edit");
                                                            (async () => {
                                                                const { error } = await supabase
                                                                    .from("material_categories")
                                                                    .update({ name: newName })
                                                                    .eq("id", c.id);
                                                                if (!error) {
                                                                    showNotification("success", "Kategori diperbarui!");
                                                                    fetchAllData();
                                                                }
                                                            })();
                                                        }
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-blue-600"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteCategory(c.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800">{c.name}</h3>
                                            <p className="text-sm text-slate-400 mt-1 font-bold">
                                                {materialList.filter(m => m.category_id === c.id).length} Materi
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {categoryList.length === 0 && (
                                    <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                                        <BookOpenIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p>Belum ada kategori materi. Buat kategori pertama Anda di atas!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            { }
            {quizModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-6">
                            {quizModalMode === "add" ? "Buat Kuis Baru" : "Edit Kuis"}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Judul Kuis *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Latihan N5 - Hiragana Dasar"
                                    value={quizForm.title}
                                    onChange={(e) =>
                                        setQuizForm({ ...quizForm, title: e.target.value })
                                    }
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Deskripsi
                                </label>
                                <textarea
                                    placeholder="Deskripsi singkat tentang kuis ini..."
                                    value={quizForm.description}
                                    onChange={(e) =>
                                        setQuizForm({ ...quizForm, description: e.target.value })
                                    }
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Level
                                    </label>
                                    <select
                                        value={quizForm.level}
                                        onChange={(e) =>
                                            setQuizForm({ ...quizForm, level: e.target.value })
                                        }
                                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500"
                                    >
                                        <option value="N5">N5</option>
                                        <option value="N4">N4</option>
                                        <option value="N3">N3</option>
                                        <option value="N2">N2</option>
                                        <option value="N1">N1</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Deadline (Opsional)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={quizForm.deadline_at}
                                    onChange={(e) =>
                                        setQuizForm({ ...quizForm, deadline_at: e.target.value })
                                    }
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Jumlah Soal (Total)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={quizForm.total_questions || ""}
                                    onChange={(e) =>
                                        setQuizForm({ ...quizForm, total_questions: parseInt(e.target.value) || 0 })
                                    }
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={quizForm.is_active}
                                    onChange={(e) =>
                                        setQuizForm({ ...quizForm, is_active: e.target.checked })
                                    }
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <label
                                    htmlFor="is_active"
                                    className="font-bold text-slate-700 cursor-pointer"
                                >
                                    Publish kuis (aktifkan untuk siswa)
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setQuizModalOpen(false)}
                                    className="flex-1 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={saveQuiz}
                                    className="flex-1 py-3 font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                                >
                                    {quizModalMode === "add" ? "Buat Kuis" : "Simpan Perubahan"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            { }
            {
                sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )
            }
        </div>
    );
}
