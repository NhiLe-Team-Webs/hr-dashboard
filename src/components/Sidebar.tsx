import { Users, BarChart3, FileText, Layout, Settings, Target } from 'lucide-react';
import { PageType } from '@/pages/Index';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

const navigationItems = [
  {
    id: 'analytics' as PageType,
    label: 'Phân tích báo cáo',
    icon: BarChart3,
    description: 'Thống kê và phân tích dữ liệu'
  },
  {
    id: 'candidates' as PageType,
    label: 'Danh sách ứng viên',
    icon: Users,
    description: 'Quản lý hồ sơ ứng viên'
  },
  {
    id: 'questions' as PageType,
    label: 'Chỉnh sửa câu hỏi',
    icon: FileText,
    description: 'Tùy chỉnh câu hỏi đánh giá'
  },
  {
    id: 'landing-page' as PageType,
    label: 'Chỉnh sửa Landing Page',
    icon: Layout,
    description: 'Trang giới thiệu tuyển dụng'
  },
];

export const Sidebar = ({ currentPage, onPageChange }: SidebarProps) => {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center shadow-lg">
            <Target className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Team Build Pro</h1>
            <p className="text-xs text-muted-foreground">HR Dashboard</p>
          </div>
        </div>
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
                onClick={() => onPageChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className={`text-xs mt-0.5 ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-border">
        <button 
          onClick={() => {
            alert('Trang cài đặt sẽ được phát triển. Bạn có thể thay đổi thông tin công ty, logo, và các thiết lập khác.');
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
          <div>
            <div className="font-medium text-sm">Cài đặt</div>
            <div className="text-xs text-muted-foreground">Tùy chỉnh hệ thống</div>
          </div>
        </button>
      </div>
    </aside>
  );
};