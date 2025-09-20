import React, { useState, useEffect } from 'react';
import { UserProfile, Badge } from '../types';
import { fetchUserProfile } from '../services/api';
import { supabase } from '../services/supabaseClient';
import ProgressBar from '../components/ProgressBar';

const BadgeCard: React.FC<{badge: Badge}> = ({ badge }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow flex items-center gap-4">
        <span className="text-4xl">{badge.icon}</span>
        <div>
            <h4 className="font-bold text-slate-800 dark:text-white">{badge.name}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">{badge.description}</p>
        </div>
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
    
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
        }
    };

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
        <div className="p-6">
            <div className="flex flex-col items-center mb-8">
                <img src={user.avatarUrl} alt="User Avatar" className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-700 shadow-xl mb-4" />
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">{user.name}</h1>
                <p className="text-slate-500 dark:text-slate-400">طالب بكالوريا طموح</p>
            </div>

            <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg mb-8">
                 <h2 className="text-xl font-bold mb-4 text-center">إحصائياتي</h2>
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
                </div>
            </section>

             <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg mb-8">
                <h2 className="text-xl font-bold mb-4">تقارير الأداء</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-bold text-green-600 dark:text-green-400 mb-2">✅ نقاط القوة</h3>
                        <div className="flex flex-wrap gap-2">
                            {performance.strengths.map(s => <span key={s} className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-sm font-semibold px-3 py-1 rounded-full">{s}</span>)}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-bold text-red-600 dark:text-red-400 mb-2">❌ نقاط الضعف</h3>
                        <div className="flex flex-wrap gap-2">
                            {performance.weaknesses.map(s => <span key={s} className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 text-sm font-semibold px-3 py-1 rounded-full">{s}</span>)}
                        </div>
                    </div>
                     <div className="space-y-3 pt-2">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200">نسبة الإنجاز</h3>
                        <div>
                            <span className="text-sm font-semibold">الرياضيات</span>
                            <ProgressBar value={performance.completion.math} color="bg-blue-500" />
                        </div>
                         <div>
                            <span className="text-sm font-semibold">الفيزياء</span>
                            <ProgressBar value={performance.completion.physics} color="bg-purple-500" />
                        </div>
                         <div>
                            <span className="text-sm font-semibold">العلوم</span>
                            <ProgressBar value={performance.completion.science} color="bg-green-500" />
                        </div>
                    </div>
                    <button onClick={() => alert('سيتم ربط خطة المراجعة مع تقويم جوجل قريباً!')} className="w-full mt-4 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.56,3.34a1,1,0,0,0-1,0L17.1,5.55A9,9,0,0,0,3,12a9.23,9.23,0,0,0,.5,3.23l-1.2,1.2A1,1,0,0,0,3,18.12l1.22-1.22A9,9,0,0,0,12,21a9,9,0,0,0,8.45-6.84l2.21,2.21a1,1,0,0,0,.71.29,1,1,0,0,0,.71-1.71ZM12,19a7,7,0,0,1-6.42-4.44l.2-.2a1,1,0,0,0,0-1.41l-1.1-1.1A7,7,0,0,1,12,5a7,7,0,0,1,6.85,5.55l-2.13,2.13A3,3,0,0,0,12,11a3,3,0,0,0-3,3,1,1,0,0,0,1,1H12a1,1,0,0,0,0-2h-.5A1,1,0,0,1,12,12a1,1,0,0,1,1-1,1,1,0,0,0,.71-.29l3.41-3.42A7,7,0,0,1,12,19Z"/></svg>
                        مزامنة خطة المراجعة مع تقويم جوجل
                    </button>
                </div>
            </section>
            
            <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">شاراتي المكتسبة</h2>
                <div className="space-y-4">
                    {user.badges.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
                </div>
            </section>

             <div className="mt-8 text-center">
                <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-red-600 transition-colors"
                >
                    تسجيل الخروج
                </button>
            </div>
        </div>
    );
};

export default ProfileScreen;
