// src/components/Sidebar.tsx
import { Users, BarChart3, FileText, Layout, Settings, LogOut, ChevronLeft, ChevronRight, Shield, Monitor } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from './ui/use-toast';
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const navigationItems = [
    {
        id: 'analytics',
        label: 'Phân tích báo cáo',
        icon: BarChart3,
        description: 'Thống kê và phân tích dữ liệu'
    },
    {
        id: 'candidates',
        label: 'Danh sách ứng viên',
        icon: Users,
        description: 'Quản lý hồ sơ ứng viên'
    },
    {
        id: 'questions',
        label: 'Chỉnh sửa câu hỏi',
        icon: FileText,
        description: 'Tùy chỉnh câu hỏi đánh giá'
    },
    {
        id: 'landing-page',
        label: 'Chỉnh sửa Landing Page',
        icon: Layout,
        description: 'Trang giới thiệu tuyển dụng'
    },
];

export const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPage = location.pathname.split('/')[1] || 'analytics';
    const { signOut, user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleNavigation = (itemId: string) => {
        if (itemId === 'landing-page') {
            toast({
                title: 'Tính năng đang phát triển',
                description: 'Chức năng này đang được phát triển, vui lòng quay lại sau.',
            });
            return;
        }
        navigate(`/${itemId}`);
    };

    const handleLogout = async () => {
        try {
            await signOut();
            toast({
                title: 'Đã đăng xuất',
                description: 'Bạn đã đăng xuất thành công.',
            });
        } catch (error) {
            toast({
                title: 'Đăng xuất thất bại',
                description: 'Đã xảy ra lỗi khi đăng xuất.',
                variant: 'destructive',
            });
        } finally {
            navigate('/login', { replace: true });
        }
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return "A";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full relative">
            {/* Toggle Button */}
            <div className="absolute -right-3 top-8 hidden lg:block z-50">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-full bg-white text-primary border border-primary/20 shadow-md hover:bg-primary hover:text-white transition-all duration-300"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Header/Logo */}
            <div className={cn("p-6 flex items-center gap-3 transition-all duration-300", isCollapsed ? "justify-center p-4" : "md:p-8")}>
                <div className={cn("relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/25 transition-all duration-300", isCollapsed ? "h-10 w-10" : "h-10 w-10")}>
                    <Monitor className="h-6 w-6 text-white" />
                </div>
                {!isCollapsed && (
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 animate-in fade-in duration-300 whitespace-nowrap">
                        HR Dashboard
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden">
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;

                    if (isCollapsed) {
                        return (
                            <TooltipProvider key={item.id} delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => handleNavigation(item.id)}
                                            className={cn(
                                                "w-full flex items-center justify-center p-3 rounded-2xl transition-all duration-300 group",
                                                isActive
                                                    ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25"
                                                    : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                                            )}
                                        >
                                            <Icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-primary")} />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="bg-white text-foreground border-white/20 shadow-xl z-50">
                                        {item.label}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item.id)}
                            className={cn(
                                "w-full flex items-center px-4 py-3 rounded-2xl transition-all duration-300 group text-left",
                                isActive
                                    ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25"
                                    : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 mr-3 transition-colors", isActive ? "text-white" : "group-hover:text-primary")} />
                            <div>
                                <div className="font-medium text-sm whitespace-nowrap">{item.label}</div>
                                {/* Optional: Hide description in this mode to match layout style, or keep if preferred */}
                            </div>
                        </button>
                    );
                })}
            </nav>

            {/* Footer / User Profile */}
            <div className={cn("p-4 mb-4 mt-auto transition-all duration-300", isCollapsed ? "mx-2" : "mx-4")}>
                <div className={cn("glass-panel rounded-2xl border border-white/50 relative overflow-hidden group transition-all duration-300", isCollapsed ? "p-2" : "p-4")}>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className={cn("flex items-center relative z-10", isCollapsed ? "justify-center" : "gap-3")}>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white/50 shrink-0">
                            {getInitials(user?.email)}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                                <p className="text-sm font-bold text-foreground truncate">
                                    Admin
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user?.email}
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleLogout();
                        }}
                        className={cn(
                            "mt-3 flex items-center justify-center gap-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all duration-300 relative z-20 cursor-pointer hover:shadow-sm",
                            isCollapsed ? "w-10 h-10 p-0 mx-auto" : "w-full px-3 py-2 text-xs font-semibold"
                        )}
                        title="Đăng xuất"
                    >
                        <LogOut className={cn("w-3.5 h-3.5", isCollapsed ? "w-4 h-4" : "")} />
                        {!isCollapsed && <span>Đăng xuất</span>}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <aside
            className={cn(
                "hidden lg:flex glass-panel rounded-[2rem] flex-col shadow-2xl shadow-black/5 ring-1 ring-white/50 bg-white/80 transition-all duration-300 ease-in-out relative z-30 my-4 ml-4",
                isCollapsed ? "w-24" : "w-72"
            )}
        >
            <SidebarContent />
        </aside>
    );
};