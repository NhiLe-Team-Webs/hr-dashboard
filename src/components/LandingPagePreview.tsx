import React, { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  Edit3,
  ImageIcon,
  Check,
  X,
  Camera,
  TextCursor,
  Minus
} from 'lucide-react';
import { LandingPage } from '../types/landingPage';
import { useToast } from './ui/use-toast';
// import { updateLandingPageData } from '../lib/api';

interface LandingPagePreviewProps {
  data: LandingPage;
  onUpdate: (updates: Partial<LandingPage>) => void;
  isEditable?: boolean;
  viewport?: 'desktop' | 'mobile';
}

/**
 * EditableText: lightweight inline editor
 */
const EditableText: React.FC<{
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  isEditable: boolean;
  ariaLabel?: string;
}> = ({ value, onSave, placeholder, multiline = false, className = '', isEditable, ariaLabel }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const commit = useCallback(async () => {
    if (tempValue !== value) {
      onSave(tempValue);
      try {
        // TODO: Re-enable when landing page API is ready
        // await updateLandingPageData({ heroTitle: tempValue });
        console.log('Landing page update temporarily disabled');
        toast({ title: 'Đã lưu', description: 'Nội dung đã được cập nhật.' });
      } catch (error) {
        toast({ title: 'Lỗi', description: 'Không thể lưu nội dung.', variant: 'destructive' });
      }
    }
    setIsEditing(false);
  }, [tempValue, value, onSave, toast]);

  const cancel = useCallback(() => {
    setTempValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      cancel();
    }
  }, [commit, cancel, multiline]);

  if (!isEditable) {
    return (
      <div className={className}>
        {value || <span className="text-slate-400 italic">{placeholder}</span>}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="relative">
        {multiline ? (
          <Textarea
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            className="min-h-[80px] p-2 rounded border border-slate-200 focus:ring-2 focus:ring-primary/30"
          />
        ) : (
          <Input
            ref={inputRef as React.Ref<HTMLInputElement>}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            className="p-2 rounded border border-slate-200 focus:ring-2 focus:ring-primary/30"
          />
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => { if (e.key === 'Enter') setIsEditing(true); }}
      className={`relative cursor-pointer p-1 rounded transition hover:bg-slate-50 ${className}`}
    >
      <div className={`inline-flex items-center gap-2`}>
        <span className="select-text">{value || <span className="text-slate-400 italic">{placeholder}</span>}</span>
        <span className="ml-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit3 className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};


const LandingPagePreview: React.FC<LandingPagePreviewProps> = ({
  data,
  onUpdate,
  isEditable = false,
  viewport = 'desktop'
}) => {
  const { toast } = useToast();

  const handleTextUpdate = useCallback((field: keyof LandingPage, value: string) => {
    onUpdate({ [field]: value } as Partial<LandingPage>);
  }, [onUpdate]);

  const handleNestedUpdate = useCallback(<
    P extends keyof LandingPage,
    C extends keyof LandingPage[P]
  >(parent: P, child: C, value: LandingPage[P][C]) => {
    const currentValue = data[parent];
    if (typeof currentValue === 'object' && currentValue !== null) {
      onUpdate({
        [parent]: {
          ...currentValue,
          [child]: value,
        }
      } as Partial<LandingPage>);
    }
  }, [data, onUpdate]);

  const handleImageUpload =
    (field: 'heroImage' | 'candidateImage') =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base = reader.result as string;
        try {
          if (field === 'heroImage') {
            // TODO: Re-enable when landing page API is ready
            // await updateLandingPageData({ heroImage: base });
            console.log('Landing page image update temporarily disabled');
            onUpdate({ heroImage: base });
          } else {
            // TODO: Re-enable when landing page API is ready
            // await updateLandingPageData({
            //   aPlayerCandidate: { ...data.aPlayerCandidate, image: base },
            // });
            onUpdate({
              aPlayerCandidate: {
                ...data.aPlayerCandidate,
                image: base,
              },
            } as Partial<LandingPage>);
          }
          toast({ title: 'Thành công', description: 'Đã cập nhật hình ảnh.' });
        } catch (error) {
          toast({ title: 'Lỗi', description: 'Không thể lưu hình ảnh.', variant: 'destructive' });
        }
      };
      reader.readAsDataURL(file);
    };

  return (
    <div className={`relative border rounded-lg overflow-hidden ${viewport === 'mobile' ? 'max-w-md mx-auto' : ''} bg-white shadow-sm`}>
      {/* HERO */}
      <div
        className="relative h-64 bg-center bg-cover group"
        style={{ backgroundImage: `url(${data.heroImage || ''})`, backgroundColor: '#f3f4f6' }}
      >
        <div className="absolute inset-0 bg-black/45 flex items-center justify-center p-4 text-white">
          <div className="text-center space-y-4 w-full max-w-2xl">
            <EditableText
              value={data.heroTitle || ''}
              onSave={(v) => handleTextUpdate('heroTitle', v)}
              placeholder="Nhập tiêu đề chính..."
              isEditable={isEditable}
              ariaLabel="Chỉnh tiêu đề chính"
            />

            <EditableText
              value={data.heroSubtitle || ''}
              onSave={(v) => handleTextUpdate('heroSubtitle', v)}
              placeholder="Nhập tiêu đề phụ..."
              multiline
              isEditable={isEditable}
              ariaLabel="Chỉnh tiêu đề phụ"
            />

            <div className="mt-4">
              <Button variant="secondary" className="mt-6">
                <EditableText
                  value={data.callToAction?.text || ''}
                  onSave={(v) => handleNestedUpdate('callToAction', 'text', v)}
                  placeholder="Văn bản nút hành động"
                  isEditable={isEditable}
                  ariaLabel="Chỉnh CTA"
                  className="text-white"
                />
              </Button>
            </div>
          </div>
        </div>

        {/* image control (upload) */}
        {isEditable && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="bg-white/90 text-slate-900">
                  <ImageIcon className="w-4 h-4 mr-1" /> Đổi ảnh
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-3">
                  <div className="font-medium">Cập nhật ảnh chính</div>
                  <div>
                    <Label>Chọn file</Label>
                    <Input type="file" accept="image/*" onChange={handleImageUpload('heroImage')} />
                  </div>
                  <p className="text-xs text-slate-500">Khuyến nghị: 1200×600 hoặc lớn hơn.</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* A-Player Candidate */}
      <div className={`space-y-6 ${viewport === 'mobile' ? 'p-4' : 'p-6'}`}>
        <div className="text-center">
          <div className="mb-3">
            <div className="inline-flex items-center gap-2">
              <h2 className="text-xl font-semibold">Ứng viên xuất sắc</h2>
              <Badge variant="secondary" className="text-xs">Gợi ý</Badge>
            </div>
            {isEditable && (
              <p className="text-xs text-slate-500 mt-1">
                <Minus className="inline w-3 h-3 mr-1 text-slate-400" />
                Tiêu đề cố định.
              </p>
            )}
          </div>

          <Card className={`mx-auto ${isEditable ? 'hover:shadow transition' : ''} max-w-sm`}>
            <CardContent className={`${viewport === 'mobile' ? 'p-4' : 'p-6'}`}>
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
                    <img
                      src={data.aPlayerCandidate?.image || ''}
                      alt={data.aPlayerCandidate?.name || 'Candidate image'}
                      className="object-cover w-full h-full"
                    />
                  </div>

                  {isEditable && (
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline" className="w-8 h-8 p-0 rounded-full bg-white/90 text-slate-900">
                            <Camera className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72">
                          <div className="space-y-3">
                            <div className="font-medium">Cập nhật ảnh ứng viên</div>
                            <div>
                              <Label>Chọn file</Label>
                              <Input type="file" accept="image/*" onChange={handleImageUpload('candidateImage')} />
                            </div>
                            <p className="text-xs text-slate-500">Khuyến nghị: ảnh vuông 200×200.</p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

                <EditableText
                  value={data.aPlayerCandidate?.name || ''}
                  onSave={(v) => handleNestedUpdate('aPlayerCandidate', 'name', v)}
                  placeholder="Tên ứng viên..."
                  isEditable={isEditable}
                />

                <EditableText
                  value={data.aPlayerCandidate?.description || ''}
                  onSave={(v) => handleNestedUpdate('aPlayerCandidate', 'description', v)}
                  placeholder="Mô tả ứng viên..."
                  multiline
                  isEditable={isEditable}
                />

                <div className="mt-1">
                  <EditableText
                    value={data.aPlayerCandidate?.fitScore || ''}
                    onSave={(v) => handleNestedUpdate('aPlayerCandidate', 'fitScore', v)}
                    placeholder="Ví dụ: 97%"
                    isEditable={isEditable}
                  />
                  <div className="text-sm text-slate-500 mt-1 text-center">Điểm phù hợp sẽ hiển thị cho nhà tuyển dụng</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPagePreview;