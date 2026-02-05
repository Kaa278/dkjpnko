"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    HomeIcon,
    BookOpenIcon,
    PencilSquareIcon,
    TrophyIcon,
    FlagIcon,
    UserIcon,
    ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Sidebar({ currentView, setCurrentView }: { currentView: string, setCurrentView: (view: string) => void }) {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth?mode=login");
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
        { id: 'materi', label: 'Materi', icon: BookOpenIcon },
        { id: 'soal', label: 'Kuis', icon: PencilSquareIcon },
        { id: 'leaderboard', label: 'Peringkat', icon: TrophyIcon },
        { id: 'report', label: 'Laporan', icon: FlagIcon },
    ];

    return (
        <aside className="hidden md:flex flex-col w-72 h-full bg-white/80 backdrop-blur-xl border-r border-slate-200 relative z-20">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-xl font-black text-white">D</span>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white tracking-tight">DKotoba</h1>
                        <p className="text-xs text-white/80 font-medium">Siswa Panel</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${currentView === item.id
                                ? 'bg-blue-50 text-blue-600 font-bold'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                            }`}
                    >
                        <item.icon className={`w-6 h-6 ${currentView === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span>{item.label}</span>
                        {currentView === item.id && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                        )}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-200 space-y-2">
                <button
                    onClick={() => setCurrentView('setting')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${currentView === 'setting'
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                >
                    <UserIcon className="w-5 h-5" />
                    <span className="text-sm">Profil Saya</span>
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm">Keluar</span>
                </button>
            </div>
        </aside>
    );
}
