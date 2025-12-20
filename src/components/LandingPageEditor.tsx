// src/components/LandingPageEditor.tsx
import React, { useState, useEffect } from 'react';
import { LoadingPage } from './ui/loading-spinner';
import { Skeleton } from './ui/skeleton';
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
// import { getLandingPageData, updateLandingPageData } from '../lib/api';
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
        // TODO: Re-enable when landing page API is ready
        // const data = await getLandingPageData();
        const data = null; // Temporary placeholder
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
      // TODO: Re-enable when landing page API is ready
      // await updateLandingPageData(formData);
      console.log('Landing page save temporarily disabled');
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
      <div className="min-h-screen space-y-6">
        {/* Toolbar Skeleton */}
        <div className="glass-panel border-b border-white/40 px-6 py-4 mx-auto max-w-[1400px]">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-[1400px] mx-auto h-[calc(100vh-100px)]">
          {/* Editor Panel Skeleton */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-[2rem] space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="glass-panel p-6 rounded-[2rem] space-y-4 flex-1">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-4 mt-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            </div>
          </div>
          {/* Preview Panel Skeleton */}
          <div className="hidden lg:block w-1/2">
            <div className="glass-panel p-4 rounded-[2rem] h-full flex flex-col">
              <div className="flex justify-center mb-4">
                <Skeleton className="h-8 w-32 rounded-full" />
              </div>
              <Skeleton className="flex-1 w-full rounded-xl border border-slate-200" />
            </div>
          </div>
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
    <div className="min-h-screen bg-transparent">
      {/* Top toolbar */}
      <div className="glass-panel border-b border-white/40 px-6 py-4 sticky top-0 z-10 shadow-sm backdrop-blur-md bg-white/70 rounded-none lg:rounded-b-2xl mx-auto max-w-[1400px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Trình chỉnh sửa Landing Page</h1>
            {hasChanges && (
              <Badge variant="destructive" className="animate-pulse shadow-md">
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
            <Card className="glass-panel border-sky-100/50 bg-sky-50/50 rounded-2xl shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-sky-100 shadow-inner">
                    <Mouse className="w-5 h-5 text-sky-700" />
                  </div>
                  <div>
                    <div className="font-bold text-sky-800">Chế độ chỉnh sửa</div>
                    <p className="text-sm text-sky-700/90 mt-1 font-medium">
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