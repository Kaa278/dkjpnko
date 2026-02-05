import { XMarkIcon, ChevronDownIcon, ChevronRightIcon, BookOpenIcon } from "@heroicons/react/24/outline";

type MenuItem = {
    id: string;
    label: string;
    icon: any;
    submenu?: { id: string; label: string }[];
};

type SidebarProps = {
    menuStructure: MenuItem[];
    currentView: string;
    expandedMenus: Set<string>;
    currentUser: any;
    sidebarOpen: boolean;
    onToggleMenu: (menuId: string) => void;
    onNavigateToSubmenu: (submenuId: string, parentId: string) => void;
    onCloseSidebar: () => void;
};

export default function AdminSidebar({
    menuStructure,
    currentView,
    expandedMenus,
    currentUser,
    sidebarOpen,
    onToggleMenu,
    onNavigateToSubmenu,
    onCloseSidebar,
}: SidebarProps) {
    
    const isMenuActive = (menu: MenuItem) => {
        if (!menu.submenu) return false;
        return menu.submenu.some((sub) => sub.id === currentView);
    };

    return (
        <aside
            className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform duration-300 flex flex-col`}
        >
            {}
            <div className="p-6 border-b border-slate-100 mb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl border-2 border-slate-200 flex items-center justify-center text-slate-900 shadow-sm">
                            <BookOpenIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">DKotoba</h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full ring-2 ring-emerald-500 animate-pulse"></span>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Admin Portal</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onCloseSidebar} className="md:hidden text-slate-400 hover:text-slate-600">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto sidebar-scrollbar">
                {menuStructure.map((menu) => {
                    const isActive = isMenuActive(menu);

                    return (
                        <div key={menu.id}>
                            {}
                            <button
                                onClick={() => onToggleMenu(menu.id)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${isActive || expandedMenus.has(menu.id)
                                    ? "text-slate-900 bg-slate-50/80"
                                    : "text-slate-500 hover:bg-slate-100"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <menu.icon className={`w-5 h-5 transition-colors ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                                    <span className={isActive ? "text-blue-700" : ""}>{menu.label}</span>
                                </div>
                                {menu.submenu && (
                                    <div className="text-slate-400">
                                        <ChevronDownIcon
                                            className={`w-4 h-4 transition-transform duration-300 ${expandedMenus.has(menu.id) ? "rotate-0" : "-rotate-90"
                                                }`}
                                        />
                                    </div>
                                )}
                            </button>

                            {}
                            {menu.submenu && (
                                <div
                                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${expandedMenus.has(menu.id)
                                        ? "grid-rows-[1fr] opacity-100"
                                        : "grid-rows-[0fr] opacity-0"
                                        }`}
                                >
                                    <div className="overflow-hidden ml-9 border-l-2 border-slate-100 pl-4">
                                        <div className="pt-1 pb-2 space-y-1">
                                            {menu.submenu.map((sub) => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => onNavigateToSubmenu(sub.id, menu.id)}
                                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${currentView === sub.id
                                                        ? "bg-blue-50 text-blue-600 border border-blue-100/50"
                                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                                        }`}
                                                >
                                                    {sub.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {}
            <div className="p-4 border-t border-slate-200">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {currentUser?.full_name?.charAt(0) || "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 truncate">
                            {currentUser?.full_name || "Admin"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                            @{currentUser?.username || "admin"}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
