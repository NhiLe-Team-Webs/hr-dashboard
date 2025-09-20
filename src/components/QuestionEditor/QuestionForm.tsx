// src/components/QuestionForm.tsx
import { useState } from 'react';
import { Plus, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Question, QuestionOption } from '@/types/question';
import { createQuestion, updateQuestion } from '@/lib/api';
import type { QuestionDraft } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

const MULTIPLE_CHOICE_FORMATS = new Set<Question['format']>(['multiple-choice', 'multiple_choice']);

const normaliseFormat = (format?: Question['format']): Question['format'] => {
  if (!format) {
    return 'text';
  }
  return format === 'multiple_choice' ? 'multiple-choice' : format;
};

const isMultipleChoice = (format?: Question['format']) =>
  !!format && MULTIPLE_CHOICE_FORMATS.has(normaliseFormat(format));

const createOptionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `opt-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createDefaultOptions = (): QuestionOption[] => [
  { id: createOptionId(), text: '', isCorrect: true },
  { id: createOptionId(), text: '', isCorrect: false },
];

const cloneOptions = (options?: QuestionOption[], correctAnswer?: string): QuestionOption[] => {
  if (!options || options.length === 0) {
    return createDefaultOptions();
  }

  const resolvedCorrect =
    correctAnswer ?? options.find((option) => option.isCorrect)?.id ?? options[0].id;

  return options.map((option) => ({
    ...option,
    isCorrect: option.isCorrect ?? option.id === resolvedCorrect,
  }));
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
  type: string;
  format: Question['format'];
  required: boolean;
  options: QuestionOption[];
  correctAnswer: string;
}

interface FormErrors {
  text?: string;
  duplicate?: string;
  options?: string;
  correctAnswer?: string;
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
    ? cloneOptions(question?.options, question?.correctAnswer)
    : createDefaultOptions();

  const [formData, setFormData] = useState<QuestionFormData>({
    text: question?.text ?? '',
    type: question?.type ?? 'Work Sample',
    format: normaliseFormat(question?.format),
    required: question?.required ?? true,
    options: initialOptions,
    correctAnswer:
      question?.correctAnswer ??
      initialOptions.find((option) => option.isCorrect)?.id ??
      initialOptions[0]?.id ??
      '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

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

      if (!validOptions.some((option) => option.id === formData.correctAnswer)) {
        newErrors.correctAnswer = 'Vui lòng chọn đáp án đúng.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const multipleChoice = isMultipleChoice(formData.format);
    const cleanedOptions = multipleChoice
      ? formData.options
          .filter((option) => option.text.trim())
          .map((option) => ({
            ...option,
            isCorrect: option.id === formData.correctAnswer,
          }))
      : undefined;

    const draft: QuestionDraft = {
      text: formData.text.trim(),
      type: formData.type,
      format: normaliseFormat(formData.format),
      required: formData.required,
      options: cleanedOptions,
      correctAnswer: multipleChoice ? formData.correctAnswer : undefined,
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
          correctAnswer: draft.correctAnswer,
        });

        toast({
          title: 'Thành công',
          description: 'Câu hỏi đã được cập nhật.',
        });
      } else {
        if (!targetRole) {
          return;
        }

        const newQuestion = await createQuestion(draft, targetRole);
        onSubmit(newQuestion, targetRole);
        toast({
          title: 'Thành công',
          description: 'Câu hỏi đã được tạo.',
        });
      }

      onCancel();
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: isEdit ? 'Không thể cập nhật câu hỏi.' : 'Không thể tạo câu hỏi.',
        variant: 'destructive',
      });
      console.error('Lỗi khi gửi form:', error);
    }
  };

  const handleFormatChange = (value: Question['format']) => {
    const nextFormat = normaliseFormat(value);

    setFormData((prev) => {
      if (isMultipleChoice(nextFormat)) {
        const options = prev.options.length > 0 ? prev.options : createDefaultOptions();
        const correct =
          options.find((option) => option.isCorrect)?.id ?? options[0]?.id ?? '';

        return {
          ...prev,
          format: nextFormat,
          options,
          correctAnswer: correct,
        };
      }

      return {
        ...prev,
        format: nextFormat,
        options: [],
        correctAnswer: '',
      };
    });
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { id: createOptionId(), text: '', isCorrect: false },
      ],
    }));
  };

  const removeOption = (optionId: string) => {
    setFormData((prev) => {
      if (prev.options.length <= 2) {
        return prev;
      }

      const filtered = prev.options.filter((option) => option.id !== optionId);
      const nextCorrect =
        prev.correctAnswer === optionId ? filtered[0]?.id ?? '' : prev.correctAnswer;

      return {
        ...prev,
        options: filtered,
        correctAnswer: nextCorrect,
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

  const setCorrectAnswer = (optionId: string) => {
    setFormData((prev) => ({
      ...prev,
      correctAnswer: optionId,
      options: prev.options.map((option) => ({
        ...option,
        isCorrect: option.id === optionId,
      })),
    }));
  };

  const showErrors = (key: keyof FormErrors) =>
    errors[key] && (
      <div className="text-red-600 text-sm flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {errors[key]}
      </div>
    );

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}</DialogTitle>
      </DialogHeader>

      {showErrors('text')}
      {showErrors('duplicate')}
      {showErrors('options')}
      {showErrors('correctAnswer')}
      {showErrors('role')}

      {!isEdit && (
        <div>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Định dạng</Label>
          <Select value={formData.format} onValueChange={handleFormatChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Tự luận</SelectItem>
              <SelectItem value="multiple-choice">Trắc nghiệm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isMultipleChoice(formData.format) && (
        <div className="space-y-3">
          <Label>Các phương án trả lời</Label>
          {formData.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-3">
              <input
                type="radio"
                name="correctAnswer"
                checked={formData.correctAnswer === option.id}
                onChange={() => setCorrectAnswer(option.id)}
                className="text-blue-600"
              />
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
            Object.keys(errors).length > 0 ||
            !formData.text.trim() ||
            (!isEdit && !targetRole.trim())
          }
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Check className="w-4 h-4 mr-2" />
          {isEdit ? 'Cập nhật' : 'Tạo'}
        </Button>
      </div>
    </div>
  );
};

export default QuestionForm;
