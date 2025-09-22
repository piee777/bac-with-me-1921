import React, { useState, useEffect, useRef } from 'react';
import { Challenge, ChallengeLobby, ChallengeParticipant, Exercise } from '../types';
import * as api from '../services/api';
import { RealtimeChannel } from '@supabase/supabase-js';

const ChallengesScreen: React.FC = () => {
    const [view, setView] = useState<'list' | 'lobby' | 'playing' | 'results'>('list');
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [lobby, setLobby] = useState<ChallengeLobby | null>(null);
    const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
    const [questions, setQuestions] = useState<Exercise[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [results, setResults] = useState<ChallengeParticipant[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const channelRef = useRef<RealtimeChannel | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const currentUsername = localStorage.getItem('userName');
    
    const cleanup = () => {
        if (channelRef.current) {
            channelRef.current.unsubscribe();
            channelRef.current = null;
        }
        if(timerRef.current) clearInterval(timerRef.current);
    };

    useEffect(() => {
        return () => cleanup(); // Cleanup on unmount
    }, []);

    const loadChallenges = async () => {
        try {
            setLoading(true);
            const data = await api.fetchChallenges();
            setChallenges(data);
        } catch (err) {
            setError('فشل تحميل التحديات.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(view === 'list') {
            cleanup();
            loadChallenges();
        }
    }, [view]);

    const handleSelectChallenge = async (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        try {
            const newLobby = await api.createChallengeLobby(challenge.id);
            setLobby(newLobby);
            subscribeToLobby(newLobby.id);
            setView('lobby');
        } catch (err) {
            setError('فشل في إنشاء غرفة التحدي.');
        }
    };

    const subscribeToLobby = (lobbyId: string) => {
        const channel = api.subscribeToLobby(
            lobbyId,
            (newParticipants) => setParticipants(newParticipants),
            async (status) => {
                if (status === 'running') {
                    const challenge = selectedChallenge!;
                    const fetchedQuestions = await api.fetchChallengeExercises(challenge.subject_id, challenge.question_count);
                    setQuestions(fetchedQuestions);
                    setTimeLeft(challenge.time_limit_seconds);
                    setView('playing');
                } else if (status === 'finished') {
                    const finalResults = await api.fetchChallengeResults(lobbyId);
                    setResults(finalResults);
                    setView('results');
                }
            }
        );
        channelRef.current = channel;
    };
    
    const handleStartGame = () => {
        if (lobby && channelRef.current) {
            api.updateLobbyStatus(channelRef.current, 'running');
        }
    };

    useEffect(() => {
        if (view === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (view === 'playing' && timeLeft === 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            finishChallenge();
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [view, timeLeft]);

    const handleAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            setScore(prev => prev + 1);
        }
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishChallenge();
        }
    };
    
    const finishChallenge = async () => {
        if (view !== 'playing' || !lobby) return;
        if (timerRef.current) clearInterval(timerRef.current);
        const finishTime = selectedChallenge!.time_limit_seconds - timeLeft;
        await api.submitChallengeResult(lobby.id, score, finishTime);
        api.updateLobbyStatus(channelRef.current, 'finished');
    };
    
    const renderList = () => (
        <div className="p-6">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-6">🏆 التحديات</h1>
            {loading && <p>جاري تحميل التحديات...</p>}
            {error && <p className="text-red-500">{error}</p>}
            <div className="space-y-4">
                {challenges.map(c => (
                    <button key={c.id} onClick={() => handleSelectChallenge(c)} className="w-full text-right bg-white dark:bg-slate-800 p-5 rounded-xl shadow hover:shadow-lg transition-shadow">
                        <h2 className="font-bold text-lg text-teal-600 dark:text-teal-400">{c.title}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{c.description}</p>
                        <div className="text-sm mt-2 text-slate-400">{c.question_count} أسئلة - {c.time_limit_seconds / 60} دقائق</div>
                    </button>
                ))}
            </div>
        </div>
    );
    
    const renderLobby = () => (
        <div className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-2">{selectedChallenge?.title}</h1>
            <p className="text-slate-500 mb-6">في انتظار انضمام اللاعبين...</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-h-[100px]">
                {participants.map(p => (
                    <div key={p.user_name} className="flex flex-col items-center animate-fade-in">
                        <img src={p.avatar_url} className="w-16 h-16 rounded-full border-2 border-teal-400" />
                        <span className="font-semibold mt-2">{p.user_name}</span>
                        {p.user_name === 'bensadel' && (
                            <span className="text-[10px] mt-1 font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 rounded-full shadow-sm">
                                المطور
                            </span>
                        )}
                    </div>
                ))}
            </div>
            {lobby?.host_username === currentUsername && (
                <button onClick={handleStartGame} className="mt-8 bg-green-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg">
                    ابدأ التحدي
                </button>
            )}
             <button onClick={() => setView('list')} className="mt-4 text-slate-500">العودة</button>
        </div>
    );

    const renderPlaying = () => {
        const question = questions[currentQuestionIndex];
        return (
            <div className="p-6">
                 <div className="flex justify-between items-center mb-4">
                    <span className="font-bold">السؤال {currentQuestionIndex + 1}/{questions.length}</span>
                    <span className="font-bold text-red-500">{Math.floor(timeLeft/60)}:{('0' + timeLeft%60).slice(-2)}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-8">
                     <div className="bg-teal-500 h-2.5 rounded-full" style={{width: `${((currentQuestionIndex + 1)/questions.length)*100}%`}}></div>
                </div>
                <h2 className="text-xl font-bold mb-6 text-center">{question.question}</h2>
                <div className="space-y-4">
                    {question.options.map(opt => (
                        <button key={opt.text} onClick={() => handleAnswer(opt.is_correct)} className="w-full text-lg font-semibold p-4 rounded-xl border-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-teal-400">
                            {opt.text}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderResults = () => {
        const sortedResults = [...results].sort((a, b) => b.score - a.score || (a.finish_time_seconds ?? 999) - (b.finish_time_seconds ?? 999));
        return (
            <div className="p-6 text-center">
                <h1 className="text-3xl font-extrabold mb-4">✨ انتهى التحدي!</h1>
                <div className="space-y-3">
                    {sortedResults.map((res, index) => {
                        const isCreator = res.user_name === 'bensadel';
                        return (
                             <div key={res.user_name} className={`flex items-center gap-4 p-3 rounded-lg shadow-md ${isCreator ? 'bg-amber-50 dark:bg-amber-900/40' : 'bg-white dark:bg-slate-800'}`}>
                                <span className="font-bold text-lg w-8">{index === 0 ? '🏆' : index + 1}</span>
                                <img src={res.avatar_url} className="w-12 h-12 rounded-full" />
                                <div className="flex-1 text-right flex items-center justify-end gap-2">
                                    <span className="font-semibold">{res.user_name}</span>
                                    {isCreator && <span className="text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded-full shadow-sm">المطور</span>}
                                </div>
                                <span className="font-bold text-amber-500">{res.score} pts</span>
                            </div>
                        );
                    })}
                </div>
                 <button onClick={() => setView('list')} className="mt-8 bg-slate-800 text-white font-bold py-3 px-8 rounded-lg shadow-lg">
                    العودة للتحديات
                </button>
            </div>
        )
    };
    
    switch (view) {
        case 'lobby': return renderLobby();
        case 'playing': return renderPlaying();
        case 'results': return renderResults();
        case 'list':
        default: return renderList();
    }
};

export default ChallengesScreen;