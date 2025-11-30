// src/components/QuestionForm.tsx
import { useState } from 'react';
import { Plus, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Question, QuestionOption } from '@/types/question';
import { createQuestion, updateQuestion } from '@/lib/api';
import type { QuestionDraft } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

const MULTIPLE_CHOICE_FORMATS = new Set<Question['format']>(['multiple_choice']);

const normaliseFormat = (format?: Question['format']): Question['format'] => {
  if (!format) {
    return 'text';
  }
  if (format === 'multiple_choice' || format === 'multiple-choice') {
    return 'multiple_choice';
  }
  return format;
};

const isMultipleChoice = (format?: Question['format']) =>
  !!format && MULTIPLE_CHOICE_FORMATS.has(normaliseFormat(format));

const createOptionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `opt-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createDefaultOptions = (): QuestionOption[] => [
  { id: createOptionId(), text: '' },
  { id: createOptionId(), text: '' },
];

const cloneOptions = (options?: QuestionOption[]): QuestionOption[] => {
  if (!options || options.length === 0) {
    return createDefaultOptions();
  }

  return options.map((option) => ({
    ...option,
    isCorrect: option.isCorrect || false,
  }));
};

type QuestionFormMode = 'single' | 'bulk';

interface BulkParseItem {
  draft: QuestionDraft;
  sourceRow: number;
}

interface BulkMessage {
  type: 'error' | 'info';
  text: string;
}

const parseBulkInput = (
  raw: string,
  existingQuestions: Question[]
): { items: BulkParseItem[]; errors: string[] } => {
  const trimmed = raw.trim();
  const items: BulkParseItem[] = [];
  const errors: string[] = [];

  if (!trimmed) {
    errors.push('Vui lòng dán danh sách câu hỏi vào ô trống.');
    return { items, errors };
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    errors.push('Không tìm thấy dữ liệu.');
    return { items, errors };
  }

  const existingTexts = new Set(
    existingQuestions.map((question) => question.text.trim().toLowerCase())
  );
  const localTexts = new Set<string>();

  lines.forEach((line, index) => {
    const rowNumber = index + 1;
    let questionText = '';
    let optionsText = '';
    let format: Question['format'] = 'text';
    const required = true;

    // Smart Parsing Logic
    // Try to split by tab first (Excel copy-paste), then pipe
    if (line.includes('\t')) {
      const parts = line.split('\t');
      questionText = parts[0];
      optionsText = parts.slice(1).join('|');
    } else if (line.includes('|')) {
      // Format: Question | Opt1 | Opt2
      const parts = line.split('|');
      questionText = parts[0];
      optionsText = parts.slice(1).join('|');
    } else {
      // Just text
      questionText = line;
    }

    // Refine detection
    if (optionsText.trim()) {
      format = 'multiple_choice';
    }

    // Validation & Cleanup
    questionText = questionText.trim();
    if (!questionText) return;

    const normalizedKey = questionText.toLowerCase();
    if (existingTexts.has(normalizedKey)) {
      errors.push(`Dòng ${rowNumber}: Câu hỏi "${questionText}" đã tồn tại.`);
      return;
    }
    if (localTexts.has(normalizedKey)) {
      errors.push(`Dòng ${rowNumber}: Câu hỏi "${questionText}" bị trùng lặp.`);
      return;
    }

    let options: QuestionOption[] | undefined;
    if (format === 'multiple_choice') {
      const optionList = optionsText.split(/[|\t]/).map(o => o.trim()).filter(Boolean);
      if (optionList.length < 2) {
        errors.push(`Dòng ${rowNumber}: Câu trắc nghiệm cần ít nhất 2 đáp án.`);
        return;
      }
      options = optionList.map(text => ({ id: createOptionId(), text }));
    }

    items.push({
      draft: {
        text: questionText,
        type: 'General',
        format,
        required,
        options
      },
      sourceRow: rowNumber
    });
    localTexts.add(normalizedKey);
  });

  return { items, errors };
};

interface QuestionFormProps {
  question?: Question;
  onSubmit: (data: Question, role?: string) => void;
  onCancel: () => void;
  isEdit?: boolean;
  currentQuestions?: Question[];
  targetRole?: string;
  roles?: string[];
  setTargetRole?: (value: string) => void;
}

interface QuestionFormData {
  text: string;
  format: Question['format'];
  required: boolean;
  options: QuestionOption[];
}

interface FormErrors {
  text?: string;
  duplicate?: string;
  options?: string;
  role?: string;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  onSubmit,
  onCancel,
  isEdit = false,
  currentQuestions = [],
  targetRole = '',
  roles = [],
  setTargetRole = () => { },
}) => {
  const initialOptions = isMultipleChoice(question?.format)
    ? cloneOptions(question?.options)
    : createDefaultOptions();

  const [formData, setFormData] = useState<QuestionFormData>({
    text: question?.text ?? '',
    format: normaliseFormat(question?.format),
    required: question?.required ?? true,
    options: initialOptions,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<QuestionFormMode>('single');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkPreview, setBulkPreview] = useState<BulkParseItem[]>([]);
  const [bulkMessages, setBulkMessages] = useState<BulkMessage[]>([]);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const resolvedType = question?.type ?? 'General';

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.text.trim()) {
      newErrors.text = 'Nội dung câu hỏi không được để trống';
    }

    if (!isEdit && !targetRole.trim()) {
      newErrors.role = 'Vui lòng chọn vị trí';
    }

    if (
      currentQuestions.some(
        (q) =>
          q.text.trim().toLowerCase() === formData.text.trim().toLowerCase() &&
          q.id !== question?.id,
      )
    ) {
      newErrors.duplicate = 'Câu hỏi này đã tồn tại trong danh sách';
    }

    if (isMultipleChoice(formData.format)) {
      const validOptions = formData.options.filter((option) => option.text.trim());

      if (validOptions.length < 2) {
        newErrors.options = 'Cần ít nhất hai phương án trả lời cho câu hỏi trắc nghiệm.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const multipleChoice = isMultipleChoice(formData.format);
    const cleanedOptions = multipleChoice
      ? formData.options
        .filter((option) => option.text.trim())
        .map((option) => ({
          ...option,
          isCorrect: option.isCorrect || false,
        }))
      : undefined;

    const draft: QuestionDraft = {
      text: formData.text.trim(),
      type: resolvedType,
      format: normaliseFormat(formData.format),
      required: formData.required,
      options: cleanedOptions,
    };

    try {
      if (isEdit && question) {
        await updateQuestion({
          ...draft,
          id: question.id,
          assessmentId: question.assessmentId,
          createdAt: question.createdAt,
        });

        onSubmit({
          ...question,
          text: draft.text,
          type: draft.type,
          format: draft.format,
          required: draft.required,
          options: cleanedOptions,
        });

        toast({
          title: 'Thành công',
          description: 'Câu hỏi đã được cập nhật.',
        });
      } else {
        const newQuestion = await createQuestion(draft, targetRole);
        onSubmit(newQuestion, targetRole);
        toast({
          title: 'Thành công',
          description: 'Câu hỏi đã được tạo.',
        });
      }

      onCancel();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (isEdit ? 'Không thể cập nhật câu hỏi.' : 'Không thể tạo câu hỏi.');
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Lỗi khi gửi form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormatChange = (value: Question['format']) => {
    const nextFormat = normaliseFormat(value);

    setFormData((prev) => {
      if (isMultipleChoice(nextFormat)) {
        const options = prev.options.length > 0 ? prev.options : createDefaultOptions();

        return {
          ...prev,
          format: nextFormat,
          options,
        };
      }

      return {
        ...prev,
        format: nextFormat,
        options: [],
      };
    });
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { id: createOptionId(), text: '' },
      ],
    }));
  };

  const removeOption = (optionId: string) => {
    setFormData((prev) => {
      if (prev.options.length <= 2) {
        return prev;
      }

      const filtered = prev.options.filter((option) => option.id !== optionId);

      return {
        ...prev,
        options: filtered,
      };
    });
  };

  const updateOption = (optionId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.id === optionId ? { ...option, text: value } : option,
      ),
    }));
  };

  const showErrors = (key: keyof FormErrors) =>
    errors[key] && (
      <div className="text-red-600 text-sm flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {errors[key]}
      </div>
    );

  const handleTabChange = (value: string) => {
    setMode(value as QuestionFormMode);
    setBulkMessages([]);
  };

  const handleBulkPreview = () => {
    const result = parseBulkInput(bulkInput, currentQuestions);
    const messages: BulkMessage[] = result.errors.map((error) => ({ type: 'error', text: error }));

    if (!result.items.length && result.errors.length === 0) {
      messages.push({ type: 'info', text: 'Không tìm thấy dữ liệu hợp lệ.' });
    }

    setBulkMessages(messages);
    setBulkPreview(result.items);
  };

  const handleBulkSubmit = async () => {
    if (!targetRole.trim()) {
      setBulkMessages([{ type: 'info', text: 'Vui lòng chọn vị trí áp dụng trước khi tạo câu hỏi.' }]);
      return;
    }

    if (!bulkPreview.length) {
      setBulkMessages([{ type: 'info', text: 'Chưa có câu hỏi hợp lệ. Hãy nhấn "Kiểm tra dữ liệu" trước.' }]);
      return;
    }

    setBulkMessages([]);
    setIsBulkSubmitting(true);

    const total = bulkPreview.length;
    const remaining: BulkParseItem[] = [];
    const failures: BulkMessage[] = [];
    const successes: Question[] = [];

    for (const item of bulkPreview) {
      try {
        const created = await createQuestion(item.draft, targetRole);
        successes.push(created);
      } catch (error) {
        console.error('Không thể tạo câu hỏi từ bulk upload:', error);
        failures.push({
          type: 'error',
          text: `Dòng ${item.sourceRow}: Không thể tạo câu hỏi "${item.draft.text}".`,
        });
        remaining.push(item);
      }
    }

    successes.forEach((created) => onSubmit(created, targetRole));

    if (successes.length) {
      toast({
        title: 'Thành công',
        description: `Đã tạo ${successes.length}/${total} câu hỏi mới.`,
      });
    }

    if (failures.length) {
      toast({
        title: 'Có lỗi xảy ra',
        description: 'Một số câu hỏi chưa được tạo. Vui lòng kiểm tra danh sách lỗi bên dưới.',
        variant: 'destructive',
      });
    }

    setBulkMessages(failures);
    setBulkPreview(remaining);

    if (!failures.length) {
      setBulkInput('');
      onCancel();
    }

    setIsBulkSubmitting(false);
  };

  const renderSingleForm = (showRoleSelection: boolean) => (
    <div className="space-y-4">
      {showErrors('text')}
      {showErrors('duplicate')}
      {showErrors('options')}

      {showRoleSelection && (
        <div className="space-y-2">
          <Label>Vị trí áp dụng *</Label>
          <Select value={targetRole} onValueChange={setTargetRole}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn vị trí..." />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showErrors('role')}
        </div>
      )}

      <div>
        <Label htmlFor="text">Nội dung câu hỏi *</Label>
        <Textarea
          id="text"
          placeholder="Nhập nội dung câu hỏi..."
          value={formData.text}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, text: event.target.value }))
          }
          className="min-h-[80px] resize-none"
        />
      </div>

      <div>
        <Label>Định dạng</Label>
        <Select value={formData.format} onValueChange={handleFormatChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Tự luận</SelectItem>
            <SelectItem value="multiple_choice">Trắc nghiệm</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isMultipleChoice(formData.format) && (
        <div className="space-y-3">
          <Label>Các phương án trả lời</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Chọn đáp án đúng bằng cách nhấn vào biểu tượng ✓ bên cạnh phương án
          </p>
          {formData.options.map((option, index) => (
            <div key={option.id} className="flex items-start gap-3">
              <Button
                type="button"
                variant={option.isCorrect ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    options: prev.options.map((opt) =>
                      opt.id === option.id
                        ? { ...opt, isCorrect: !opt.isCorrect }
                        : opt
                    ),
                  }));
                }}
                className={`mt-1 ${option.isCorrect ? 'bg-green-600 hover:bg-green-700' : ''}`}
                title={option.isCorrect ? 'Đáp án đúng' : 'Đánh dấu là đáp án đúng'}
              >
                <Check className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <Input
                  placeholder={`Phương án ${index + 1}`}
                  value={option.text}
                  onChange={(event) => updateOption(option.id, event.target.value)}
                />
              </div>
              {formData.options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(option.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          {formData.options.length < 6 && (
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm phương án
            </Button>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          Huỷ
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            Object.keys(errors).length > 0 ||
            !formData.text.trim() ||
            (!isEdit && !targetRole.trim())
          }
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          {isEdit ? 'Cập nhật' : 'Tạo'}
        </Button>
      </div>
    </div>
  );

  const renderBulkForm = () => {
    const hasInput = bulkInput.trim().length > 0;
    const hasPreview = bulkPreview.length > 0;
    const hasErrors = bulkMessages.length > 0;

    return (
      <div className="space-y-5">
        {/* Hướng dẫn nhanh */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
              💡
            </div>
            <div className="flex-1">
              <p className="font-semibold text-blue-900 mb-2">Cách thêm nhanh nhiều câu hỏi:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Chọn vị trí tuyển dụng bên dưới</li>
                <li>Dán danh sách câu hỏi (mỗi dòng 1 câu, dùng dấu | để tách đáp án)</li>
                <li>Nhấn nút xanh để hoàn tất</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Bước 1: Chọn vị trí */}
        <div className="bg-white border-2 rounded-lg p-5 space-y-3" style={{ borderColor: !targetRole ? '#3b82f6' : '#e5e7eb' }}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${targetRole ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
              {targetRole ? '✓' : '1'}
            </div>
            <Label className="text-base font-semibold text-gray-900">Chọn vị trí tuyển dụng</Label>
          </div>
          <Select value={targetRole} onValueChange={setTargetRole}>
            <SelectTrigger className="w-full bg-white text-base h-11">
              <SelectValue placeholder="👉 Nhấn vào đây để chọn vị trí..." />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role} className="text-base">{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {targetRole && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Đã chọn: <strong>{targetRole}</strong>
            </p>
          )}
        </div>

        {/* Bước 2: Nhập câu hỏi */}
        <div className="bg-white border-2 rounded-lg p-5 space-y-3" style={{ borderColor: targetRole && !hasInput ? '#3b82f6' : '#e5e7eb' }}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${hasInput ? 'bg-green-500 text-white' : targetRole ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
              {hasInput ? '✓' : '2'}
            </div>
            <Label className="text-base font-semibold text-gray-900">Dán danh sách câu hỏi</Label>
          </div>

          {/* Ví dụ mẫu */}
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
            <p className="font-medium text-amber-900 mb-2">📝 Ví dụ mẫu (copy và thử):</p>
            <div className="bg-white rounded p-2 font-mono text-xs space-y-1 border border-amber-200">
              <div className="text-gray-700">Giới thiệu bản thân</div>
              <div className="text-gray-700">Điểm mạnh của bạn? | Làm việc nhóm | Quản lý thời gian | Giao tiếp</div>
              <div className="text-gray-700">Kinh nghiệm làm việc? | Dưới 1 năm | 1-3 năm | Trên 3 năm</div>
            </div>
          </div>

          <div className="relative">
            <Textarea
              placeholder="Dán danh sách câu hỏi vào đây...&#10;&#10;Mỗi dòng = 1 câu hỏi&#10;Câu tự luận: chỉ cần ghi câu hỏi&#10;Câu trắc nghiệm: Câu hỏi | Đáp án 1 | Đáp án 2 | Đáp án 3"
              value={bulkInput}
              onChange={(e) => {
                setBulkInput(e.target.value);
                setBulkMessages([]);
                setBulkPreview([]);
              }}
              className="min-h-[200px] font-mono text-sm p-4 leading-relaxed resize-y"
              disabled={!targetRole}
            />
            {hasInput && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-7 text-xs"
                onClick={() => {
                  setBulkInput('');
                  setBulkMessages([]);
                  setBulkPreview([]);
                }}
              >
                Xóa hết
              </Button>
            )}
          </div>

          {!targetRole && (
            <p className="text-sm text-gray-500 italic">⚠️ Vui lòng chọn vị trí ở bước 1 trước</p>
          )}
        </div>

        {/* Thông báo lỗi */}
        {hasErrors && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 animate-in fade-in">
            <div className="flex items-start gap-2 text-red-800 font-medium mb-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>Có lỗi trong dữ liệu, vui lòng sửa:</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1 ml-6">
              {bulkMessages.map((msg, idx) => (
                <li key={idx}>{msg.text}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Thông báo thành công */}
        {hasPreview && !hasErrors && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-full">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-900">Tuyệt vời! Đã nhận diện {bulkPreview.length} câu hỏi</p>
                <p className="text-sm text-green-700">Nhấn nút "Thêm câu hỏi" bên dưới để hoàn tất</p>
              </div>
            </div>
          </div>
        )}

        {/* Nút hành động */}
        <div className="flex items-center justify-between pt-4 border-t-2">
          <Button variant="outline" onClick={onCancel} className="px-6">
            Hủy
          </Button>

          {!hasPreview ? (
            <Button
              onClick={handleBulkPreview}
              disabled={!bulkInput.trim() || !targetRole}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8 text-base font-semibold"
            >
              {!targetRole ? '⚠️ Chọn vị trí trước' : !hasInput ? '⚠️ Nhập câu hỏi trước' : '✓ Kiểm tra dữ liệu'}
            </Button>
          ) : (
            <Button
              onClick={handleBulkSubmit}
              disabled={isBulkSubmitting}
              size="lg"
              className="bg-green-600 hover:bg-green-700 px-8 text-base font-semibold"
            >
              {isBulkSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Thêm {bulkPreview.length} câu hỏi
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}</DialogTitle>
      </DialogHeader>

      {isEdit ? (
        renderSingleForm(false)
      ) : (
        // TODO: Bulk upload feature - will be implemented later
        // <Tabs value={mode} onValueChange={handleTabChange} className="space-y-4">
        //   <TabsList className="grid w-full grid-cols-2">
        //     <TabsTrigger value="single">Nhập từng câu</TabsTrigger>
        //     <TabsTrigger value="bulk">Tải lên hàng loạt</TabsTrigger>
        //   </TabsList>
        //   <TabsContent value="single">{renderSingleForm(true)}</TabsContent>
        //   <TabsContent value="bulk">{renderBulkForm()}</TabsContent>
        // </Tabs>
        renderSingleForm(true)
      )}
    </div>
  );
};

export default QuestionForm;
