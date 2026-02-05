"use client";

import { useEffect, useState, useRef } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Link from "next/link";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [demoScore, setDemoScore] = useState(0);

  
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [qScore, setQScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplain, setShowExplain] = useState(false);

  const demoQuiz = [
    {
      q: "“ありがとう” artinya?",
      options: ["Selamat pagi", "Terima kasih", "Sampai jumpa", "Tolong"],
      correct: 1,
      explain: "ありがとう (arigatou) berarti “terima kasih”.",
    },
    {
      q: "Huruf “あ” dibaca…",
      options: ["a", "i", "u", "e"],
      correct: 0,
      explain: "Hiragana あ dibaca “a”.",
    },
    {
      q: "“水” (みず / mizu) artinya…",
      options: ["Api", "Air", "Angin", "Tanah"],
      correct: 1,
      explain: "水 dibaca みず (mizu), artinya “air”.",
    },
  ];

  useEffect(() => {
    AOS.init({
      once: true,
      offset: 50,
      duration: 800,
    });

    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 10);

      const doc = document.documentElement;
      const scrollTop = doc.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(scrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    
    const blobA = document.getElementById("blobA");
    const blobB = document.getElementById("blobB");

    const moveBlobs = (e: MouseEvent) => {
      const mouseX = (e.clientX / window.innerWidth) - 0.5;
      const mouseY = (e.clientY / window.innerHeight) - 0.5;

      if (blobA && blobB) {
        blobA.style.transform = `translate(${mouseX * 18}px, ${mouseY * 18}px)`;
        blobB.style.transform = `translate(${mouseX * -14}px, ${mouseY * -14}px)`;
      }
    };
    window.addEventListener("mousemove", moveBlobs, { passive: true });

    
    const scoreInterval = setInterval(() => {
      setDemoScore((prev) => (prev + 1) % 4);
    }, 1500);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", moveBlobs);
      clearInterval(scoreInterval);
    };
  }, []);

  const handleDemoAnswer = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    setShowExplain(true);
    if (idx === demoQuiz[qIndex].correct) {
      setQScore(prev => prev + 1);
    }
  };

  const nextDemoQuestion = () => {
    if (qIndex < demoQuiz.length - 1) {
      setQIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplain(false);
    } else {
      
      alert(`Selesai! Skor kamu: ${qScore + (selectedOption === demoQuiz[qIndex].correct ? 0 : 0)} / ${demoQuiz.length}`);
      setIsDemoOpen(false);
      resetDemo();
    }
  };

  const resetDemo = () => {
    setQIndex(0);
    setQScore(0);
    setSelectedOption(null);
    setShowExplain(false);
  };

  return (
    <div className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden relative font-sans">

      {}
      <div
        className="fixed top-0 left-0 h-[3px] z-[9999] bg-gradient-to-r from-blue-600 to-blue-800 shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all ease-out"
        style={{ width: `${scrollProgress}%` }}
      ></div>

      {}
      <div className="fixed inset-0 z-0 opacity-[0.06] mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/asfalt-dark.png")' }}></div>

      {}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
        <div id="blobA" className="absolute w-72 h-72 md:w-[520px] md:h-[520px] bg-blue-200 rounded-full top-[-50px] md:top-[-120px] left-[-50px] md:left-[-140px] mix-blend-multiply blur-[50px] opacity-40 transition-transform duration-100 ease-out"></div>
        <div id="blobB" className="absolute w-80 h-80 md:w-[540px] md:h-[540px] bg-slate-200 rounded-full bottom-[-50px] md:bottom-[-140px] right-[-50px] md:right-[-140px] mix-blend-multiply blur-[50px] opacity-40 transition-transform duration-100 ease-out"></div>
      </div>

      {}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'glass shadow-lg shadow-blue-500/5' : 'glass border-transparent bg-transparent'}`}>
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2 text-slate-800">
            <span className="text-blue-600">DKotoba</span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-6">
              <a href="#features" className="font-bold text-slate-500 hover:text-blue-600 transition-colors text-sm">Fitur</a>
              <a href="#how" className="font-bold text-slate-500 hover:text-blue-600 transition-colors text-sm">Cara Kerja</a>
              <a href="#testi" className="font-bold text-slate-500 hover:text-blue-600 transition-colors text-sm">Testimoni</a>
            </div>

            <div className="w-px h-6 bg-slate-200 hidden md:block"></div>

            <Link href="/auth?mode=login" className="hidden md:inline-block px-5 py-2.5 font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-all text-sm">
              Masuk
            </Link>

            <Link href="/auth?mode=register" className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-full hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all shadow-md shadow-blue-500/20 active:scale-95 text-sm">
              Mulai Belajar
            </Link>

            {}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden w-11 h-11 rounded-full border border-slate-200 bg-white/80 hover:bg-white transition flex items-center justify-center text-slate-700"
            >
              {isMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200/70 bg-white/75 backdrop-blur-xl animate-fade-in-down">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="font-bold text-slate-700 hover:text-blue-600 p-2">Fitur</a>
              <a href="#how" onClick={() => setIsMenuOpen(false)} className="font-bold text-slate-700 hover:text-blue-600 p-2">Cara Kerja</a>
              <a href="#testi" onClick={() => setIsMenuOpen(false)} className="font-bold text-slate-700 hover:text-blue-600 p-2">Testimoni</a>
              <hr className="border-slate-200" />
              <div className="flex gap-3 pt-2">
                <Link href="/auth?mode=login" className="flex-1 text-center font-bold text-slate-700 hover:bg-slate-100 py-3 rounded-xl border border-slate-200 transition">Masuk</Link>
                <Link href="/auth?mode=register" className="flex-1 text-center font-bold text-white bg-blue-600 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition">Daftar</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {}
      <section className="min-h-[92vh] flex items-center pt-28 pb-12 relative">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left z-10">
            <div data-aos="fade-down" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-sm font-bold mb-6 text-blue-600 shadow-sm">
              <span>🇯🇵</span>
              <span>Platform Belajar Jepang Simplistik</span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-blue-300"></span>
              <span className="hidden sm:inline-block text-slate-500 font-semibold">Quiz • Materi • Progres</span>
            </div>

            <h1 data-aos="fade-up" data-aos-delay="100" className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight text-slate-900">
              Belajar Bahasa <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">Jepang Modern.</span>
            </h1>

            <p data-aos="fade-up" data-aos-delay="200" className="text-xl text-slate-500 mb-8 max-w-xl mx-auto md:mx-0 font-medium leading-relaxed">
              Kuasai Hiragana, Katakana, dan Kanji lewat materi singkat, kuis cepat, dan progres yang jelas.
              Minim distraksi, fokus naik level setiap hari.
            </p>

            {}
            <div data-aos="fade-up" data-aos-delay="260" className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mb-8">
              {[
                { icon: 'N5', title: 'Track Pemula', desc: 'Mulai dari dasar' },
                { icon: '10', title: 'Kuis Cepat', desc: '≤ 2 menit' },
                { icon: '📈', title: 'Progress', desc: 'Streak harian' }
              ].map((item, i) => (
                <div key={i} className="glass rounded-2xl px-5 py-3 inline-flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">{item.icon}</div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 font-semibold">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div data-aos="fade-up" data-aos-delay="320" className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/auth?mode=register" className="bg-slate-900 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl shadow-slate-500/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.99]">
                <span>Daftar Sekarang</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" /></svg>
              </Link>
              <button onClick={() => setIsDemoOpen(true)} className="glass font-bold py-4 px-8 rounded-full text-lg hover:bg-white transition-all flex items-center justify-center gap-2 active:scale-[0.99]">
                <span>Lihat Demo</span>
                <span className="text-blue-600">▶</span>
              </button>
            </div>

            <p className="mt-5 text-sm text-slate-500 font-semibold">
              Tanpa iklan. Tanpa ribet. <span className="text-slate-700">Cukup belajar.</span>
            </p>
          </div>

          {}
          <div className="hidden md:block flex-1 relative" data-aos="zoom-in" data-aos-duration="1000">
            <div className="relative w-full max-w-md mx-auto aspect-square">
              <div className="absolute -inset-6 rounded-[3rem] bg-blue-200/40 blur-2xl"></div>
              <div className="absolute inset-0 bg-blue-100 rounded-[3rem] rotate-6 opacity-60"></div>
              <div className="absolute inset-0 bg-white border border-slate-100 rounded-[3rem] shadow-2xl flex items-center justify-center p-8">
                <div className="text-center w-full">
                  <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">🎌</div>
                  <h3 className="text-3xl font-bold font-[Noto_Sans_JP] mb-2 text-slate-800">日本語</h3>
                  <p className="text-slate-500 font-medium">Bahasa Jepang</p>

                  {}
                  <div className="mt-8 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mini Quiz</p>
                      <p className="text-xs font-bold text-blue-600">Skor: {demoScore}/3</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-sm font-bold text-slate-800 mb-2">“ありがとう” artinya?</p>
                      <div className="flex flex-wrap gap-2">
                        {['Halo', 'Terima kasih', 'Maaf'].map(t => (
                          <span key={t} className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2 justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    </div>
                  </div>
                  <p className="mt-6 text-xs text-slate-400 font-semibold">UI Preview — bukan data asli</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section id="features" className="py-20 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12" data-aos="fade-up">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Semua yang kamu butuh</h2>
            <p className="mt-3 text-slate-500 font-medium">Dari materi sampai kuis — dibuat untuk cepat dipakai dan enak dilihat.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '📚', title: 'Materi Terstruktur', desc: 'Kurikulum rapi: kana → kosakata → kanji → grammar ringkas.', items: ['Pembahasan singkat', 'Tag level (N5–N3)', 'Mode baca cepat'] },
              { icon: '⚡', title: 'Kuis Interaktif', desc: 'Latihan cepat: pilihan ganda, ketik jawaban, dan review.', items: ['Kuis 10 soal otomatis', 'Pembahasan jawaban', 'Mode “drill” harian'] },
              { icon: '📊', title: 'Pantau Progres', desc: 'Lacak skor, streak, dan topik yang sering salah.', items: ['Riwayat latihan', 'Rekomendasi review', 'Target mingguan'] },
            ].map((f, i) => (
              <div key={i} data-aos="fade-up" data-aos-delay={i * 100} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-all duration-300 group">
                <div className="w-14 h-14 bg-white border border-slate-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
                <ul className="mt-5 space-y-2 text-sm font-semibold text-slate-600">
                  {f.items.map((it, idx) => (
                    <li key={idx} className="flex gap-2"><span className="text-blue-600">✓</span> {it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {}
          <div className="mt-10 max-w-5xl mx-auto" data-aos="fade-up" data-aos-delay="150">
            <div className="glass rounded-3xl p-6 md:p-7 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div>
                <p className="text-sm font-black text-blue-600 uppercase tracking-wider">Admin Ready</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">Ada halaman Admin & User</h3>
                <p className="text-slate-500 font-medium mt-2 max-w-xl">Admin bisa kelola bank soal, materi, dan paket quiz. User fokus belajar + pantau progres.</p>
              </div>
              <div className="flex gap-3">
                <a href="#how" className="bg-slate-900 text-white font-bold py-3 px-6 rounded-full hover:bg-slate-800 transition shadow-lg shadow-slate-500/20">Lihat Alur</a>
                <Link href="/auth" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-500/20">Mulai</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section id="how" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12" data-aos="fade-up">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Cara kerjanya simpel</h2>
            <p className="mt-3 text-slate-500 font-medium">3 langkah: pilih materi, latihan, dan review yang lemah.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-5">
            {[
              { num: 1, title: 'Pilih materi', desc: 'Mulai dari kana, kosakata dasar, sampai kanji populer.' },
              { num: 2, title: 'Kerjakan kuis', desc: 'Latihan cepat, dapat skor + pembahasan tiap soal.' },
              { num: 3, title: 'Review otomatis', desc: 'Topik yang sering salah diprioritaskan untuk diulang.' },
            ].map((step, i) => (
              <div key={i} data-aos="fade-up" data-aos-delay={i * 80} className="glass rounded-3xl p-6 flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">{step.num}</div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{step.title}</h3>
                  <p className="text-slate-500 font-medium mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center" data-aos="fade-up" data-aos-delay="120">
            <button onClick={() => setIsDemoOpen(true)} className="inline-flex items-center gap-2 font-extrabold text-blue-600 hover:text-blue-700 transition">
              Coba demo mini-kuis
              <span className="inline-flex w-8 h-8 rounded-full bg-blue-50 items-center justify-center">→</span>
            </button>
          </div>
        </div>
      </section>

      {}
      <section id="testi" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12" data-aos="fade-up">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Yang orang bilang</h2>
            <p className="mt-3 text-slate-500 font-medium">Contoh testimoni (placeholder) — bisa kamu ganti nanti.</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              { name: 'Alya', role: 'Pemula — target N5', text: '“UI-nya bersih banget. Materinya ringkas tapi kena. Kuisnya bikin ketagihan karena cepat.”' },
              { name: 'Raka', role: 'Belajar 15 menit/hari', text: '“Enak buat belajar di HP. Aku suka ada progresnya, jadi kepacu konsisten tiap hari.”' }
            ].map((t, i) => (
              <div key={i} data-aos="fade-up" data-aos-delay={i * 80} className="glass rounded-3xl p-7">
                <p className="text-slate-700 font-semibold leading-relaxed">{t.text}</p>
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-500 font-semibold">{t.role}</p>
                  </div>
                  <div className="text-blue-600 font-black">★★★★★</div>
                </div>
              </div>
            ))}
          </div>

          {}
          <div className="mt-12 max-w-4xl mx-auto" data-aos="fade-up" data-aos-delay="120">
            <div className="rounded-[2rem] bg-slate-900 text-white p-10 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-600/25 blur-2xl"></div>
              <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-blue-400/20 blur-2xl"></div>
              <div className="relative">
                <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">Mulai dari hari ini.</h3>
                <p className="mt-3 text-slate-200 font-medium max-w-2xl">Daftar, pilih materi, dan ambil kuis pertama kamu. Nanti tinggal lanjut bikin halaman /admin dan /user.</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link href="/auth?mode=register" className="bg-white text-slate-900 font-extrabold py-3.5 px-7 rounded-full hover:bg-slate-100 transition">Bergabung Sekarang</Link>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="border border-white/20 text-white font-extrabold py-3.5 px-7 rounded-full hover:bg-white/10 transition">Ke atas</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 relative">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-blue-600 font-black text-xl">DKotoba</span>
            <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider">2026</span>
          </div>
          <p className="mt-4 text-sm font-medium opacity-80 max-w-xl mx-auto">
            Landing page ini pure HTML + Tailwind + JS. Siap kamu lanjut bikin halaman <span className="text-slate-200">/user</span> dan <span className="text-slate-200">/admin</span>.
          </p>
          <div className="mt-6 flex justify-center gap-6 text-sm font-semibold">
            <a href="#features" className="hover:text-white transition">Fitur</a>
            <a href="#how" className="hover:text-white transition">Cara Kerja</a>
            <a href="#testi" className="hover:text-white transition">Testimoni</a>
          </div>
          <p className="mt-8 text-xs font-medium opacity-60">© 2026 DKotoba Project.</p>
        </div>
      </footer>

      {}
      {isDemoOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDemoOpen(false)}></div>
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 animate-pop-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-blue-600 uppercase tracking-wider">Demo Mini Quiz</p>
                <h4 className="text-xl font-extrabold text-slate-900">Jawab 3 pertanyaan</h4>
              </div>
              <button onClick={() => setIsDemoOpen(false)} className="w-11 h-11 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-black">✕</button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-600">Progress</p>
                <p className="text-sm font-black text-blue-600">{qIndex + 1}/{demoQuiz.length}</p>
              </div>

              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${((qIndex + 1) / demoQuiz.length) * 100}%` }}></div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Pertanyaan</p>
                <h5 className="mt-2 text-lg font-extrabold text-slate-900">{demoQuiz[qIndex].q}</h5>

                <div className="mt-5 space-y-3">
                  {demoQuiz[qIndex].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleDemoAnswer(idx)}
                      className={`w-full text-left p-4 rounded-xl border-2 font-bold transition-all ${selectedOption === idx
                        ? (idx === demoQuiz[qIndex].correct ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                        : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-slate-700'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {showExplain && (
                  <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 animate-fade-in">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Pembahasan</p>
                    <p className="mt-2 text-slate-700 font-semibold">{demoQuiz[qIndex].explain}</p>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between">
                  <button onClick={resetDemo} className="text-sm font-extrabold text-slate-600 hover:text-slate-900 transition">Reset</button>
                  <button
                    onClick={nextDemoQuestion}
                    disabled={selectedOption === null}
                    className="bg-slate-900 text-white font-extrabold py-3 px-6 rounded-full hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {qIndex < demoQuiz.length - 1 ? 'Lanjut →' : 'Selesai'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs font-semibold text-slate-500">Ini demo UI aja. Nanti bisa disambung ke database bank soal.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
