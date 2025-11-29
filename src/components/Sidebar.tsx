// src/components/Sidebar.tsx
import { Users, BarChart3, FileText, Layout, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from './ui/use-toast';

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
                title: 'Tính năng đang được phát triển',
                description: 'Chức năng này sẽ sớm được cập nhật.',
            });
        } else {
            navigate(`/${itemId}`);
        }
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

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-card border-r border-border flex flex-col min-h-screen transition-all duration-300 relative`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-6 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-10"
                aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
                {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-primary-foreground" />
                ) : (
                    <ChevronLeft className="w-4 h-4 text-primary-foreground" />
                )}
            </button>

            {/* Title */}
            <div className="p-6 border-b border-border">
                {!isCollapsed ? (
                    <h1 className="font-bold text-xl text-foreground tracking-tight">HR DASHBOARD</h1>
                ) : (
                    <div className="flex justify-center">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">HR</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <div className="space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.id)}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                                    ${isActive 
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }
                                `}
                                title={isCollapsed ? item.label : ''}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && (
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{item.label}</div>
                                        <div className={`text-xs mt-0.5 ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                            {item.description}
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Settings and Logout */}
            <div className="p-4 border-t border-border space-y-2">
                <button
                    onClick={() => {
                        toast({
                            title: 'Tính năng đang được phát triển',
                            description: 'Chức năng này sẽ sớm được cập nhật.',
                        });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title={isCollapsed ? 'Cài đặt' : ''}
                >
                    <Settings className="w-5 h-5" />
                    {!isCollapsed && (
                        <div>
                            <div className="font-medium text-sm">Cài đặt</div>
                            <div className="text-xs text-muted-foreground">Tùy chỉnh hệ thống</div>
                        </div>
                    )}
                </button>
                
                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Đăng xuất"
                    title={isCollapsed ? 'Đăng xuất' : ''}
                >
                    <LogOut className="w-5 h-5" />
                    {!isCollapsed && (
                        <div>
                            <div className="font-medium text-sm">Đăng xuất</div>
                            {user?.email && (
                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {user.email}
                                </div>
                            )}
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
};