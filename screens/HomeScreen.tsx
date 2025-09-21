import React, { useState, useEffect } from 'react';
import { UserProfile, Subject, Screen } from '../types';
import { fetchUserProfile, fetchSubjects } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import SunIcon from '../components/icons/SunIcon';
import MoonIcon from '../components/icons/MoonIcon';

interface HomeScreenProps {
    setActiveScreen: (screen: Screen) => void;
    theme: string;
    toggleTheme: () => void;
}

const FeatureCard: React.FC<{icon: string, title: string, description: string, onClick: () => void, className?: string}> = ({ icon, title, description, onClick, className = '' }) => (
    <button onClick={onClick} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg flex flex-col items-center text-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer transform hover:scale-105 w-full ${className}`}>
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
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (error || !user) {
        return <div className="flex justify-center items-center h-screen">{error || 'User not found.'}</div>;
    }

    const totalLessons = subjects.reduce((acc, subject) => acc + subject.lessons.length, 0);
    const completedLessons = subjects.reduce((acc, subject) => acc + subject.lessons.filter(l => l.completed).length, 0);
    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return (
        <div className="p-6">
            <header className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">مرحباً، {user.name}!</h1>
                    <p className="text-slate-500 dark:text-slate-400">لنجعل اليوم يوماً مثمراً.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-md">
                        {theme === 'light' ? <MoonIcon className="w-6 h-6 text-slate-700"/> : <SunIcon className="w-6 h-6 text-yellow-400"/>}
                    </button>
                    <img src={user.avatarUrl} alt="User Avatar" className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-700 shadow-lg" />
                </div>
            </header>

            <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg mb-8">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">متابعة التقدم</h2>
                <div className="flex items-center justify-around text-center">
                    <div className="flex flex-col items-center">
                        <span className="text-3xl font-bold text-amber-500">💎</span>
                        <span className="text-lg font-bold">{user.points}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">نقطة</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-3xl font-bold text-red-500">🔥</span>
                        <span className="text-lg font-bold">{user.streak}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">أيام متتالية</span>
                    </div>
                     <div className="flex flex-col items-center">
                        <span className="text-3xl font-bold text-teal-500">🏆</span>
                        <span className="text-lg font-bold">{user.badges.length}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">شارة</span>
                    </div>
                </div>
                 <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">التقدم العام</span>
                        <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{Math.round(progressPercentage)}%</span>
                    </div>
                    <ProgressBar value={progressPercentage} color="bg-teal-500" height="h-4"/>
                </div>
            </section>
            
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">متابعة الدرس</h2>
                <div onClick={() => setActiveScreen('lessons')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex items-center gap-6 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <div className="text-5xl">📊</div>
                    <div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">الرياضيات</span>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">الأعداد المركبة</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">استكشاف عالم الأعداد المركبة وخواصها.</p>
                    </div>
                    <div className="ms-auto">
                        <div className="bg-teal-500 text-white font-bold py-3 px-5 rounded-full shadow-md">
                            أكمل
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold mb-4">أدوات المراجعة</h2>
                <div className="grid grid-cols-2 gap-4">
                   <FeatureCard
                        icon="⚡️"
                        title="مراجعة سريعة"
                        description="بطاقات للمصطلحات والقوانين."
                        onClick={() => setActiveScreen('quick-review')}
                    />
                    <FeatureCard
                        icon="📝"
                        title="امتحان تجريبي"
                        description="اختبر نفسك في ظروف البكالوريا."
                        onClick={() => setActiveScreen('exam')}
                    />
                    <FeatureCard
                        icon="🤖"
                        title="صانع الامتحانات"
                        description="أنشئ امتحاناً مخصصاً بالذكاء الاصطناعي."
                        onClick={() => setActiveScreen('exam-generator')}
                    />
                    <FeatureCard
                        icon="🗓️"
                        title="مولد خطة المراجعة"
                        description="أنشئ جدول مراجعة ذكي."
                        onClick={() => setActiveScreen('study-plan')}
                    />
                     <FeatureCard
                        icon="📚"
                        title="مكتبة الامتحانات"
                        description="بكالوريات سابقة مع حلولها."
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