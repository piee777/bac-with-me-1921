import React, { useState, useEffect } from 'react';
import { UserProfile, Badge } from '../types';
import { fetchUserProfile } from '../services/api';
import CircularProgressBar from '../components/CircularProgressBar';

const BadgeCard: React.FC<{badge: Badge}> = ({ badge }) => (
    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl shadow-md flex items-center gap-4 border border-slate-200 dark:border-slate-700">
        <span className="text-4xl">{badge.icon}</span>
        <div>
            <h4 className="font-bold text-slate-800 dark:text-white">{badge.name}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">{badge.description}</p>
        </div>
    </div>
);

const StatCard: React.FC<{icon: string, value: number | string, label: string, color: string}> = ({ icon, value, label, color }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full">
        <div className={`text-3xl mb-2 ${color}`}>{icon}</div>
        <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
    </div>
);

const ProfileScreen: React.FC = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                setLoading(true);
                const userData = await fetchUserProfile();
                setUser(userData);
                setError(null);
            } catch (err) {
                setError('Failed to load user profile.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);
    
    // Mock performance data
    const performance = {
        strengths: ['الدوال العددية', 'الميكانيك'],
        weaknesses: ['الأعداد المركبة', 'الكهرباء'],
        completion: {
            math: 80,
            physics: 60,
            science: 30,
        }
    };
    
    if (loading) {
        return <div className="p-6 h-screen flex justify-center items-center">Loading Profile...</div>;
    }

    if (error || !user) {
        return <div className="p-6 h-screen flex justify-center items-center">{error || 'Could not load profile.'}</div>;
    }

    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col items-center">
                <div className="relative">
                    <img src={user.avatarUrl} alt="User Avatar" className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-xl" />
                    <span className="absolute bottom-0 right-0 bg-white dark:bg-slate-700 rounded-full p-1 shadow-md">
                        🏆
                    </span>
                </div>
                <div className="flex items-center gap-3 mt-4">
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">{user.name}</h1>
                    {user.name === 'bensadel' && (
                        <span className="text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 rounded-full shadow-lg">
                            المطور
                        </span>
                    )}
                </div>
                <p className="text-primary font-semibold bg-primary-palest dark:bg-primary-dark/20 dark:text-primary-light px-3 py-1 rounded-full mt-2">{user.stream}</p>
            </div>

            <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl">
                 <h2 className="text-xl font-bold mb-4 text-center text-slate-800 dark:text-white">إحصائياتي</h2>
                 <div className="grid grid-cols-2 gap-4 text-center">
                    <StatCard icon="💎" value={user.points} label="نقطة" color="text-secondary" />
                    <StatCard icon="🔥" value={user.streak} label="أيام متتالية" color="text-red-500" />
                </div>
            </section>

             <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">تقارير الأداء</h2>
                <div className="space-y-6">
                    <div>
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">ملخص الأداء</h3>
                        <div className="flex flex-wrap gap-2">
                             {performance.strengths.map(s => <span key={s} className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">✅ {s}</span>)}
                             {performance.weaknesses.map(s => <span key={s} className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">❌ {s}</span>)}
                        </div>
                    </div>
                     <div className="space-y-4 pt-2">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300">نسبة الإنجاز</h3>
                        <div className="grid grid-cols-3 gap-4">
                             <div className="flex flex-col items-center">
                                 <CircularProgressBar progress={performance.completion.math} size={80} strokeWidth={8} color="#3b82f6" />
                                 <span className="text-sm font-semibold mt-2">الرياضيات</span>
                             </div>
                             <div className="flex flex-col items-center">
                                 <CircularProgressBar progress={performance.completion.physics} size={80} strokeWidth={8} color="#8b5cf6" />
                                  <span className="text-sm font-semibold mt-2">الفيزياء</span>
                             </div>
                             <div className="flex flex-col items-center">
                                 <CircularProgressBar progress={performance.completion.science} size={80} strokeWidth={8} color="#22c55e" />
                                 <span className="text-sm font-semibold mt-2">العلوم</span>
                             </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">شاراتي المكتسبة</h2>
                <div className="space-y-4">
                    {user.badges.length > 0 ? 
                        user.badges.map(badge => <BadgeCard key={badge.id} badge={badge} />) :
                        <p className="text-center text-slate-500 dark:text-slate-400 py-4">لم تكتسب أي شارات بعد. أكمل الدروس والتحديات لتبدأ!</p>
                    }
                </div>
            </section>
        </div>
    );
};

export default ProfileScreen;