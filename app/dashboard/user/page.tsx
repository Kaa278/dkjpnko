"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/dashboard/Sidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import TopBar from "@/components/dashboard/TopBar";
import {
    TrophyIcon,
    BookOpenIcon,
    ChartBarIcon,
    CheckCircleIcon,
    PlayIcon,
    ClockIcon,
    ArrowPathIcon
} from "@heroicons/react/24/solid";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function UserDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentView, setCurrentView] = useState("dashboard");
    const [myAttempts, setMyAttempts] = useState<string[]>([]);

    
    const [stats, setStats] = useState({ score: 0, completed: 0, rank: '-' as string | number });
    const [soalList, setSoalList] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    
    const [quizModalOpen, setQuizModalOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
    const [leaderboardFilter, setLeaderboardFilter] = useState('all');
    const [leaderboardSort, setLeaderboardSort] = useState<'score' | 'time' | 'score_time'>('score');

    
    const [reportForm, setReportForm] = useState({ subject: '', category: 'bug', message: '' });
    const [reportMsg, setReportMsg] = useState('');
    const [profileForm, setProfileForm] = useState({ fullName: '', password: '' });
    const [profileMsg, setProfileMsg] = useState('');

    const [realContentList, setRealContentList] = useState<any[]>([]);
    const [filteredContent, setFilteredContent] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [viewContentData, setViewContentData] = useState<any>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);

    useEffect(() => {
        fetchUserAndData();
    }, []);

    const fetchUserAndData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/auth?mode=login");
                return;
            }

            
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profile) {
                setCurrentUser({ ...user, ...profile });
                setProfileForm(prev => ({ ...prev, fullName: profile.full_name || '' }));
            }

            
            const { data: quizzes } = await supabase.from('quizzes').select('*').eq('is_active', true);
            setSoalList(quizzes || []);

            
            

            const { data: allProfiles } = await supabase.from('profiles').select('*').neq('role', 'admin');
            const { data: allAttempts } = await supabase.from('quiz_attempts').select('*');

            
            const userStatsMap: Record<string, { score: number, count: number, id: string, name: string, total_duration: number }> = {};

            if (allProfiles) {
                allProfiles.forEach(p => {
                    userStatsMap[p.id] = { score: 0, count: 0, id: p.id, name: p.full_name || p.username || 'User', total_duration: 0 };
                });
            }

            if (allAttempts) {
                allAttempts.forEach(att => {
                    if (userStatsMap[att.user_id]) {
                        
                        
                        
                        userStatsMap[att.user_id].score += Number(att.score);
                        userStatsMap[att.user_id].count += 1;
                        userStatsMap[att.user_id].total_duration += Number(att.duration_seconds || 0);
                    }
                });
            }

            
            const leaderboardData = Object.values(userStatsMap);

            
            const myStats = userStatsMap[user.id] || { score: 0, count: 0 };

            
            if (allAttempts) {
                const myDone = allAttempts.filter(a => a.user_id === user.id).map(a => a.quiz_id);
                setMyAttempts(myDone);
            }

            
            const sortedByScore = [...leaderboardData].sort((a, b) => b.score - a.score);
            const myRank = sortedByScore.findIndex(u => u.id === user.id) + 1;

            setStats({
                score: myStats.score,
                completed: myStats.count,
                rank: myRank
            });

            setLeaderboard(leaderboardData);

            
            const { data: mats } = await supabase.from('learning_materials').select('*').order('created_at', { ascending: false });
            if (mats) {
                setRealContentList(mats);
                setFilteredContent(mats);
            }

            
            const { data: cats } = await supabase.from('material_categories').select('*').order('name', { ascending: true });
            if (cats) {
                setCategories(cats);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const isQuizDone = (quizId: string) => {
        return myAttempts.includes(quizId);
    };

    const filterByCategory = (catId: string) => {
        setSelectedCategory(catId);
        if (catId === "all") {
            setFilteredContent(realContentList);
        } else {
            setFilteredContent(realContentList.filter(m => m.category_id === catId));
        }
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return "-";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}j ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMsg("");

        try {
            
            const { error } = await supabase.from('profiles').update({
                full_name: profileForm.fullName
            }).eq('id', currentUser.id);

            if (error) throw error;

            
            if (profileForm.password) {
                const { error: pwdError } = await supabase.auth.updateUser({
                    password: profileForm.password
                });
                if (pwdError) throw pwdError;
            }

            setProfileMsg("Profil berhasil diperbarui!");
            
            const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
            if (data) setCurrentUser({ ...currentUser, ...data });

        } catch (err: any) {
            setProfileMsg("Gagal update: " + err.message);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-blue-600">
            <svg className="w-10 h-10 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
            {}
            <div className="hidden md:block h-full">
                <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            </div>

            <div className="flex-1 flex flex-col h-full min-w-0 relative">
                <TopBar
                    title={
                        currentView === 'dashboard' ? 'Dashboard' :
                            currentView === 'materi' ? 'Materi Belajar' :
                                currentView === 'soal' ? 'Daftar Kuis' :
                                    currentView === 'leaderboard' ? 'Peringkat Global' :
                                        currentView === 'report' ? 'Laporan' : 'Pengaturan'
                    }
                    user={currentUser}
                    setCurrentView={setCurrentView}
                />

                <main className="flex-1 overflow-y-auto px-4 pt-4 md:p-8 pb-32 md:pb-8 relative scrollbar-thin">
                    {}
                    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
                        <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse delay-700"></div>
                    </div>

                    <div className="max-w-6xl mx-auto space-y-8">

                        {}
                        {currentView === 'dashboard' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-xl shadow-blue-500/20">
                                    <div className="relative z-10 max-w-2xl">
                                        <h2 className="text-3xl font-black mb-2">Ayo belajar hari ini! 🚀</h2>
                                        <p className="text-blue-100 mb-6">Lanjutkan progres belajarmu. Sedikit demi sedikit lama-lama menjadi bukit.</p>
                                        <button onClick={() => setCurrentView('soal')} className="bg-white text-blue-600 px-6 py-2.5 rounded-full font-bold hover:bg-blue-50 transition shadow-lg active:scale-95">
                                            Mulai Kuis
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatsCard title="Total Skor" value={stats.score} icon={ChartBarIcon} color="blue" />
                                    <StatsCard title="Kuis Selesai" value={stats.completed} icon={CheckCircleIcon} color="emerald" />
                                    <StatsCard title="Peringkat Global" value={stats.rank} icon={TrophyIcon} color="orange" />
                                </div>
                            </div>
                        )}

                        {}
                        {currentView === 'materi' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                                    <button
                                        onClick={() => filterByCategory("all")}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === "all" ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        Semua
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => filterByCategory(cat.id)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredContent.map(item => (
                                        <div key={item.id} onClick={() => { setViewContentData(item); setViewModalOpen(true); }}
                                            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer group border-l-4 border-l-blue-500 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                    {categories.find(c => c.id === item.category_id)?.name || "Umum"}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    Level {item.level}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.title}</h4>
                                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{item.body}</p>
                                        </div>
                                    ))}
                                    {filteredContent.length === 0 && (
                                        <div className="col-span-full py-20 text-center bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <BookOpenIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p className="text-slate-400 font-bold tracking-tight">Belum ada materi tersedia.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {}
                        {currentView === 'soal' && (
                            <div className="animate-fade-in grid grid-cols-1 gap-4">
                                {soalList.map(quiz => (
                                    <div key={quiz.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-slate-200 flex items-center justify-between gap-4 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shadow-sm transition-colors ${isQuizDone(quiz.id) ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"}`}>
                                                {isQuizDone(quiz.id) ? (
                                                    <CheckCircleIcon className="w-6 h-6" />
                                                ) : (
                                                    <PencilSquareIcon className="w-6 h-6" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-slate-800 text-base leading-tight truncate pr-2">{quiz.title}</h4>
                                                <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
                                                    <span>{quiz.total_questions || 0} Soal</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span>{Math.round((quiz.time_limit || 0) / 60)} Menit</span>
                                                </p>
                                                {isQuizDone(quiz.id) && (
                                                    <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">
                                                        Selesai
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <button
                                                onClick={() => { setSelectedQuiz(quiz); setQuizModalOpen(true); }}
                                                className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition active:scale-95 flex items-center gap-1.5 ${isQuizDone(quiz.id)
                                                    ? "bg-white text-slate-600 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-none"
                                                    : "bg-indigo-600 text-white shadow-indigo-500/30 hover:bg-indigo-700"
                                                    }`}
                                            >
                                                {isQuizDone(quiz.id) ? (
                                                    <>
                                                        <ArrowPathIcon className="w-4 h-4" />
                                                        <span>Ulangi</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Mulai</span>
                                                        <PlayIcon className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {soalList.length === 0 && (
                                    <div className="text-center py-12 text-slate-400">
                                        <InboxIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Belum ada kuis yang tersedia.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {}
                        {currentView === 'leaderboard' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex justify-between items-center bg-white/50 p-4 rounded-2xl border border-slate-200">
                                    <h3 className="font-bold text-slate-700">Top Learners</h3>
                                    <div className="flex gap-2">
                                        <select
                                            value={leaderboardSort}
                                            onChange={(e) => setLeaderboardSort(e.target.value as any)}
                                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 bg-white"
                                        >
                                            <option value="score">Urut: Skor</option>
                                            <option value="time">Urut: Waktu</option>
                                            <option value="score_time">Urut: Skor & Waktu</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Rank</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Siswa</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Skor</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Kuis</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Waktu</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {leaderboard.sort((a, b) => {
                                                if (leaderboardSort === 'time') {
                                                    
                                                    if (a.total_duration === b.total_duration) {
                                                        return b.score - a.score;
                                                    }
                                                    return a.total_duration - b.total_duration;
                                                }
                                                if (leaderboardSort === 'score_time') {
                                                    
                                                    if (b.score === a.score) {
                                                        return a.total_duration - b.total_duration;
                                                    }
                                                    return b.score - a.score;
                                                }
                                                
                                                if (b.score === a.score) {
                                                    return a.total_duration - b.total_duration;
                                                }
                                                return b.score - a.score;
                                            }).map((user, idx) => (
                                                <tr key={user.id} className={user.id === currentUser?.id ? 'bg-blue-50/50' : ''}>
                                                    <td className="px-6 py-4">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-600' : 'bg-slate-200 text-slate-500'
                                                            }`}>
                                                            {idx + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-700">{user.name}</td>
                                                    <td className="px-6 py-4 text-center font-black text-blue-600">{user.score}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-500">{user.count}</td>
                                                    <td className="px-6 py-4 text-center font-mono text-xs text-slate-500">{formatDuration(user.total_duration)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {}
                        {currentView === 'report' && (
                            <div className="animate-fade-in bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-200 max-w-2xl">
                                <h3 className="text-xl font-bold mb-4">Kirim Laporan</h3>
                                <form onSubmit={(e) => { e.preventDefault(); setReportMsg("Terkirim! (Mock)"); }} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Pesan</label>
                                        <textarea className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 ring-blue-500 outline-none" rows={4}></textarea>
                                    </div>
                                    <button className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-700">Kirim</button>
                                    {reportMsg && <p className="text-green-600 font-bold">{reportMsg}</p>}
                                </form>
                            </div>
                        )}

                        {currentView === 'setting' && (
                            <div className="animate-fade-in bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-200 max-w-2xl">
                                <h3 className="text-xl font-bold mb-4">Edit Profil</h3>
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Nama Lengkap</label>
                                        <input type="text" value={profileForm.fullName} onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Password Baru</label>
                                        <input type="password" value={profileForm.password} onChange={e => setProfileForm({ ...profileForm, password: e.target.value })} placeholder="Biarkan kosong jika tetap" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 ring-blue-500 outline-none" />
                                    </div>
                                    <button className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-700">Simpan</button>
                                    {profileMsg && <p className="text-green-600 font-bold">{profileMsg}</p>}
                                </form>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {}
            <BottomNav currentView={currentView} setCurrentView={setCurrentView} />

            {}
            {quizModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-pop-in">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PlayIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">{selectedQuiz?.title}</h3>
                        <p className="text-slate-500 mb-8">Siap mengerjakan? Waktu berjalan otomatis.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setQuizModalOpen(false)} className="py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Batal</button>
                            <button
                                onClick={() => {
                                    if (selectedQuiz?.external_link) {
                                        
                                        try {
                                            const url = new URL(selectedQuiz.external_link);
                                            url.searchParams.set("uid", currentUser?.id || "");
                                            url.searchParams.set("qid", selectedQuiz.id || "");
                                            url.searchParams.set("uname", currentUser?.full_name || "Guest");
                                            window.open(url.toString(), "_blank");
                                        } catch (e) {
                                            
                                            window.open(selectedQuiz.external_link, "_blank");
                                        }
                                    } else {
                                        router.push(`/quiz/${selectedQuiz?.id}`);
                                    }
                                }}
                                className="py-3 font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                            >
                                {selectedQuiz?.external_link ? "Buka Link" : "Mulai"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            {viewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-2xl w-full text-left shadow-2xl animate-pop-in overflow-hidden max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold">{viewContentData?.title}</h3>
                            <button onClick={() => setViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-8 overflow-y-auto">
                            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{viewContentData?.body}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, color }: any) {
    const colors = {
        blue: "bg-blue-100 text-blue-600",
        emerald: "bg-emerald-100 text-emerald-600",
        orange: "bg-orange-100 text-orange-600"
    };
    return (
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl flex items-center gap-4 border border-slate-200">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color as keyof typeof colors]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <p className="text-2xl font-black text-slate-800">{value}</p>
            </div>
        </div>
    );
}

function InboxIcon(props: any) {
    return (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
    )
}

function PencilSquareIcon(props: any) {
    return (
        <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );
}
