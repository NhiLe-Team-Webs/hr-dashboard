import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-inter p-6">
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-xl"></div>
        <Card className="glass-panel border-white/40 shadow-2xl relative max-w-md w-full p-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-8 ring-4 ring-white/50 shadow-inner">
            <AlertTriangle className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-blue-700 to-indigo-700 mb-4 drop-shadow-sm">404</h1>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Trang không tồn tại</h2>
          <p className="text-slate-500 mb-8 leading-relaxed font-medium">
            Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.
          </p>
          <Button asChild className="rounded-xl shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 h-12 px-8 w-full font-bold text-base transition-all hover:scale-[1.02]">
            <a href="/">
              <Home className="w-5 h-5 mr-2" />
              Về trang chủ
            </a>
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
