// src/components/QuestionForm.tsx
import { useState } from 'react';
import { Plus, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Question, Option, QuestionTypeInfo } from '@/types/question';
import { createQuestion, updateQuestion } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

// Định nghĩa types cho component
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

// New interface for form data
interface QuestionFormData {
  text: string;
  type: string;
  format: string;  
  required: boolean;
  options: Option[];
  correctAnswer: string;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ 
  question, 
  onSubmit, 
  onCancel, 
  isEdit = false,
  currentQuestions = [],
  targetRole = '',
  roles = [],
  setTargetRole = () => {}
}) => {
  interface FormErrors {
    text?: string;
    duplicate?: string;
    options?: string;
    correctAnswer?: string;
    role?: string;
  }

  const [formData, setFormData] = useState<QuestionFormData>({
    text: question?.text || '',
    type: question?.type || 'Work Sample',
    format: question?.format || 'text',
    required: question?.required !== undefined ? question.required : true,
    options: question?.options && question.options.length > 0 ? [...question.options] : [{ id: 'a', text: '' }, { id: 'b', text: '' }],
    correctAnswer: question?.correctAnswer || 'a'
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.text.trim()) {
      newErrors.text = 'Nội dung câu hỏi không được để trống';
    }
    if (!targetRole.trim() && !isEdit) {
      newErrors.role = 'Vui lòng chọn vị trí';
    }
    if (currentQuestions.some(q => q.text.toLowerCase() === formData.text.toLowerCase() && q.id !== question?.id)) {
      newErrors.duplicate = 'Câu hỏi này đã tồn tại';
    }
    if (formData.format === 'multiple_choice') {
      const hasOptions = formData.options.some(opt => opt.text.trim());
      if (!hasOptions) {
        newErrors.options = 'Ít nhất một phương án phải có nội dung';
      }
      if (!formData.correctAnswer || !formData.options.find(opt => opt.id === formData.correctAnswer)?.text.trim()) {
        newErrors.correctAnswer = 'Phải chọn đáp án đúng hợp lệ';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
  if (validateForm()) {
    const processedData: Question = {
      id: question?.id || Date.now().toString(),
      text: formData.text,
      type: formData.type,
      format: formData.format as 'text' | 'multiple_choice',
      required: formData.required,
      options: formData.format === 'multiple_choice' ? formData.options.filter(opt => opt.text.trim()) : undefined,
      correctAnswer: formData.format === 'multiple_choice' ? formData.correctAnswer : undefined,
    };

    // Additional validation for multiple-choice questions
    if (formData.format === 'multiple_choice' && processedData.options!.length < 2) {
      setErrors(prev => ({
        ...prev,
        options: 'Cần ít nhất hai phương án trả lời cho câu hỏi trắc nghiệm.',
      }));
      return;
    }

    try {
      if (isEdit) {
        await updateQuestion(processedData);
        toast({
          title: 'Thành công',
          description: 'Câu hỏi đã được cập nhật.',
        });
      } else {
        const newQuestion = await createQuestion(processedData, targetRole);
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
  }
};

  const addOption = () => {
    const nextId = String.fromCharCode(97 + formData.options.length);
    setFormData(prev => ({ ...prev, options: [...prev.options, { id: nextId, text: '' }] }));
  };

  const removeOption = (optionId: string) => {
    if (formData.options.length <= 2) return;
    setFormData(prev => {
      const newOptions = prev.options.filter(opt => opt.id !== optionId);
      return {
        ...prev,
        options: newOptions,
        correctAnswer: prev.correctAnswer === optionId ? newOptions[0]?.id || 'a' : prev.correctAnswer
      }
    });
  };

  const updateOption = (optionId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === optionId ? { ...opt, text: value } : opt)
    }));
  };

  const setCorrectAnswer = (optionId: string) => {
    setFormData(prev => ({ ...prev, correctAnswer: optionId }));
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}</DialogTitle>
      </DialogHeader>
      
      {errors.text && <div className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.text}</div>}
      {errors.duplicate && <div className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.duplicate}</div>}
      {errors.options && <div className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.options}</div>}
      {errors.correctAnswer && <div className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.correctAnswer}</div>}
      {errors.role && <div className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.role}</div>}

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
          onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
          className="min-h-[80px] resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Định dạng</Label>
          <Select 
            value={formData.format} 
            onValueChange={(value) => {
              const newFormat = value as 'text' | 'multiple_choice';
              setFormData(prev => ({ 
                ...prev, 
                format: newFormat,
                options: newFormat === 'multiple_choice' && prev.options.length === 0 ? [{ id: 'a', text: '' }, { id: 'b', text: '' }] : prev.options
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Tự luận</SelectItem>
              <SelectItem value="multiple_choice">Trắc nghiệm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.format === 'multiple_choice' && (
        <div className="space-y-3">
          <Label>Các phương án trả lời</Label>
          {formData.options.map((option) => (
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
                  placeholder={`Phương án ${option.id.toUpperCase()}`}
                  value={option.text}
                  onChange={(e) => updateOption(option.id, e.target.value)}
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
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={Object.keys(errors).length > 0 || !formData.text.trim() || (!isEdit && !targetRole.trim())}
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