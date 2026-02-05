"use client";

import { useState } from "react";
import { UserIcon } from "@heroicons/react/24/solid";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function TopBar({ title, user, setCurrentView }: { title: string, user: any, setCurrentView: (view: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth?mode=login");
    };

    
    const displayName = user?.full_name || user?.username || user?.email || "Siswa";
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <header className="h-20 flex items-center justify-between px-8 border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
            <div>
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <p className="text-xs text-slate-500">
                    Selamat datang kembali, <span>{displayName}</span>
                </p>
            </div>

            <div className="flex items-center gap-4">
                {}
                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all active:scale-95"
                    >
                        {initial}
                    </button>

                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                            <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden animate-fade-in-down">
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                                <button
                                    onClick={() => { setCurrentView('setting'); setIsOpen(false); }}
                                    className="w-full text-left block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Pengaturan
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                >
                                    Keluar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
