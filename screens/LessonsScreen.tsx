import React, { useState, useEffect } from 'react';
import { fetchSubjects, markLessonAsComplete } from '../services/api';
import { Subject, Lesson, QuizQuestion, QuizOption } from '../types';

const subjectColors: { [key: string]: { bg: string, text: string, border: string } } = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-400' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-400' },
    green: { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-400' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-400' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-400' },
    yellow: { bg: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-400' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-400' },
    red: { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-400' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-400' },
    default: { bg: 'bg-slate-500', text: 'text-slate-700', border: 'border-slate-400' },
};

const Quiz: React.FC<{ quiz: QuizQuestion[] }> = ({ quiz }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<QuizOption | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const question = quiz[currentQuestionIndex];
    const correctAnswer = question.options.find(opt => opt.is_correct);

    const handleAnswer = (option: QuizOption) => {
        if (isSubmitted) return;
        setSelectedOption(option);
        setIsSubmitted(true);
    };

    const handleNext = () => {
        setIsSubmitted(false);
        setSelectedOption(null);
        setCurrentQuestionIndex((prev) => (prev + 1) % quiz.length);
    };

    const getButtonClass = (option: QuizOption) => {
        if (!isSubmitted) return 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-teal-500 dark:hover:border-teal-400';
        if (option.is_correct) return 'bg-green-500 text-white border-green-500';
        if (option === selectedOption) return 'bg-red-500 text-white border-red-500';
        return 'bg-white dark:bg-slate-700 opacity-60';
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mt-4">
            <p className="font-bold mb-4">{question.question}</p>
            <div className="space-y-2">
                {question.options.map(opt => (
                    <button key={opt.text} onClick={() => handleAnswer(opt)} className={`w-full text-right p-3 rounded-lg border-2 transition-colors ${getButtonClass(opt)}`}>
                        {opt.text}
                    </button>
                ))}
            </div>
            {isSubmitted && (
                <div className="mt-4 text-center">
                    <p className={`font-bold ${selectedOption?.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedOption?.is_correct ? 'إجابة صحيحة!' : `الإجابة الصحيحة: ${correctAnswer?.text}`}
                    </p>
                    <button onClick={handleNext} className="mt-2 bg-slate-700 text-white px-4 py-2 rounded-lg">السؤال التالي</button>
                </div>
            )}
        </div>
    );
};

const LessonDetailView: React.FC<{ lesson: Lesson; onBack: () => void; color: string; onCompleteLesson: (lessonId: string, subjectId: string) => void; }> = ({ lesson, onBack, color, onCompleteLesson }) => {
    const colorClasses = subjectColors[color] || subjectColors.default;

    const handleListen = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`${lesson.title}. ${lesson.content}`);
            utterance.lang = 'ar-SA';
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } else {
            alert('خاصية تحويل النص إلى كلام غير مدعومة في متصفحك.');
        }
    };
    
    return (
    <div>
        <BackButton onClick={onBack} text="العودة للدروس" />
        {lesson.imageUrl && <img src={lesson.imageUrl} alt={lesson.title} className="w-full h-48 object-cover rounded-2xl mb-4" />}
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">{lesson.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{lesson.summary}</p>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
            <div>
                <h2 className={`text-xl font-bold border-b-2 ${colorClasses.border} pb-2 mb-3`}>شرح الدرس</h2>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{lesson.content || "محتوى الدرس سيتم إضافته قريباً."}</p>
            </div>
             {lesson.examples && lesson.examples.length > 0 && <div>
                <h2 className={`text-xl font-bold border-b-2 ${colorClasses.border} pb-2 mb-3`}>أمثلة</h2>
                <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ps-4">
                    {lesson.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                </ul>
            </div>}
            <div>
                <h2 className={`text-xl font-bold border-b-2 ${colorClasses.border} pb-2 mb-3`}>موارد إضافية</h2>
                <div className="flex flex-wrap gap-4">
                     <a href={lesson.pdfUrl || '#'} download target="_blank" rel="noopener noreferrer" className="bg-red-100 text-red-700 font-bold py-2 px-4 rounded-lg hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70">ملخص PDF 📄</a>
                     <button onClick={handleListen} className="bg-blue-100 text-blue-700 font-bold py-2 px-4 rounded-lg hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/70">استمع للشرح 🎧</button>
                </div>
            </div>
            {lesson.quiz && lesson.quiz.length > 0 && (
                 <div>
                    <h2 className={`text-xl font-bold border-b-2 ${colorClasses.border} pb-2 mb-3`}>اختبر فهمك</h2>
                    <Quiz quiz={lesson.quiz} />
                </div>
            )}
        </div>
         <div className="mt-8">
            <button
                onClick={() => onCompleteLesson(lesson.id, lesson.subjectId)}
                className={`w-full p-4 rounded-xl text-lg font-extrabold transition-colors duration-300 flex items-center justify-center gap-3 ${
                    lesson.completed 
                        ? 'bg-green-500 text-white cursor-default' 
                        : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
                disabled={lesson.completed}
            >
                {lesson.completed ? '✅ تم إكمال الدرس بنجاح' : 'إكمال الدرس'}
            </button>
        </div>
    </div>
)};


const BackButton: React.FC<{onClick: () => void, text: string}> = ({ onClick, text }) => (
    <button onClick={onClick} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white mb-6 font-bold">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 -scale-x-100">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
        </svg>
        <span>{text}</span>
    </button>
);

const SubjectDetailView: React.FC<{ 
    subject: Subject; 
    onBack: () => void; 
    onSelectLesson: (lesson: Lesson) => void; 
}> = ({ subject, onBack, onSelectLesson }) => {
    const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

    const filteredLessons = subject.lessons.filter(lesson => 
        difficultyFilter === 'all' || lesson.difficulty === difficultyFilter
    );

    const FilterButton: React.FC<{level: 'all' | 'easy' | 'medium' | 'hard', label: string}> = ({level, label}) => (
        <button 
            onClick={() => setDifficultyFilter(level)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${difficultyFilter === level ? 'bg-teal-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <BackButton onClick={onBack} text="العودة للمواد" />
            <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl">{subject.icon}</div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">{subject.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{subject.lessons.length} دروس متاحة</p>
                </div>
            </div>
            <div className="flex justify-center gap-2 mb-6">
                <FilterButton level="all" label="الكل" />
                <FilterButton level="easy" label="سهل" />
                <FilterButton level="medium" label="متوسط" />
                <FilterButton level="hard" label="صعب" />
            </div>
            <div className="space-y-4">
                {filteredLessons.length > 0 ? filteredLessons.map(lesson => (
                     <button key={lesson.id} onClick={() => onSelectLesson(lesson)} className="w-full bg-white dark:bg-slate-800 p-5 rounded-xl shadow hover:shadow-lg dark:hover:bg-slate-700 transition-shadow cursor-pointer flex items-center gap-4 text-right">
                         <div className={`w-12 h-12 rounded-lg ${lesson.completed ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'} flex items-center justify-center flex-shrink-0`}>
                            {lesson.completed ? 
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg> : 
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-slate-400 dark:text-slate-500"><path d="M12 1.5a.75.75 0 01.75.75V6h.75a.75.75 0 010 1.5H12v4.5h.75a.75.75 0 010 1.5H12V18h.75a.75.75 0 010 1.5H12v4.5a.75.75 0 01-1.5 0V19.5h-.75a.75.75 0 010-1.5H12V12h-.75a.75.75 0 010-1.5H12V2.25A.75.75 0 0112 1.5z" /></svg>
                            }
                         </div>
                         <div>
                             <h3 className="text-lg font-bold text-slate-800 dark:text-white">{lesson.title}</h3>
                             <p className="text-sm text-slate-500 dark:text-slate-400">{lesson.summary}</p>
                         </div>
                         <div className="ms-auto text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                         </div>
                     </button>
                )) : <p className="text-center text-slate-500 dark:text-slate-400 py-8">لا توجد دروس تطابق هذا المستوى.</p>}
            </div>
        </div>
    );
};


const LessonsScreen: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const loadSubjects = async () => {
        try {
            setLoading(true);
            const data = await fetchSubjects();
            setSubjects(data);
            setError(null);
        } catch (err) {
            setError('Failed to load subjects.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        loadSubjects();
    }, []);
    
    const handleCompleteLesson = async (lessonId: string, subjectId: string) => {
        try {
            // Optimistic UI update
            const updateState = (lessonSetter: React.Dispatch<React.SetStateAction<Lesson | null>>, subjectsSetter: React.Dispatch<React.SetStateAction<Subject[]>>) => {
                subjectsSetter(prevSubjects => 
                    prevSubjects.map(s => ({
                        ...s,
                        lessons: s.lessons.map(l => 
                            l.id === lessonId ? { ...l, completed: true } : l
                        )
                    }))
                );
                lessonSetter(prevLesson => 
                    prevLesson && prevLesson.id === lessonId ? { ...prevLesson, completed: true } : prevLesson
                );
            };
            
            updateState(setSelectedLesson, setSubjects);

            if (selectedSubject) {
                const updatedLessons = selectedSubject.lessons.map(l => l.id === lessonId ? { ...l, completed: true } : l);
                setSelectedSubject({...selectedSubject, lessons: updatedLessons});
            }

            // Call API to persist the change
            await markLessonAsComplete(lessonId, subjectId);
            
        } catch (error) {
            console.error("Failed to update lesson status:", error);
             alert('فشل تحديث حالة الدرس. يرجى المحاولة مرة أخرى.');
             loadSubjects(); 
        }
    };

    const filteredSubjects = subjects.filter(subject => 
        subject.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (selectedLesson && selectedSubject) {
        return (
            <div className="p-6">
                <LessonDetailView 
                    lesson={selectedLesson} 
                    onBack={() => setSelectedLesson(null)} 
                    color={selectedSubject.color}
                    onCompleteLesson={handleCompleteLesson}
                />
            </div>
        )
    }

    if (selectedSubject) {
        return (
             <div className="p-6">
                <SubjectDetailView 
                    subject={selectedSubject} 
                    onBack={() => setSelectedSubject(null)}
                    onSelectLesson={(lesson) => setSelectedLesson(lesson)}
                />
             </div>
        )
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-6">المواد الدراسية</h1>
            <div className="mb-6">
                <input 
                    type="text"
                    placeholder="ابحث عن مادة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
            </div>
            {loading && <div className="text-center">Loading subjects...</div>}
            {error && <div className="text-center text-red-500">{error}</div>}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSubjects.map((subject) => {
                        const colorClass = subjectColors[subject.color]?.bg || subjectColors.default.bg;
                        return (
                            <button key={subject.id} onClick={() => setSelectedSubject(subject)} className="text-right">
                                 <div className={`${colorClass} text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-300 cursor-pointer h-full`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold">{subject.name}</h3>
                                            <p className="opacity-80">{subject.lessons.length} دروس</p>
                                        </div>
                                        <div className="text-5xl opacity-50">{subject.icon}</div>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default LessonsScreen;