import { UserProfile, Subject, Exercise, Flashcard, LeaderboardUser, PastExam, CommunityPost, CommunityAnswer, QuizOption } from './types';

export const avatars: string[] = [
    'https://i.imgur.com/E5J0f7L.jpeg',
    'https://i.imgur.com/v8S9iC3.jpeg',
    'https://i.imgur.com/kF4g1j2.jpeg',
    'https://i.imgur.com/h5r1J0N.jpeg',
    'https://i.imgur.com/Z5v2S1C.jpeg',
    'https://i.imgur.com/2K1z2Q1.jpeg'
];

export const academicStreams: string[] = [
    'علوم تجريبية',
    'رياضيات',
    'تقني رياضي',
    'تسيير و اقتصاد',
    'آداب و فلسفة',
    'لغات أجنبية'
];


export const mockUser: UserProfile = {
  // This user is now a fallback, actual data comes from localStorage.
  id: 'local-user',
  name: 'طالب',
  avatarUrl: avatars[0],
  points: 1250,
  streak: 5,
  badges: [
    { id: 'b1', name: 'المثابر', icon: '🔥', description: 'حافظ على حماسك لمدة 5 أيام متتالية' },
    { id: 'b2', name: 'مستكشف الرياضيات', icon: '📐', description: 'أكمل 10 دروس في الرياضيات' },
    { id: 'b3', name: 'العقل المدبر', icon: '🧠', description: 'حل 50 تمريناً بشكل صحيح' },
  ],
  // FIX: Added the missing 'stream' property as required by the UserProfile type.
  stream: academicStreams[0],
};

export const mockSubjects: Subject[] = [
  {
    id: 'math',
    name: 'الرياضيات',
    icon: '📊',
    color: 'blue',
    lessons: [
      {
        id: 'math-l1',
// FIX: Added missing subjectId property.
        subjectId: 'math',
        title: 'الأعداد المركبة',
        summary: 'استكشاف عالم الأعداد المركبة وخواصها.',
        content: 'الأعداد المركبة هي أعداد يمكن كتابتها على الصورة a + bi، حيث a و b عددان حقيقيان و i هي الوحدة التخيلية التي تحقق المعادلة i² = -1. يسمى a الجزء الحقيقي و b الجزء التخيلي.',
        examples: ['(3 + 2i) + (1 + 7i) = 4 + 9i', '(5 + i) * (2 - 4i) = 14 - 18i'],
        completed: true,
        difficulty: 'medium',
        imageUrl: 'https://i.imgur.com/sU4nDEz.png',
        pdfUrl: '#',
        quiz: [
            { 
                question: 'ما هو ناتج (2 + 3i) + (4 - i)؟', 
                options: [
                    { text: '6 + 2i', is_correct: true },
                    { text: '6 + 4i', is_correct: false },
                    { text: '2 - 2i', is_correct: false },
                ]
            },
            { 
                question: 'ما هو الجزء التخيلي للعدد 5 - 7i؟', 
                options: [
                    { text: '5', is_correct: false },
                    { text: '-7', is_correct: true },
                    { text: '7', is_correct: false },
                ]
            }
        ]
      },
      {
        id: 'math-l2',
// FIX: Added missing subjectId property.
        subjectId: 'math',
        title: 'الدوال الأسية واللوغاريتمية',
        summary: 'فهم خصائص الدوال الأسية واللوغاريتمية وتطبيقاتها.',
        content: 'الدالة الأسية هي دالة على الصورة f(x) = a^x حيث a عدد حقيقي موجب لا يساوي 1. الدالة اللوغاريتمية هي الدالة العكسية للدالة الأسية.',
        examples: ['e^ln(x) = x', 'log_10(100) = 2'],
        completed: false,
        difficulty: 'hard',
        imageUrl: 'https://i.imgur.com/4gC2j0f.png',
         pdfUrl: '#',
      },
    ],
  },
  {
    id: 'physics',
    name: 'الفيزياء',
    icon: '⚛️',
    color: 'purple',
    lessons: [
      {
        id: 'phy-l1',
// FIX: Added missing subjectId property.
        subjectId: 'physics',
        title: 'الميكانيك الكلاسيكي',
        summary: 'قوانين نيوتن للحركة وتطبيقاتها.',
        content: 'قانون نيوتن الأول (القصور الذاتي)، قانون نيوتن الثاني (F=ma)، وقانون نيوتن الثالث (الفعل ورد الفعل).',
        examples: ['حساب تسارع جسم كتلته 5 كغ تؤثر عليه قوة 20 نيوتن.', 'تحديد قوة رد الفعل عند وضع كتاب على طاولة.'],
        completed: true,
        difficulty: 'easy',
        imageUrl: 'https://i.imgur.com/8F9Z3hG.png',
        pdfUrl: '#',
      },
    ],
  },
  {
    id: 'science',
    name: 'علوم الطبيعة والحياة',
    icon: '🧬',
    color: 'green',
    lessons: [
       {
        id: 'sci-l1',
// FIX: Added missing subjectId property.
        subjectId: 'science',
        title: 'تركيب البروتين',
        summary: 'آليات الاستنساخ والترجمة لتركيب البروتينات.',
        content: 'تتم عملية تركيب البروتين على مرحلتين: الاستنساخ في النواة حيث يتم نسخ المعلومة الوراثية من الـ ADN إلى ARNm، والترجمة في الهيولى حيث تتم ترجمة لغة النكليوتيدات إلى لغة الأحماض الأمينية.',
        examples: ['تحديد سلسلة الأحماض الأمينية انطلاقا من سلسلة ARNm.', 'وصف دور الريبوزوم في عملية الترجمة.'],
        completed: false,
        difficulty: 'hard',
        imageUrl: 'https://i.imgur.com/y4wP40t.png',
        pdfUrl: '#',
      },
    ],
  },
];

export const mockDailyChallenge: Exercise[] = [
    { 
        id: 'ex1', 
        subject: 'الرياضيات', 
        type: 'mcq', 
        question: 'ما هو حل المعادلة x² + 1 = 0 في مجموعة الأعداد المركبة؟', 
        options: [
            { text: 'x=1', is_correct: false },
            { text: 'x=-1', is_correct: false },
            { text: 'x=i و x=-i', is_correct: true }
        ] 
    },
    { 
        id: 'ex2', 
        subject: 'الفيزياء', 
        type: 'true-false', 
        question: 'وحدة قياس القوة هي الواط.', 
        options: [
            { text: 'صحيح', is_correct: false },
            { text: 'خطأ', is_correct: true }
        ] 
    },
    { 
        id: 'ex3', 
        subject: 'العلوم', 
        type: 'mcq', 
        question: 'أين تتم عملية الاستنساخ في الخلية حقيقية النواة؟', 
        options: [
            { text: 'الهيولى', is_correct: false },
            { text: 'النواة', is_correct: true },
            { text: 'الريبوزوم', is_correct: false }
        ] 
    },
    { 
        id: 'ex4', 
        subject: 'الرياضيات', 
        type: 'true-false', 
        question: 'الدالة f(x) = e^x هي دالة متناقصة تماماً.', 
        options: [
            { text: 'صحيح', is_correct: false },
            { text: 'خطأ', is_correct: true }
        ] 
    },
    { 
        id: 'ex5', 
        subject: 'الفيزياء', 
        type: 'mcq', 
        question: 'أي من هذه الظواهر تتعلق بالميكانيك الكمي؟', 
        options: [
            { text: 'قانون الجذب العام', is_correct: false },
            { text: 'ازدواجية موجة-جسيم', is_correct: true },
            { text: 'قانون أوم', is_correct: false }
        ] 
    }
];

export const mockFlashcards: Flashcard[] = [
    { id: 'fc1', subject: 'الرياضيات', term: 'i²', definition: 'يساوي -1، حيث i هي الوحدة التخيلية.' },
    { id: 'fc2', subject: 'الفيزياء', term: 'القوة', definition: 'تأثير يغير حالة حركة الجسم. وحدتها النيوتن (N).' },
    { id: 'fc3', subject: 'العلوم', term: 'ARNm', definition: 'الحمض الريبي النووي الرسول، ينقل المعلومة الوراثية من النواة إلى الهيولى.' },
    { id: 'fc4', subject: 'الرياضيات', term: 'اللوغاريتم النيبيري (ln)', definition: 'هو اللوغاريتم للأساس e، وهو عكس الدالة الأسية e^x.'}
];

export const mockLeaderboard: LeaderboardUser[] = [
    { id: 'user1', name: 'سارة', avatarUrl: 'https://i.pravatar.cc/150?u=sarah', score: 2100, rank: 1 },
    { id: 'user2', name: 'يوسف', avatarUrl: 'https://i.pravatar.cc/150?u=youssef', score: 1850, rank: 2 },
    { id: 'user-me', name: 'عادل', avatarUrl: mockUser.avatarUrl, score: 1250, rank: 3 },
    { id: 'user4', name: 'فاطمة', avatarUrl: 'https://i.pravatar.cc/150?u=fatima', score: 980, rank: 4 },
];

export const mockPastExams: PastExam[] = [
    { id: 'pe1', subjectId: 'math', subjectName: 'الرياضيات', year: 2023, topicUrl: '#', solutionUrl: '#' },
    { id: 'pe2', subjectId: 'physics', subjectName: 'الفيزياء', year: 2023, topicUrl: '#', solutionUrl: '#' },
    { id: 'pe3', subjectId: 'math', subjectName: 'الرياضيات', year: 2022, topicUrl: '#', solutionUrl: '#' },
    { id: 'pe4', subjectId: 'science', subjectName: 'علوم الطبيعة والحياة', year: 2023, topicUrl: '#', solutionUrl: '#' },
];

const mockAnswers: CommunityAnswer[] = [
     { id: 'a1', author: 'أحمد', avatarUrl: 'https://i.pravatar.cc/150?u=ahmed', text: 'أعتقد أن الخطوة الأولى هي حساب المميز دلتا للمعادلة.', timestamp: 'منذ 5 دقائق' },
     { id: 'a2', author: 'مريم', avatarUrl: 'https://i.pravatar.cc/150?u=mariam', text: 'صحيح، وبعدها نجد الجذرين التربيعيين لدلتا في مجموعة الأعداد المركبة.', timestamp: 'منذ دقيقتين' }
];

export const mockCommunityPosts: CommunityPost[] = [
    {
        id: 'post1',
        author: 'خالد',
        avatarUrl: 'https://i.pravatar.cc/150?u=khaled',
        question: 'يا جماعة، كيف نحل معادلة من الدرجة الثانية في C (مجموعة الأعداد المركبة)؟ عندي تمرين ولم أفهم الطريقة.',
        subject: 'الرياضيات',
        timestamp: 'منذ 10 دقائق',
        answers: mockAnswers,
    },
    {
        id: 'post2',
        author: 'ليلى',
        avatarUrl: 'https://i.pravatar.cc/150?u=laila',
        question: 'ما هو الفرق الأساسي بين الاستنساخ والترجمة في عملية تركيب البروتين؟ الأمر مختلط علي.',
        subject: 'علوم الطبيعة والحياة',
        timestamp: 'منذ ساعة',
        answers: [],
    }
];