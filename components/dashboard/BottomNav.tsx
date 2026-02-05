import {
    HomeIcon,
    BookOpenIcon,
    PencilSquareIcon,
    TrophyIcon,
    Cog6ToothIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

type BottomNavProps = {
    currentView: string;
    setCurrentView: (view: string) => void;
};

export default function BottomNav({ currentView, setCurrentView }: BottomNavProps) {
    const navItems = [
        { id: "dashboard", label: "Home", icon: HomeIcon },
        { id: "materi", label: "Materi", icon: BookOpenIcon },
        { id: "soal", label: "Kuis", icon: PencilSquareIcon },
        { id: "leaderboard", label: "Rank", icon: TrophyIcon },
        
        
        { id: "setting", label: "Akun", icon: Cog6ToothIcon },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 pb-6 md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center max-w-sm mx-auto">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id)}
                            className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? "text-blue-600 -translate-y-1" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-blue-50" : "bg-transparent"}`}>
                                <Icon className={`w-6 h-6 ${isActive ? "stroke-2" : "stroke-1.5"}`} />
                            </div>
                            <span className={`text-[10px] font-bold ${isActive ? "opacity-100" : "opacity-0 scale-0"} transition-all absolute -bottom-2`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
