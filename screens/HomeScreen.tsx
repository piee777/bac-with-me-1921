import React, { useState, useEffect } from 'react';
import { UserProfile, Subject, Screen } from '../types';
import { fetchUserProfile, fetchSubjects } from '../services/api';
import SunIcon from '../components/icons/SunIcon';
import MoonIcon from '../components/icons/MoonIcon';
import CircularProgressBar from '../components/CircularProgressBar';

interface HomeScreenProps {
    setActiveScreen: (screen: Screen) => void;
    theme: string;
    toggleTheme: () => void;
}

const StatCard: React.FC<{icon: string, value: number | string, label: string, color: string}> = ({ icon, value, label, color }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl w-full">
        <div className={`text-3xl mb-2 ${color}`}>{icon}</div>
        <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
    </div>
);

const FeatureCard: React.FC<{icon: string, title: string, description: string, onClick: () => void, className?: string}> = ({ icon, title, description, onClick, className = '' }) => (
    <button onClick={onClick} className={`bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-lg flex flex-col items-center text-center gap-2 transform hover:-translate-y-2 transition-transform duration-300 w-full ${className}`}>
        <div className="text-4xl">{icon}</div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{description}</p>
    </button>
);

const HomeScreen: React.FC<HomeScreenProps> = ({ setActiveScreen, theme, toggleTheme }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            <div className="text-teal-500 text-lg font-semibold">جاري التحميل...</div>
        </div>;
    }

    if (error || !user) {
        return <div className="flex justify-center items-center h-screen bg-slate-100 dark:bg-slate-950">{error || 'User not found.'}</div>;
    }

    const totalLessons = subjects.reduce((acc, subject) => acc + subject.lessons.length, 0);
    const completedLessons = subjects.reduce((acc, subject) => acc + subject.lessons.filter(l => l.completed).length, 0);
    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return (
        <div className="p-6 space-y-8">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                     <img src={user.avatarUrl} alt="User Avatar" className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 shadow-lg" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-600 dark:text-slate-300">مرحباً بعودتك،</h1>
                        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white -mt-1">{user.name}!</h2>
                    </div>
                </div>
                <button onClick={toggleTheme} className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-md">
                    {theme === 'light' ? <MoonIcon className="w-6 h-6 text-slate-700"/> : <SunIcon className="w-6 h-6 text-yellow-400"/>}
                </button>
            </header>

            <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                    <CircularProgressBar progress={progressPercentage} size={120} strokeWidth={12} />
                </div>
                <div className="flex-1 w-full">
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white text-center md:text-right">متابعة التقدم</h2>
                    <div className="grid grid-cols-3 gap-3">
                         <StatCard icon="💎" value={user.points} label="نقطة" color="text-amber-500" />
                         <StatCard icon="🔥" value={user.streak} label="أيام متتالية" color="text-red-500" />
                         <StatCard icon="🏆" value={user.badges.length} label="شارة" color="text-teal-500" />
                    </div>
                </div>
            </section>
            
            <section>
                <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">الأدوات</h2>
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

        </div>
    );
};

export default HomeScreen;