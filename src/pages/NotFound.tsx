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
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary-glow/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">Trang không tồn tại</h2>
        <p className="text-muted-foreground mb-6">
          Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.
        </p>
        <Button asChild className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary">
          <a href="/">
            <Home className="w-4 h-4 mr-2" />
            Về trang chủ
          </a>
        </Button>
      </Card>
    </div>
  );
};

export default NotFound;
