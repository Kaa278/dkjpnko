"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [fullname, setFullname] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const mode = searchParams.get("mode");
        if (mode === "register") setIsRegister(true);
    }, [searchParams]);

    
    
    const getEmail = (user: string) => `${user.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");
        setIsLoading(true);

        try {
            
            const cleanUsername = username.replace(/\s/g, '');
            if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
                setErrorMsg("Username hanya boleh huruf, angka, dan underscore.");
                setIsLoading(false);
                return;
            }

            if (isRegister) {
                
                if (!cleanUsername || !password || !fullname) {
                    setErrorMsg("Mohon isi semua data.");
                    setIsLoading(false);
                    return;
                }

                if (password.length < 6) {
                    setErrorMsg("Password minimal 6 karakter.");
                    setIsLoading(false);
                    return;
                }

                const email = getEmail(cleanUsername);

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: cleanUsername,
                            full_name: fullname,
                            role: "user", 
                            password: password, 
                        },
                    },
                });

                if (error) {
                    
                    if (error.message.includes("already registered")) throw new Error("Username sudah terpakai.");
                    if (error.message.includes("invalid")) throw new Error("Format username tidak diterima sistem.");
                    throw new Error(error.message);
                }

                if (data.user) {
                    setSuccessMsg("Akun berhasil dibuat! Mengalihkan...");
                    setTimeout(() => {
                        setUsername("");
                        setPassword("");
                        setFullname("");
                        setIsRegister(false);
                        setSuccessMsg("Silakan masuk dengan akun barumu.");
                    }, 1500);
                }
            } else {
                
                if (!cleanUsername || !password) {
                    setErrorMsg("Mohon isi username dan password.");
                    setIsLoading(false);
                    return;
                }

                const email = getEmail(cleanUsername);

                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                    options: {
                    },
                });

                if (error) {
                    if (error.message.includes("Invalid login")) throw new Error("Username atau password salah.");
                    throw new Error(error.message);
                }

                if (data.user) {
                    setSuccessMsg("Login berhasil! Memeriksa akses...");

                    
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', data.user.id)
                        .single();

                    console.log('🔐 Login Debug:', {
                        userId: data.user.id,
                        profile,
                        profileError,
                        willRedirectTo: profile && profile.role === 'admin' ? 'ADMIN' : 'USER'
                    });

                    setTimeout(() => {
                        if (profile && profile.role === 'admin') {
                            console.log('✅ Redirecting to ADMIN dashboard');
                            router.push("/dashboard/admin");
                        } else {
                            console.log('⚠️ Redirecting to USER dashboard (profile:', profile, ')');
                            router.push("/dashboard/user");
                        }
                    }, 1000);
                }
            }
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Terjadi kesalahan sistem.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 md:p-6 bg-slate-50 relative overflow-hidden">
            {}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[#f8fafc]"></div>
                <div className="absolute top-0 left-0 w-full h-full"
                    style={{
                        backgroundImage: `
                        radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
                        radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.1) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
                        radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.1) 0px, transparent 50%)
                    `,
                        backgroundAttachment: 'fixed'
                    }}
                ></div>
            </div>

            <div className="w-full max-w-5xl bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/50 flex flex-col md:flex-row min-h-[600px] relative z-10">

                {}
                <div className="hidden md:flex md:w-1/2 bg-blue-600 relative p-12 flex-col justify-between text-white overflow-hidden group">
                    {}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 opacity-70 group-hover:scale-110 transition-transform duration-[3s]"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/2 opacity-70 group-hover:scale-110 transition-transform duration-[3s] delay-75"></div>

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-8">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            <span className="text-xs font-bold tracking-wide uppercase">DKotoba Learning</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-4">
                            Belajar Bahasa Jepang <br />
                            <span className="text-blue-200">Jadi Mudah.</span>
                        </h2>
                        <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
                            Akses ribuan materi kosakata, kuis interaktif, dan pantau progres belajarmu dalam satu platform modern.
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-4 text-sm font-medium text-blue-200">
                        <div className="flex -space-x-3">
                            <div className="w-10 h-10 rounded-full border-2 border-blue-600 bg-slate-200"></div>
                            <div className="w-10 h-10 rounded-full border-2 border-blue-600 bg-slate-300"></div>
                            <div className="w-10 h-10 rounded-full border-2 border-blue-600 bg-slate-400"></div>
                            <div className="w-10 h-10 rounded-full border-2 border-blue-600 bg-blue-500 flex items-center justify-center text-white text-xs">+1k</div>
                        </div>
                        <p>Bergabung dengan pelajar lainnya</p>
                    </div>
                </div>

                {}
                <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">

                    {}
                    <div className="md:hidden flex flex-col items-center mb-8 text-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-3 shadow-lg shadow-blue-500/30">
                            DK
                        </div>
                        <h1 className="text-2xl font-black text-slate-800">DKotoba</h1>
                    </div>

                    {}
                    <div className="mb-8 md:mb-10">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">
                            {isRegister ? 'Buat Akun Baru' : 'Selamat Datang Kembali!'}
                        </h1>
                        <p className="text-slate-500">
                            {isRegister ? 'Mulai perjalanan belajarmu hari ini.' : 'Silakan masuk untuk melanjutkan belajar.'}
                        </p>
                    </div>

                    {}
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {}
                        {errorMsg && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in">
                                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-medium text-red-600">{errorMsg}</p>
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex items-start gap-3 animate-fade-in">
                                <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-medium text-green-600">{successMsg}</p>
                            </div>
                        )}

                        {}
                        {isRegister && (
                            <div className="animate-slide-up">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        value={fullname}
                                        onChange={(e) => setFullname(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold placeholder:font-normal placeholder:text-slate-400 bg-white/50 backdrop-blur-sm focus:bg-white focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                                        placeholder="Contoh: Agatha Harkness"
                                    />
                                </div>
                            </div>
                        )}

                        {}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold placeholder:font-normal placeholder:text-slate-400 bg-white/50 backdrop-blur-sm focus:bg-white focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                                    placeholder="Masukkan username"
                                />
                            </div>
                        </div>

                        {}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-bold text-slate-700">Password</label>
                                {!isRegister && (
                                    <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Lupa password?</a>
                                )}
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </span>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-semibold placeholder:font-normal placeholder:text-slate-400 bg-white/50 backdrop-blur-sm focus:bg-white focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <span>
                                {isLoading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk Sekarang')}
                            </span>
                            {!isLoading && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            )}
                        </button>

                    </form>

                    {}
                    <div className="mt-8 text-center">
                        <p className="text-slate-500 font-medium">
                            {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}
                            <button
                                onClick={() => {
                                    setIsRegister(!isRegister);
                                    setErrorMsg("");
                                    setSuccessMsg("");
                                }}
                                className="text-blue-600 hover:text-blue-700 font-bold hover:underline ml-1"
                            >
                                {isRegister ? 'Masuk di sini' : 'Daftar gratis'}
                            </button>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        }>
            <AuthContent />
        </Suspense>
    );
}
