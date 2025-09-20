import React, { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../services/api';
import { LeaderboardUser, Screen } from '../types';

interface LeaderboardScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ setActiveScreen }) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadLeaderboard = async () => {
            try {
                setLoading(true);
                const data = await fetchLeaderboard();
                setLeaderboard(data);
                setError(null);
            } catch (err) {
                setError("Failed to load leaderboard.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadLeaderboard();
    }, []);

    return (
        <div className="p-6">
            <header className="flex items-center justify-between mb-6">
                 <button onClick={() => setActiveScreen('home')} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-2">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 -scale-x-100"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>
                </button>
                 <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">🥇 لوحة الصدارة</h1>
                 <div className="w-10"></div>
            </header>

            {loading && <div className="text-center">Loading Leaderboard...</div>}
            {error && <div className="text-center text-red-500">{error}</div>}
            {!loading && !error && (
                <div className="space-y-4">
                    {leaderboard.map((user, index) => (
                        <div key={user.id} className={`p-4 rounded-xl flex items-center gap-4 shadow ${user.name === 'عادل' ? 'bg-teal-100 dark:bg-teal-900/50 border-2 border-teal-500' : 'bg-white dark:bg-slate-800'}`}>
                            <span className="text-xl font-bold w-8 text-center text-slate-500 dark:text-slate-400">
                                {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : user.rank}
                            </span>
                            <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full" />
                            <span className="font-bold flex-1 text-slate-800 dark:text-white">{user.name}</span>
                            <span className="font-bold text-amber-500">{user.score} نقطة</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeaderboardScreen;