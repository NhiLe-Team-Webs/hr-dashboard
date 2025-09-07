// src/components/LandingPageEditor.tsx
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import {
  Eye,
  Save,
  Smartphone,
  Monitor,
  Undo2,
  Redo2,
  Mouse
} from 'lucide-react';
import { useToast } from './ui/use-toast';
import { LandingPage } from '../types/landingPage';
import { getLandingPageData, updateLandingPageData } from '../lib/api';
import LandingPagePreview from './LandingPagePreview';

const LandingPageEditor: React.FC = () => {
  const [formData, setFormData] = useState<LandingPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [hasChanges, setHasChanges] = useState(false);
  const [history, setHistory] = useState<LandingPage[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getLandingPageData();
        setFormData(data);
        setHistory([data]);
        setHistoryIndex(0);
      } catch (error) {
        toast({
          title: 'Lỗi',
          description: 'Không thể tải dữ liệu trang landing page.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const addToHistory = (newData: LandingPage) => {
    const head = history.slice(0, historyIndex + 1);
    const newHistory = [...head, newData].slice(-30);
    const newIndex = newHistory.length - 1;
    setHistory(newHistory);
    setHistoryIndex(newIndex);
  };

  const handleUpdate = (updates: Partial<LandingPage>) => {
    if (!formData) return;
    const newData = { ...formData, ...updates };
    setFormData(newData);
    setHasChanges(true);
    addToHistory(newData);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFormData(history[newIndex]);
      setHasChanges(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFormData(history[newIndex]);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!formData) return;
    try {
      await updateLandingPageData(formData);
      setHasChanges(false);
      toast({
        title: 'Đã lưu',
        description: 'Landing page đã được cập nhật và công khai.',
      });
    } catch (error) {
      toast({
        title: 'Lỗi khi lưu',
        description: 'Có lỗi xảy ra, thử lại sau.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p>Đang tải trình chỉnh sửa...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Lỗi khi tải dữ liệu.</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top toolbar */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-900">Trình chỉnh sửa Landing Page</h1>
            {hasChanges && (
              <Badge variant="destructive" className="animate-pulse">
                Thay đổi chưa lưu
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0 || isPreviewMode}
              title="Hoàn tác (Undo)"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1 || isPreviewMode}
              title="Làm lại (Redo)"
            >
              <Redo2 className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-slate-200 mx-2" />

            <div className="flex items-center rounded-md p-1 bg-slate-100">
              <Button
                variant={viewport === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewport('desktop')}
                className="h-8"
                title="Xem máy tính"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={viewport === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewport('mobile')}
                className="h-8"
                title="Xem di động"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-slate-200 mx-2" />

            <Button
              variant={isPreviewMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              title={isPreviewMode ? 'Thoát xem trước' : 'Xem trước'}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreviewMode ? 'Thoát' : 'Xem trước'}
            </Button>

            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="ml-2 bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu & Đăng tải
            </Button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="p-6">
        {!isPreviewMode && (
          <div className="mb-6">
            <Card className="bg-sky-50 border-sky-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-sky-100">
                    <Mouse className="w-5 h-5 text-sky-700" />
                  </div>
                  <div>
                    <div className="font-medium text-sky-800">Chế độ chỉnh sửa</div>
                    <p className="text-sm text-sky-700/90 mt-1">
                      Chọn phần tử để chỉnh sửa. Thay đổi sẽ tự lưu khi bạn rời khỏi trường (auto-save).
                      Dùng Undo/Redo nếu cần.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className={`transition-all duration-300 ${viewport === 'mobile' ? 'max-w-sm mx-auto' : 'max-w-6xl mx-auto'}`}>
          <LandingPagePreview
            data={formData}
            onUpdate={handleUpdate}
            isEditable={!isPreviewMode}
            viewport={viewport}
          />
        </div>
      </div>

      {viewport === 'mobile' && (
        <div className="fixed bottom-4 right-4 z-20">
          <Badge variant="secondary" className="shadow-md bg-slate-700 text-white">
            📱 Di động
          </Badge>
        </div>
      )}
    </div>
  );
};

export default LandingPageEditor;