import React, { useState, useEffect } from 'react';
import { fetchSubjects, markLessonAsComplete } from '../services/api';
import { Subject, Lesson, QuizQuestion, QuizOption } from '../types';
import CircularProgressBar from '../components/CircularProgressBar';

const subjectColors: { [key: string]: { bg: string, text: string, border: string, darkBg: string } } = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-400', darkBg: 'dark:bg-blue-900/50' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-400', darkBg: 'dark:bg-purple-900/50' },
    green: { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-400', darkBg: 'dark:bg-green-900/50' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-400', darkBg: 'dark:bg-amber-900/50' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-400', darkBg: 'dark:bg-emerald-900/50' },
    yellow: { bg: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-400', darkBg: 'dark:bg-yellow-900/50' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-400', darkBg: 'dark:bg-orange-900/50' },
    red: { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-400', darkBg: 'dark:bg-red-900/50' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-400', darkBg: 'dark:bg-indigo-900/50' },
    default: { bg: 'bg-slate-500', text: 'text-slate-700', border: 'border-slate-400', darkBg: 'dark:bg-slate-900/50' },
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
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mt-4 border border-slate-200 dark:border-slate-700">
            <p className="font-bold mb-4 text-slate-800 dark:text-white">{question.question}</p>
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
    const [feedback, setFeedback] = useState<'liked'|'disliked'|null>(null);

    const handleListen = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`${lesson.title}. ${lesson.summary}. ${lesson.content}`);
            utterance.lang = 'ar-SA';
            utterance.rate = 0.9;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } else {
            alert('خاصية تحويل النص إلى كلام غير مدعومة في متصفحك.');
        }
    };
    
    return (
    <div className="animate-fade-in">
        <BackButton onClick={onBack} text="العودة للدروس" />
        {lesson.imageUrl && <img src={lesson.imageUrl} alt={lesson.title} className="w-full h-48 object-cover rounded-2xl mb-4" />}
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">{lesson.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-lg">{lesson.summary}</p>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg space-y-8">
            <div>
                <h2 className={`text-2xl font-bold border-r-4 ${colorClasses.border} pr-3 mb-4`}>شرح الدرس</h2>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-lg">{lesson.content || "محتوى الدرس سيتم إضافته قريباً."}</p>
            </div>
             {lesson.examples && lesson.examples.length > 0 && <div>
                <h2 className={`text-2xl font-bold border-r-4 ${colorClasses.border} pr-3 mb-4`}>أمثلة</h2>
                <ul className="space-y-3 text-slate-700 dark:text-slate-300 ps-4 text-lg">
                    {lesson.examples.map((ex, i) => <li key={i} className="flex items-start gap-3"><span className="text-primary mt-1.5">◆</span><span>{ex}</span></li>)}
                </ul>
            </div>}
            <div>
                <h2 className={`text-2xl font-bold border-r-4 ${colorClasses.border} pr-3 mb-4`}>موارد إضافية</h2>
                <div className="flex flex-wrap gap-4">
                     <a href={lesson.pdfUrl || '#'} download target="_blank" rel="noopener noreferrer" className="bg-red-100 text-red-700 font-bold py-2 px-4 rounded-lg hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/70">ملخص PDF 📄</a>
                     <button onClick={handleListen} className="bg-blue-100 text-blue-700 font-bold py-2 px-4 rounded-lg hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/70">استمع للشرح 🎧</button>
                </div>
            </div>
             <div>
                <h2 className={`text-2xl font-bold border-r-4 ${colorClasses.border} pr-3 mb-4`}>ملخص سريع ⚡️</h2>
                 <div className="space-y-3">
                    <p className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border-l-4 border-amber-400 text-amber-800 dark:text-amber-200">{lesson.summary}</p>
                </div>
            </div>
            {lesson.quiz && lesson.quiz.length > 0 && (
                 <div>
                    <h2 className={`text-2xl font-bold border-r-4 ${colorClasses.border} pr-3 mb-4`}>اختبر فهمك</h2>
                    <Quiz quiz={lesson.quiz} />
                </div>
            )}
             <div>
                <h2 className={`text-2xl font-bold border-r-4 ${colorClasses.border} pr-3 mb-4`}>هل كان الدرس مفيداً؟</h2>
                {feedback ? (
                    <p className="text-center font-bold text-green-600 dark:text-green-400">شكراً لتقييمك!</p>
                ) : (
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setFeedback('liked')} className="text-4xl transform hover:scale-125 transition-transform">👍</button>
                        <button onClick={() => setFeedback('disliked')} className="text-4xl transform hover:scale-125 transition-transform">👎</button>
                    </div>
                )}
            </div>
        </div>
         <div className="mt-8">
            <button
                onClick={() => onCompleteLesson(lesson.id, lesson.subjectId)}
                className={`w-full p-4 rounded-xl text-lg font-extrabold transition-transform duration-300 flex items-center justify-center gap-3 transform hover:-translate-y-1 ${
                    lesson.completed 
                        ? 'bg-green-500 text-white cursor-default' 
                        : 'bg-primary text-white hover:bg-primary-dark'
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

const LessonCard: React.FC<{ lesson: Lesson; subject: Subject; onClick: () => void }> = ({ lesson, subject, onClick }) => {
    const progress = lesson.completed ? 100 : 0;
    const isLocked = false; // Simplified for the new design, can be re-added if needed.
    const colorClasses = subjectColors[subject.color] || subjectColors.default;

    return (
         <button 
            onClick={onClick}
            disabled={isLocked}
            className={`w-full text-right bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex items-center gap-4 transition-transform duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <div className={`w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-3xl ${colorClasses.bg} text-white`}>
                {subject.icon}
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-white text-md">{lesson.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{lesson.summary.substring(0, 40)}...</p>
            </div>
            <div className="flex-shrink-0">
                {isLocked 
                    ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-slate-400 dark:text-slate-500"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
                    : <CircularProgressBar progress={progress} size={40} strokeWidth={5} color={lesson.completed ? '#22c55e' : '#f59e0b'} />
                }
            </div>
        </button>
    );
};


const SubjectDetailView: React.FC<{ subject: Subject; onBack: () => void; onSelectLesson: (lesson: Lesson) => void; }> = ({ subject, onBack, onSelectLesson }) => {
    return (
        <div className="animate-fade-in">
            <BackButton onClick={onBack} text="العودة للمواد" />
            <div className="flex items-center gap-4 mb-8">
                <div className="text-5xl">{subject.icon}</div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">{subject.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{subject.lessons.length} دروس متاحة</p>
                </div>
            </div>
            
            <div className="space-y-4">
                {subject.lessons.map((lesson) => (
                    <LessonCard 
                        key={lesson.id} 
                        lesson={lesson}
                        subject={subject}
                        onClick={() => onSelectLesson(lesson)}
                    />
                ))}
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
            const updateState = (lessonSetter: React.Dispatch<React.SetStateAction<Lesson | null>>, subjectsSetter: React.Dispatch<React.SetStateAction<Subject[]>>) => {
                subjectsSetter(prevSubjects => 
                    prevSubjects.map(s => s.id === subjectId ? {
                        ...s,
                        lessons: s.lessons.map(l => 
                            l.id === lessonId ? { ...l, completed: true } : l
                        )
                    } : s)
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

            await markLessonAsComplete(lessonId, subjectId);
        } catch (error) {
            console.error("Failed to update lesson status:", error);
             alert('فشل تحديث حالة الدرس. يرجى المحاولة مرة أخرى.');
             loadSubjects(); 
        }
    };

    if (selectedLesson && selectedSubject) {
        return (
            <div className="p-4 md:p-6">
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
             <div className="p-4 md:p-6">
                <SubjectDetailView 
                    subject={selectedSubject} 
                    onBack={() => setSelectedSubject(null)}
                    onSelectLesson={(lesson) => setSelectedLesson(lesson)}
                />
             </div>
        )
    }

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-6">المواد الدراسية</h1>
            
            {loading && <div className="text-center">Loading subjects...</div>}
            {error && <div className="text-center text-red-500">{error}</div>}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjects.map((subject) => {
                        const totalLessons = subject.lessons.length;
                        const completedLessons = subject.lessons.filter(l => l.completed).length;
                        const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
                        const colorClass = subjectColors[subject.color]?.bg || subjectColors.default.bg;

                        return (
                            <button key={subject.id} onClick={() => setSelectedSubject(subject)} className="text-right bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 transform hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex items-center gap-4">
                                     <div className={`${colorClass} w-16 h-16 rounded-xl flex items-center justify-center text-white text-4xl`}>
                                        {subject.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{subject.name}</h3>
                                        <p className="text-slate-500 dark:text-slate-400">{completedLessons}/{totalLessons} درس مكتمل</p>
                                    </div>
                                    <CircularProgressBar progress={progress} size={60} strokeWidth={6} color={`#${subject.color === 'blue' ? '3b82f6' : subject.color === 'purple' ? '8b5cf6' : '14b8a6'}`} />
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