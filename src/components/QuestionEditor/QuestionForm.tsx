// src/components/QuestionForm.tsx
import { useState, ChangeEvent } from 'react';
import { Plus, Check, X, AlertCircle, Loader2, Upload, Download, Copy } from 'lucide-react';
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

const BULK_TEMPLATE = `Format,Question,Options,Required
text,"Giới thiệu bản thân",,true
multiple_choice,"Điểm mạnh lớn nhất của bạn?","Làm việc nhóm|Quản lý thời gian|Giao tiếp",true
multiple_choice,"Bạn mong muốn môi trường làm việc như thế nào?","Linh hoạt|Kỷ luật|Định hướng kết quả",false
`;

const AI_PROMPT_TEMPLATE = `Convert the following interview questions into CSV with the headers:
Format,Question,Options,Required

Rules:
- Use "text" for open-ended questions.
- Use "multiple_choice" for questions that include answer options. Put the answer choices in the Options column and separate them with "|" (example: Option A|Option B|Option C).
- Leave the Options column blank for open-ended questions.
- Fill the Required column with "true" or "false" only.

Return the CSV data only. Questions:
[Paste questions here]
`;

type QuestionFormMode = 'single' | 'bulk';

interface BulkParseItem {
  draft: QuestionDraft;
  sourceRow: number;
}

interface BulkMessage {
  type: 'error' | 'info';
  text: string;
}

const parseBoolean = (value?: string) => {
  if (!value) {
    return true;
  }
  const normalized = value.trim().toLowerCase();
  if (['0', 'false', 'no', 'n', 'không', 'khong', 'ko'].includes(normalized)) {
    return false;
  }
  return true;
};

const splitCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells.map((value) => value.replace(/^"(.*)"$/, '$1').trim());
};

const mapFormatInput = (value?: string): Question['format'] => {
  if (!value) {
    return 'text';
  }

  const normalized = value.trim().toLowerCase();

  if (
    normalized === 'multiple_choice' ||
    normalized === 'multiple-choice' ||
    normalized === 'multiple choice' ||
    normalized === 'mcq' ||
    normalized.includes('multiple') ||
    normalized.includes('trắc') ||
    normalized.includes('trac')
  ) {
    return 'multiple_choice';
  }

  return 'text';
};

const parseBulkInput = (
  raw: string,
  existingQuestions: Question[]
): { items: BulkParseItem[]; errors: string[] } => {
  const trimmed = raw.trim();
  const items: BulkParseItem[] = [];
  const errors: string[] = [];

  if (!trimmed) {
    errors.push('Vui lòng tải tệp hoặc dán danh sách câu hỏi trước khi xem trước.');
    return { items, errors };
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    errors.push('Không tìm thấy dữ liệu câu hỏi trong tệp.');
    return { items, errors };
  }

  const headerCells = splitCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const recognisedHeader = headerCells.some((cell) =>
    ['format', 'question', 'text', 'type', 'options', 'choices', 'required'].includes(cell)
  );

  const columns = recognisedHeader
    ? headerCells
    : ['format', 'question', 'options', 'required'];

  const dataLines = recognisedHeader ? lines.slice(1) : lines;

  if (!dataLines.length) {
    errors.push('Không có dòng dữ liệu nào sau phần tiêu đề.');
    return { items, errors };
  }

  const existingTexts = new Set(
    existingQuestions.map((question) => question.text.trim().toLowerCase())
  );
  const localTexts = new Set<string>();

  dataLines.forEach((line, index) => {
    const cells = splitCsvLine(line);
    while (cells.length < columns.length) {
      cells.push('');
    }

    const rowNumber = recognisedHeader ? index + 2 : index + 1;

    const cellValue = (key: string) => {
      const columnIndex = columns.indexOf(key);
      if (columnIndex === -1) {
        return '';
      }
      return cells[columnIndex] ?? '';
    };

    const textValue = cellValue('question') || cellValue('text') || '';
    if (!textValue.trim()) {
      errors.push(`Dòng ${rowNumber}: Thiếu nội dung câu hỏi.`);
      return;
    }

    const normalizedText = textValue.trim();
    const normalizedKey = normalizedText.toLowerCase();

    if (existingTexts.has(normalizedKey)) {
      errors.push(`Dòng ${rowNumber}: Câu hỏi đã tồn tại trong vai trò hiện tại.`);
      return;
    }

    if (localTexts.has(normalizedKey)) {
      errors.push(`Dòng ${rowNumber}: Câu hỏi bị trùng lặp trong tệp tải lên.`);
      return;
    }

    const formatValue = mapFormatInput(cellValue('format') || cellValue('loại'));
    const format = normaliseFormat(formatValue);

    const typeValue = (cellValue('type') || cellValue('nhóm') || '').trim();
    const requiredValue = cellValue('required');
    const required = parseBoolean(requiredValue);
    const optionsRaw = cellValue('options') || cellValue('choices') || '';

    let options: QuestionOption[] | undefined;

    if (format === 'multiple_choice') {
      const optionTexts = optionsRaw
        .split('|')
        .map((option) => option.trim())
        .filter(Boolean);

      if (optionTexts.length < 2) {
        errors.push(
          `Dòng ${rowNumber}: Câu hỏi trắc nghiệm cần tối thiểu 2 phương án, phân tách bằng dấu "|".`
        );
        return;
      }

      options = optionTexts.map((optionText) => ({
        id: createOptionId(),
        text: optionText,
      }));
    }

    const draft: QuestionDraft = {
      text: normalizedText,
      type: typeValue || 'General',
      format,
      required,
      options,
    };

    items.push({ draft, sourceRow: rowNumber });
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
  setTargetRole = () => {},
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
  const [bulkFileName, setBulkFileName] = useState('');
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
      messages.push({ type: 'info', text: 'Không tìm thấy dữ liệu hợp lệ trong tệp.' });
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
      setBulkMessages([{ type: 'info', text: 'Chưa có câu hỏi hợp lệ. Hãy chọn tệp và nhấn "Xem trước" trước khi tạo.' }]);
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
      setBulkFileName('');
      onCancel();
    }

    setIsBulkSubmitting(false);
  };

  const handleBulkFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setBulkInput(text);
      setBulkFileName(file.name);
      setBulkMessages([]);
      setBulkPreview([]);
    };
    reader.onerror = () => {
      toast({
        title: 'Không thể đọc tệp',
        description: 'Vui lòng kiểm tra lại định dạng tệp CSV (.csv, .txt).',
        variant: 'destructive',
      });
    };

    reader.readAsText(file, 'utf-8');
    event.target.value = '';
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([BULK_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hr-question-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
        toast({
          title: 'Đã sao chép',
          description: 'Dán prompt vào ChatGPT, Copilot hoặc công cụ AI bạn dùng.',
        });
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (error) {
      console.error('Không thể sao chép prompt AI:', error);
      toast({
        title: 'Không thể sao chép',
        description: 'Sao chép thủ công đoạn prompt bên dưới giúp nhé.',
        variant: 'destructive',
      });
    }
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
    const hasBlockingErrors = bulkMessages.some((message) => message.type === 'error');

    return (
      <div className="space-y-4">
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
          <p className="text-xs text-muted-foreground">
            Các câu hỏi mới sẽ được thêm vào vai trò đã chọn. Bạn có thể thay đổi vai trò trước khi tạo.
          </p>
        </div>

        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-5 space-y-3">
          <div className="flex items-start gap-2">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              i
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-2">📋 Hướng dẫn tải lên hàng loạt câu hỏi</p>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="font-medium text-gray-800 mb-2">🎯 Cách 1: Dùng file mẫu (Dễ nhất)</p>
                  <ol className="list-decimal space-y-1.5 pl-5 text-sm text-gray-700">
                    <li>Nhấn nút <strong>"Tải file mẫu"</strong> bên dưới</li>
                    <li>Mở file bằng Excel hoặc Google Sheets</li>
                    <li>Điền câu hỏi của bạn theo mẫu có sẵn</li>
                    <li>Lưu file và chọn tệp để tải lên</li>
                  </ol>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="font-medium text-gray-800 mb-2">🤖 Cách 2: Dùng AI (ChatGPT, Copilot)</p>
                  <ol className="list-decimal space-y-1.5 pl-5 text-sm text-gray-700">
                    <li>Nhấn <strong>"Sao chép prompt"</strong> bên dưới</li>
                    <li>Dán vào ChatGPT/Copilot kèm danh sách câu hỏi của bạn</li>
                    <li>AI sẽ tự động chuyển đổi sang định dạng CSV</li>
                    <li>Copy kết quả và dán vào ô bên dưới</li>
                  </ol>
                </div>

                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="font-medium text-gray-800 mb-2">📝 Định dạng CSV cần có:</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• <strong>Format:</strong> <code className="bg-gray-100 px-1 rounded">text</code> (tự luận) hoặc <code className="bg-gray-100 px-1 rounded">multiple_choice</code> (trắc nghiệm)</li>
                    <li>• <strong>Question:</strong> Nội dung câu hỏi</li>
                    <li>• <strong>Options:</strong> Các đáp án cách nhau bằng dấu <code className="bg-gray-100 px-1 rounded">|</code> (VD: Đáp án A|Đáp án B|Đáp án C)</li>
                    <li>• <strong>Required:</strong> <code className="bg-gray-100 px-1 rounded">true</code> (bắt buộc) hoặc <code className="bg-gray-100 px-1 rounded">false</code> (không bắt buộc)</li>
                  </ul>
                </div>

                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>💡 Lưu ý:</strong> Với câu hỏi tự luận, để trống cột Options. Với câu trắc nghiệm, phải có ít nhất 2 đáp án.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Prompt gợi ý cho AI (ChatGPT, Copilot, v.v.)</Label>
              <p className="text-xs text-muted-foreground">Dán prompt này cùng danh sách câu hỏi của bạn, AI sẽ trả về đúng CSV cần nhập.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
              <Copy className="mr-2 h-4 w-4" />
              Sao chép prompt
            </Button>
          </div>
          <Textarea
            value={AI_PROMPT_TEMPLATE}
            readOnly
            className="min-h-[140px] font-mono text-xs text-gray-700"
          />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input type="file" accept=".csv,.txt" onChange={handleBulkFileUpload} className="md:max-w-xs" />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Tải file mẫu
            </Button>
            {bulkFileName && (
              <span>Tệp đã chọn: {bulkFileName}</span>
            )}
          </div>
        </div>

        <Textarea
          placeholder="Dán nội dung CSV trực tiếp tại đây, mỗi dòng một câu hỏi."
          value={bulkInput}
          onChange={(event) => {
            setBulkInput(event.target.value);
            setBulkMessages([]);
            setBulkPreview([]);
          }}
          className="min-h-[160px]"
        />

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkPreview}
            disabled={isBulkSubmitting}
          >
            <Upload className="mr-2 h-4 w-4" />
            Xem trước dữ liệu
          </Button>
          <span>Bạn có thể chỉnh sửa trực tiếp nội dung sau khi dán.</span>
        </div>

        {bulkMessages.length > 0 && (
          <div className="space-y-2">
            {bulkMessages.map((message, index) => (
              <div
                key={`${message.text}-${index}`}
                className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                  message.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-blue-200 bg-blue-50 text-blue-700'
                }`}
              >
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>{message.text}</span>
              </div>
            ))}
          </div>
        )}

        {bulkPreview.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
              <span>Đã đọc {bulkPreview.length} câu hỏi sẵn sàng tạo.</span>
              <span>Định dạng: <code>text</code> = Tự luận, <code>multiple_choice</code> = Trắc nghiệm</span>
            </div>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-2">
              {bulkPreview.map((item) => (
                <div
                  key={`${item.sourceRow}-${item.draft.text}`}
                  className="rounded-md border border-gray-200 bg-white p-3 shadow-sm"
                >
                  <div className="text-sm font-medium text-gray-900 line-clamp-2">
                    {item.draft.text}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-gray-500">
                    <span>Dòng: {item.sourceRow}</span>
                    <span>Định dạng: {item.draft.format === 'text' ? 'Tự luận' : 'Trắc nghiệm'}</span>
                    <span>Phương án: {item.draft.options?.length ?? 0}</span>
                    <span>Bắt buộc: {item.draft.required ? 'Có' : 'Không'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onCancel} disabled={isBulkSubmitting}>
            Huỷ
          </Button>
          <Button
            onClick={handleBulkSubmit}
            disabled={
              isBulkSubmitting ||
              !bulkPreview.length ||
              hasBlockingErrors ||
              !targetRole.trim()
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isBulkSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {bulkPreview.length > 0 ? `Tạo ${bulkPreview.length} câu hỏi` : 'Tạo câu hỏi'}
          </Button>
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
        <Tabs value={mode} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Nhập từng câu</TabsTrigger>
            <TabsTrigger value="bulk">Tải lên hàng loạt</TabsTrigger>
          </TabsList>
          <TabsContent value="single">{renderSingleForm(true)}</TabsContent>
          <TabsContent value="bulk">{renderBulkForm()}</TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default QuestionForm;
