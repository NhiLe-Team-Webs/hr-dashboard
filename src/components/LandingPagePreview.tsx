import React, { useEffect, useState } from 'react';
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

interface LandingPagePreviewProps {
  data: LandingPage;
  onUpdate: (updates: Partial<LandingPage>) => void;
  isEditable?: boolean;
  viewport?: 'desktop' | 'mobile';
}

/**
 * EditableText: lightweight inline editor with:
 * - click to edit
 * - auto-save onBlur
 * - small floating icons for confirm/cancel (visible while editing)
 * - subtle outline while editing
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
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const commit = () => {
    if (tempValue !== value) {
      onSave(tempValue);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 900);
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (!isEditable) {
    return <div className={className}>{value || <span className="text-slate-400 italic">{placeholder}</span>}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {!isEditing ? (
        <div
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          onClick={() => setIsEditing(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') setIsEditing(true); }}
          className="cursor-pointer hover:bg-slate-50 rounded p-1 transition"
        >
          <div className={`inline-flex items-center gap-2 ${justSaved ? 'bg-emerald-50 rounded px-2 py-1' : ''}`}>
            <span className="select-text">{value || <span className="text-slate-400 italic">{placeholder}</span>}</span>
            <span className="ml-1 text-slate-400">
              <Edit3 className="w-4 h-4" />
            </span>
          </div>
        </div>
      ) : (
        <div className="relative">
          {multiline ? (
            <Textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={commit}
              placeholder={placeholder}
              autoFocus
              className="min-h-[80px] p-2 rounded border border-slate-200 focus:ring-2 focus:ring-primary/30"
            />
          ) : (
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={commit}
              placeholder={placeholder}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commit();
                } else if (e.key === 'Escape') {
                  cancel();
                }
              }}
              className="p-2 rounded border border-slate-200 focus:ring-2 focus:ring-primary/30"
            />
          )}

          <div className="absolute top-1 right-1 flex gap-1">
            <Button onClick={commit} size="sm" variant="ghost" title="Lưu">
              <Check className="w-4 h-4 text-emerald-600" />
            </Button>
            <Button onClick={cancel} size="sm" variant="ghost" title="Hủy">
              <X className="w-4 h-4 text-rose-600" />
            </Button>
          </div>
        </div>
      )}
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

  // small wrapper to show toast feedback for "image changed"
  const showToast = (msg: string) => {
    toast({ title: 'Thông báo', description: msg });
  };

  const handleTextUpdate = (field: keyof LandingPage, value: string) => {
    onUpdate({ [field]: value } as Partial<LandingPage>);
  };

  const handleNestedUpdate = <
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
  };

  const handleImageUpload =
    (field: 'heroImage' | 'candidateImage') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const base = reader.result as string;
        if (field === 'heroImage') {
          onUpdate({ heroImage: base });
          showToast('Ảnh chính đã được cập nhật');
        } else {
          onUpdate({
            aPlayerCandidate: {
              ...data.aPlayerCandidate,
              image: base,
            }
          } as Partial<LandingPage>);
          showToast('Ảnh ứng viên đã được cập nhật');
        }
      };
      reader.readAsDataURL(file);
    };

  return (
    <div className={`relative border rounded-lg overflow-hidden ${viewport === 'mobile' ? 'max-w-md mx-auto' : ''} bg-white shadow-sm`}>
      {/* HERO */}
      <div
        className="relative h-64 bg-center bg-cover"
        style={{ backgroundImage: `url(${data.heroImage || ''})`, backgroundColor: '#f3f4f6' }}
      >
        <div className="absolute inset-0 bg-black/45 flex items-center justify-center p-4 text-white">
          <div className="text-center space-y-4 w-full max-w-2xl">
            <EditableText
              value={data.heroTitle}
              onSave={(v) => handleTextUpdate('heroTitle', v)}
              placeholder="Nhập tiêu đề chính..."
              isEditable={isEditable}
              ariaLabel="Chỉnh tiêu đề chính"
            >
              {/* children ignored - EditableText renders value */}
            </EditableText>

            <EditableText
              value={data.heroSubtitle}
              onSave={(v) => handleTextUpdate('heroSubtitle', v)}
              placeholder="Nhập tiêu đề phụ..."
              multiline
              isEditable={isEditable}
              ariaLabel="Chỉnh tiêu đề phụ"
            />

            <div className="mt-4">
              <EditableText
                value={data.callToAction.text}
                onSave={(v) => handleNestedUpdate('callToAction', 'text', v)}
                placeholder="Văn bản nút hành động"
                isEditable={isEditable}
                ariaLabel="Chỉnh CTA"
              />
            </div>
          </div>
        </div>

        {/* image control (upload) */}
        {isEditable && (
          <div className="absolute top-4 right-4 opacity-90">
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
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
                    <img
                      src={data.aPlayerCandidate.image}
                      alt={data.aPlayerCandidate.name}
                      className="object-cover w-full h-full"
                    />
                  </div>

                  {isEditable && (
                    <div className="absolute -top-2 -right-2">
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
                  value={data.aPlayerCandidate.name}
                  onSave={(v) => handleNestedUpdate('aPlayerCandidate', 'name', v)}
                  placeholder="Tên ứng viên..."
                  isEditable={isEditable}
                />

                <EditableText
                  value={data.aPlayerCandidate.description}
                  onSave={(v) => handleNestedUpdate('aPlayerCandidate', 'description', v)}
                  placeholder="Mô tả ứng viên..."
                  multiline
                  isEditable={isEditable}
                />

                <div className="mt-1">
                  <EditableText
                    value={data.aPlayerCandidate.fitScore}
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
