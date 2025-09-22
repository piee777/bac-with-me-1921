import React, { useState, useEffect } from 'react';
import { UserProfile, Subject, Screen, Lesson } from '../types';
import { fetchUserProfile, fetchSubjects } from '../services/api';
import SunIcon from '../components/icons/SunIcon';
import MoonIcon from '../components/icons/MoonIcon';
import CircularProgressBar from '../components/CircularProgressBar';
import ProgressBar from '../components/ProgressBar';

interface HomeScreenProps {
    setActiveScreen: (screen: Screen) => void;
    theme: string;
    toggleTheme: () => void;
}

const StatCard: React.FC<{icon: string, value: number | string, label: string, color: string}> = ({ icon, value, label, color }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full">
        <div className={`text-3xl mb-2 ${color}`}>{icon}</div>
        <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
    </div>
);

const FeatureCard: React.FC<{icon: string, title: string, description: string, onClick: () => void, className?: string}> = ({ icon, title, description, onClick, className = '' }) => (
    <button onClick={onClick} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center gap-2 transform hover:-translate-y-1 transition-transform duration-300 w-full ${className}`}>
        <div className="text-4xl">{icon}</div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{description}</p>
    </button>
);

const MotivationalQuote: React.FC = () => {
    const quotes = [
        "النجاح ليس نهاية، والفشل ليس قاتلاً، إنما الشجاعة لمواصلة الطريق هي الأهم.",
        "لا تنتظر الفرصة، بل اصنعها بنفسك.",
        "كلما زادت الصعاب، زاد المجد في التغلب عليها.",
        "أنت أقوى مما تتخيل، وأذكى مما تعتقد."
    ];
    const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);
    return (
        <div className="text-center p-4 mt-4">
            <p className="text-sm italic text-slate-500 dark:text-slate-400">"{quote}"</p>
        </div>
    );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ setActiveScreen, theme, toggleTheme }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nextLesson, setNextLesson] = useState<{ lesson: Lesson, subject: Subject } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [userData, subjectsData] = await Promise.all([
                    fetchUserProfile(),
                    fetchSubjects()
                ]);
                setUser(userData);
                setSubjects(subjectsData);

                // Find the first uncompleted lesson
                for (const subject of subjectsData) {
                    const lesson = subject.lessons.find(l => !l.completed);
                    if (lesson) {
                        setNextLesson({ lesson, subject });
                        break;
                    }
                }
                setError(null);
            } catch (err) {
                setError('Failed to load data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);
    
    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-slate-100 dark:bg-slate-950">
            <div className="text-primary text-lg font-semibold">جاري التحميل...</div>
        </div>;
    }

    if (error || !user) {
        return <div className="flex justify-center items-center h-screen bg-slate-100 dark:bg-slate-950">{error || 'User not found.'}</div>;
    }
    
    const totalLessons = subjects.reduce((acc, subject) => acc + subject.lessons.length, 0);
    const completedLessons = subjects.reduce((acc, subject) => acc + subject.lessons.filter(l => l.completed).length, 0);
    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return (
        <div className="p-4 md:p-6 space-y-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                     <img src={user.avatarUrl} alt="User Avatar" className="w-14 h-14 rounded-full border-4 border-white dark:border-slate-800 shadow-md" />
                    <div>
                        <h1 className="text-xl font-bold text-slate-600 dark:text-slate-300">مرحباً بعودتك،</h1>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white -mt-1">{user.name}!</h2>
                    </div>
                </div>
                <button onClick={toggleTheme} className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-md">
                    {theme === 'light' ? <MoonIcon className="w-6 h-6 text-slate-700"/> : <SunIcon className="w-6 h-6 text-yellow-400"/>}
                </button>
            </header>
            
             {nextLesson && (
                <section 
                    onClick={() => setActiveScreen('lessons')} 
                    className="bg-primary text-white p-6 rounded-2xl shadow-lg cursor-pointer transform hover:scale-[1.02] transition-transform duration-300"
                >
                    <h2 className="text-lg font-bold opacity-80">مواصلة التعلم</h2>
                    <p className="text-2xl font-extrabold mt-1">{nextLesson.lesson.title}</p>
                    <p className="opacity-80">{nextLesson.subject.name}</p>
                    <div className="mt-4">
                        <ProgressBar value={progressPercentage} color="bg-white/50" height="h-2"/>
                    </div>
                </section>
            )}

             <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white text-center">أهداف اليوم</h2>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="text-3xl">🎯</span>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">أكمل درساً واحداً</p>
                            <ProgressBar value={completedLessons > 0 ? 100 : 0} color="bg-primary" />
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <span className="text-3xl">💎</span>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">اكتسب 20 نقطة</p>
                            <ProgressBar value={(user.points % 20) * 5} color="bg-secondary" />
                        </div>
                    </div>
                 </div>
            </section>
            
            <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                    <CircularProgressBar progress={progressPercentage} size={100} strokeWidth={10} color="#14b8a6" />
                </div>
                <div className="flex-1 w-full">
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white text-center md:text-right">إحصائياتي</h2>
                    <div className="grid grid-cols-3 gap-3">
                         <StatCard icon="💎" value={user.points} label="نقطة" color="text-secondary" />
                         <StatCard icon="🔥" value={user.streak} label="أيام متتالية" color="text-red-500" />
                         <StatCard icon="🏆" value={user.badges.length} label="شارة" color="text-primary" />
                    </div>
                </div>
            </section>
            
            <section>
                <div className="grid grid-cols-2 gap-4">
                   <FeatureCard
                        icon="⚡️"
                        title="مراجعة سريعة"
                        description="بطاقات للمصطلحات."
                        onClick={() => setActiveScreen('quick-review')}
                    />
                    <FeatureCard
                        icon="📝"
                        title="امتحان تجريبي"
                        description="اختبر معلوماتك."
                        onClick={() => setActiveScreen('exam')}
                    />
                    <FeatureCard
                        icon="🤖"
                        title="مولّد الأسئلة"
                        description="أنشئ اختباراً بالذكاء الاصطناعي."
                        onClick={() => setActiveScreen('exam-generator')}
                    />
                    <FeatureCard
                        icon="🗓️"
                        title="مولد الخطة"
                        description="أنشئ جدول مراجعة مخصص."
                        onClick={() => setActiveScreen('study-plan')}
                    />
                     <FeatureCard
                        icon="📚"
                        title="مكتبة الامتحانات"
                        description="بكالوريات سابقة."
                        onClick={() => setActiveScreen('past-exams')}
                        className="col-span-2"
                    />
                    <FeatureCard
                        icon="🥇"
                        title="لوحة الصدارة"
                        description="شاهد ترتيبك بين الطلاب."
                        onClick={() => setActiveScreen('leaderboard')}
                        className="col-span-2"
                    />
                </div>
            </section>
            
            <MotivationalQuote />

        </div>
    );
};

export default HomeScreen;