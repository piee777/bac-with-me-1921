import React, { useState, useEffect } from 'react';
import { fetchDailyChallenge } from '../services/api';
import { Exercise } from '../types';
import ProgressBar from '../components/ProgressBar';

const ExercisesScreen: React.FC = () => {
    const [challenge, setChallenge] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [submitted, setSubmitted] = useState<boolean>(false);
    
    const loadChallenge = async () => {
        try {
            setLoading(true);
            setChallenge(await fetchDailyChallenge());
            setCurrentQuestionIndex(0);
            setCorrectAnswers(0);
            setSelectedOption(null);
            setSubmitted(false);
            setError(null);
        } catch (err) {
            setError("Failed to load a new challenge.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadChallenge();
    }, []);

    if (loading) {
        return <div className="p-6 h-screen flex justify-center items-center">Loading Daily Challenge...</div>;
    }

    if (error) {
        return <div className="p-6 h-screen flex flex-col justify-center items-center text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={loadChallenge} className="bg-slate-800 text-white font-bold p-4 rounded-xl">Try Again</button>
        </div>;
    }

    const currentQuestion = challenge[currentQuestionIndex];
    const isFinished = currentQuestionIndex >= challenge.length;
    
    const handleOptionSelect = (option: string) => {
        if (submitted) return;
        setSelectedOption(option);
    };

    const handleSubmit = () => {
        if (!selectedOption) return;
        setSubmitted(true);
        if (selectedOption === currentQuestion.correctAnswer) {
            setCorrectAnswers(prev => prev + 1);
        }
    };
    
    const handleNext = () => {
        setSelectedOption(null);
        setSubmitted(false);
        setCurrentQuestionIndex(prev => prev + 1);
    };
    
    const getButtonClass = (option: string) => {
        if (!submitted) {
            return selectedOption === option 
                ? 'bg-teal-500 text-white border-teal-500' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-teal-400';
        }
        if (option === currentQuestion.correctAnswer) {
            return 'bg-green-500 text-white border-green-500';
        }
        if (option === selectedOption && option !== currentQuestion.correctAnswer) {
            return 'bg-red-500 text-white border-red-500';
        }
        return 'bg-white dark:bg-slate-800 opacity-60 border-slate-200 dark:border-slate-700';
    };

    if (isFinished) {
        return (
             <div className="p-6 h-screen flex flex-col items-center justify-center text-center">
                 <div className="text-6xl mb-4">🎉</div>
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">أحسنت!</h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg mb-6">
                    لقد أكملت التحدي اليومي بنجاح.
                </p>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg w-full max-w-sm">
                    <p className="text-xl font-bold">نتيجتك</p>
                    <p className="text-5xl font-extrabold text-teal-500 my-4">
                        {correctAnswers} <span className="text-3xl text-slate-500 dark:text-slate-400">/ {challenge.length}</span>
                    </p>
                    <button onClick={loadChallenge} className="w-full bg-slate-800 dark:bg-slate-700 text-white font-bold p-4 rounded-xl shadow-md hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors">
                        تحدٍ جديد
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">التحدي اليومي</h1>
            <ProgressBar value={((currentQuestionIndex) / challenge.length) * 100} color="bg-yellow-400" height="h-2"/>
            <p className="text-slate-500 dark:text-slate-400 my-4">السؤال {currentQuestionIndex + 1} من {challenge.length}</p>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold mb-6 text-center h-20 flex items-center justify-center">{currentQuestion.question}</h2>
                <div className="space-y-4">
                    {currentQuestion.type === 'mcq' && currentQuestion.options?.map((option) => (
                        <button key={option} onClick={() => handleOptionSelect(option)} className={`w-full text-lg font-semibold p-4 rounded-xl border-2 transition-all duration-200 ${getButtonClass(option)}`} disabled={submitted}>
                            {option}
                        </button>
                    ))}
                    {currentQuestion.type === 'true-false' && ['True', 'False'].map((option) => (
                         <button key={option} onClick={() => handleOptionSelect(option)} className={`w-full text-lg font-semibold p-4 rounded-xl border-2 transition-all duration-200 ${getButtonClass(option)}`} disabled={submitted}>
                            {option === 'True' ? 'صحيح' : 'خطأ'}
                        </button>
                    ))}
                </div>

                <div className="mt-8 h-28">
                { submitted && (
                    <div className="text-center p-4 rounded-lg mb-4 flex flex-col justify-center h-full" >
                        <p className={`text-xl font-bold mb-4 ${selectedOption === currentQuestion.correctAnswer ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                           {selectedOption === currentQuestion.correctAnswer ? 'إجابة صحيحة!' : 'إجابة خاطئة.'}
                        </p>
                         <button onClick={handleNext} className="w-full bg-slate-800 dark:bg-slate-700 text-white font-bold p-4 rounded-xl shadow-md hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors">
                            التالي
                        </button>
                    </div>
                )}
                { !submitted && (
                     <button onClick={handleSubmit} disabled={!selectedOption} className="w-full bg-blue-600 text-white font-bold p-4 rounded-xl shadow-md hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                        تأكيد الإجابة
                    </button>
                )}
                </div>
            </div>
        </div>
    );
};

export default ExercisesScreen;