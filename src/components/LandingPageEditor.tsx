import { Layout, Palette, Type, Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const LandingPageEditor = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chỉnh sửa Landing Page</h1>
          <p className="text-muted-foreground mt-1">Tùy chỉnh trang giới thiệu và tuyển dụng</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary shadow-lg">
          <Save className="w-4 h-4 mr-2" />
          Lưu thay đổi
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Options */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layout className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Bố cục trang</h3>
            </div>
            <p className="text-muted-foreground">
              Tùy chỉnh cấu trúc và layout của trang landing page
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-success/10 rounded-lg">
                <Palette className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Màu sắc & Thiết kế</h3>
            </div>
            <p className="text-muted-foreground">
              Điều chỉnh phối màu và style tổng thể của trang
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-info/10 rounded-lg">
                <Type className="w-5 h-5 text-info" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Nội dung văn bản</h3>
            </div>
            <p className="text-muted-foreground">
              Chỉnh sửa tiêu đề, mô tả và các nội dung văn bản
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Settings className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Cài đặt nâng cao</h3>
            </div>
            <p className="text-muted-foreground">
              Cấu hình SEO, analytics và các tính năng khác
            </p>
          </Card>
        </div>

        {/* Preview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Xem trước</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Desktop</Button>
              <Button variant="outline" size="sm">Mobile</Button>
            </div>
          </div>
          
          <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
            <div className="space-y-4">
              <Layout className="w-12 h-12 text-muted-foreground mx-auto" />
              <h4 className="text-lg font-semibold text-foreground">Landing Page Preview</h4>
              <p className="text-muted-foreground max-w-md">
                Khu vực xem trước trang landing page sẽ hiển thị tại đây. 
                Chọn các tùy chọn bên trái để bắt đầu tùy chỉnh.
              </p>
              <Button className="mt-4">
                Bắt đầu tùy chỉnh
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LandingPageEditor;