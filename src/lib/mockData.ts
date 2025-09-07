export interface Candidate {
  id: string;
  userName: string;
  avatarChar: string;
  fullName: string;
  email: string;
  phone: string;
  telegram: string;
  gender: string;
  age: number;
  education: string;
  role: string;
  status: 'completed' | 'in_progress';
  startTime: Date;
  scores?: {
    overall: number;
    work_sample: number;
    problem_solving: number;
    reliability: number;
    culture_fit: number;
  } | null;
  band?: 'A' | 'B' | 'C' | null;
}

export interface Question {
  id: string;
  type: 'Work Sample' | 'Problem Solving' | 'Values & Reliability';
  format: 'text' | 'multiple_choice';
  text: string;
  options?: { id: string; text: string }[];
  correctAnswer?: string;
  required: boolean;
  points: number;
}

export const mockCandidates: Candidate[] = [
  {
    id: 'attempt001',
    userName: 'Anna Nguyễn',
    avatarChar: 'A',
    fullName: 'Nguyễn Thị Anna',
    email: 'vanductan.nlt@gmail.com',
    phone: '0901234567',
    telegram: '@annanguyen',
    gender: 'Nữ',
    age: 25,
    education: 'Cử nhân Marketing',
    role: 'Content Creator',
    status: 'completed',
    startTime: new Date('2025-08-31T10:00:00'),
    scores: {
      overall: 92,
      work_sample: 95,
      problem_solving: 90,
      reliability: 88,
      culture_fit: 95
    },
    band: 'A'
  },
  {
    id: 'attempt002',
    userName: 'Bình Trần',
    avatarChar: 'B',
    fullName: 'Trần Văn Bình',
    email: 'binh.tran@email.com',
    phone: '0912345678',
    telegram: '@binhtran',
    gender: 'Nam',
    age: 28,
    education: 'Cao đẳng QTKD',
    role: 'Customer Support',
    status: 'completed',
    startTime: new Date('2025-08-30T14:30:00'),
    scores: {
      overall: 75,
      work_sample: 80,
      problem_solving: 70,
      reliability: 75,
      culture_fit: 72
    },
    band: 'B'
  },
  {
    id: 'attempt003',
    userName: 'Cường Lê',
    avatarChar: 'C',
    fullName: 'Lê Mạnh Cường',
    email: 'cuong.le@email.com',
    phone: '0987654321',
    telegram: '@cuongle',
    gender: 'Nam',
    age: 22,
    education: 'Tốt nghiệp THPT',
    role: 'Operations / Admin',
    status: 'completed',
    startTime: new Date('2025-08-29T09:00:00'),
    scores: {
      overall: 60,
      work_sample: 65,
      problem_solving: 55,
      reliability: 60,
      culture_fit: 62
    },
    band: 'C'
  },
  {
    id: 'attempt004',
    userName: 'Duyên Phạm',
    avatarChar: 'D',
    fullName: 'Phạm Thị Mỹ Duyên',
    email: 'duyen.pham@email.com',
    phone: '0934567890',
    telegram: '@duyenpham',
    gender: 'Nữ',
    age: 26,
    education: 'Cử nhân Báo chí',
    role: 'Content Creator',
    status: 'completed',
    startTime: new Date('2025-08-28T16:00:00'),
    scores: {
      overall: 78,
      work_sample: 85,
      problem_solving: 70,
      reliability: 80,
      culture_fit: 75
    },
    band: 'B'
  },
  {
    id: 'attempt005',
    userName: 'Phương Hồ',
    avatarChar: 'P',
    fullName: 'Hồ Thanh Phương',
    email: 'phuong.ho@email.com',
    phone: '0945678901',
    telegram: '@phuongho',
    gender: 'Nữ',
    age: 30,
    education: 'Thạc sĩ Quản lý',
    role: 'Operations / Admin',
    status: 'in_progress',
    startTime: new Date('2025-09-01T11:00:00'),
    scores: null,
    band: null
  },
];

export const mockQuestions: Record<string, Question[]> = {
  'Content Creator': [
    {
      id: 'cc1',
      type: 'Work Sample',
      format: 'text',
      text: 'Viết 3 tiêu đề YouTube cho video có chủ đề: "Một ngày làm việc của CEO khởi nghiệp".',
      required: true,
      points: 10
    },
    {
      id: 'cc6',
      type: 'Problem Solving',
      format: 'multiple_choice',
      text: 'Một video trên kênh bạn có CTR 1.5% trong 28 ngày (rất thấp). Bạn sẽ kiểm tra yếu tố nào trước?',
      options: [
        { id: 'opt1', text: 'Tiêu đề và Thumbnail' },
        { id: 'opt2', text: 'Nội dung video' },
        { id: 'opt3', text: 'Mô tả và Tags' }
      ],
      correctAnswer: 'opt1',
      required: true,
      points: 5
    },
    {
      id: 'cc9',
      type: 'Values & Reliability',
      format: 'text',
      text: 'Khi deadline gấp, bạn không chắc nội dung đã tối ưu. Bạn chọn: (A) Xuất bản đúng giờ dù chưa hoàn hảo, hay (B) Hoãn lại để chỉnh kỹ? Giải thích.',
      required: true,
      points: 8
    },
  ],
  'Customer Support': [
    {
      id: 'cs1',
      type: 'Work Sample',
      format: 'text',
      text: 'Một khách hàng tức giận vì giao hàng trễ, bạn sẽ trả lời email như thế nào?',
      required: true,
      points: 10
    },
    {
      id: 'cs6',
      type: 'Problem Solving',
      format: 'text',
      text: 'Một khách hàng báo lỗi: "App của tôi không mở được". Bạn cần hỏi thêm 3 câu gì để làm rõ vấn đề?',
      required: true,
      points: 7
    },
  ],
  'Operations / Admin': [
    {
      id: 'oa3',
      type: 'Work Sample',
      format: 'multiple_choice',
      text: 'Bạn được giao 3 việc cùng lúc: (A) gửi báo cáo, (B) đặt lịch họp, (C) xử lý email khẩn. Bạn sẽ ưu tiên thế nào?',
      options: [
        { id: 'opt1', text: 'A -> C -> B' },
        { id: 'opt2', text: 'C -> A -> B' },
        { id: 'opt3', text: 'B -> A -> C' }
      ],
      correctAnswer: 'opt2',
      required: true,
      points: 6
    },
    {
      id: 'oa6',
      type: 'Problem Solving',
      format: 'text',
      text: 'Trong báo cáo chi phí, bạn thấy một khoản lặp lại 2 lần. Bạn sẽ xử lý và báo cáo thế nào?',
      required: true,
      points: 8
    },
  ]
};