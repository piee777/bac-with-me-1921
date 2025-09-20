import React, { useState, useEffect } from 'react';
import { fetchExamQuestions } from '../services/api';
import { Exercise, Screen } from '../types';

interface ExamScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const EXAM_DURATION = 15 * 60; // 15 minutes in seconds

const ExamScreen: React.FC<ExamScreenProps> = ({ setActiveScreen }) => {
    const [examState, setExamState] = useState<'start' | 'running' | 'finished'>('start');
    const [questions, setQuestions] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{[key: string]: string}>({});
    const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const loadQuestions = async () => {
            try {
                setLoading(true);
                const data = await fetchExamQuestions();
                setQuestions(data);
                setError(null);
            } catch (err) {
                setError("Failed to load exam questions.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadQuestions();
    }, []);

    useEffect(() => {
        if (examState !== 'running') return;
        if (timeLeft <= 0) {
            finishExam();
            return;
        }
        const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timerId);
    }, [examState, timeLeft]);

    const handleAnswerSelect = (questionId: string, answer: string) => {
        setAnswers(prev => ({...prev, [questionId]: answer}));
    };

    const finishExam = () => {
        let finalScore = 0;
        questions.forEach(q => {
            if(answers[q.id] === q.correctAnswer) finalScore++;
        });
        setScore(finalScore);
        setExamState('finished');
    };
    
    const restartExam = () => {
        setAnswers({});
        setCurrentQuestionIndex(0);
        setTimeLeft(EXAM_DURATION);
        setScore(0);
        setExamState('start');
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return <div className="p-6 h-screen flex justify-center items-center">Preparing Exam...</div>;
    }

    if (error) {
        return <div className="p-6 h-screen flex justify-center items-center text-red-500">{error}</div>;
    }

    if (examState === 'start') {
        return (
            <div className="p-6 h-screen flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">📝</div>
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">امتحان تجريبي في الرياضيات</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
                    سيتم اختبارك في {questions.length} أسئلة لمدة {EXAM_DURATION / 60} دقيقة. هل أنت مستعد؟
                </p>
                <div className="w-full max-w-xs flex flex-col gap-3">
                    <button onClick={() => setExamState('running')} className="w-full bg-teal-500 text-white font-bold p-4 rounded-xl shadow-md hover:bg-teal-600 transition-colors">
                        ابدأ الامتحان
                    </button>
                    <button onClick={() => setActiveScreen('home')} className="w-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white font-bold p-4 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                        العودة
                    </button>
                </div>
            </div>
        );
    }
    
    if (examState === 'finished') {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-4 text-center">نتيجة الامتحان</h1>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg w-full max-w-md mx-auto text-center mb-6">
                     <p className="text-xl font-bold">نتيجتك النهائية</p>
                     <p className="text-6xl font-extrabold text-teal-500 my-4">
                        {score} <span className="text-4xl text-slate-500 dark:text-slate-400">/ {questions.length}</span>
                    </p>
                </div>
                
                <div className="max-w-md mx-auto">
                    <h2 className="text-xl font-bold mb-3">مراجعة الأخطاء:</h2>
                     <div className="space-y-4">
                        {questions.filter(q => answers[q.id] !== q.correctAnswer).length === 0 
                         ? <p className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/50 p-4 rounded-lg text-center font-bold">رائع! لم ترتكب أي أخطاء.</p>
                         : questions.filter(q => answers[q.id] !== q.correctAnswer).map(q => (
                            <div key={q.id} className="bg-red-50 dark:bg-red-900/50 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                <p className="font-bold mb-2">{q.question}</p>
                                <p className="text-sm"><span className="font-semibold text-red-600 dark:text-red-400">إجابتك:</span> {answers[q.id] ? (q.type === 'true-false' ? (answers[q.id] === 'True' ? 'صحيح' : 'خطأ') : answers[q.id]) : 'لم تجب'}</p>
                                <p className="text-sm"><span className="font-semibold text-green-600 dark:text-green-400">الإجابة الصحيحة:</span> {q.type === 'true-false' ? (q.correctAnswer === 'True' ? 'صحيح' : 'خطأ') : q.correctAnswer}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-md mx-auto flex flex-col gap-3 mt-8">
                    <button onClick={restartExam} className="w-full bg-slate-800 dark:bg-slate-700 text-white font-bold p-4 rounded-xl shadow-md hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors">
                        إعادة الامتحان
                    </button>
                    <button onClick={() => setActiveScreen('home')} className="w-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white font-bold p-4 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                        العودة للرئيسية
                    </button>
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex];
    return (
        <div className="p-6">
            <header className="flex justify-between items-center mb-4">
                <div className="text-lg font-bold text-slate-700 dark:text-slate-300">السؤال {currentQuestionIndex + 1}/{questions.length}</div>
                <div className="text-lg font-bold text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-400 px-3 py-1 rounded-full">{formatTime(timeLeft)}</div>
            </header>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-8">
                 <div className="bg-teal-500 h-2.5 rounded-full" style={{width: `${((currentQuestionIndex + 1)/questions.length)*100}%`}}></div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                 <h2 className="text-xl font-bold mb-6 text-center h-24 flex items-center justify-center">{currentQuestion.question}</h2>
                 <div className="space-y-4">
                     {currentQuestion.type === 'mcq' && currentQuestion.options?.map(option => (
                        <button key={option} onClick={() => handleAnswerSelect(currentQuestion.id, option)} className={`w-full text-lg font-semibold p-4 rounded-xl border-2 transition-all ${answers[currentQuestion.id] === option ? 'bg-teal-500 text-white border-teal-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-teal-400'}`}>
                           {option}
                        </button>
                     ))}
                      {currentQuestion.type === 'true-false' && ['True', 'False'].map(option => (
                        <button key={option} onClick={() => handleAnswerSelect(currentQuestion.id, option)} className={`w-full text-lg font-semibold p-4 rounded-xl border-2 transition-all ${answers[currentQuestion.id] === option ? 'bg-teal-500 text-white border-teal-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-teal-400'}`}>
                           {option === 'True' ? 'صحيح' : 'خطأ'}
                        </button>
                      ))}
                 </div>
            </div>

            <div className="flex justify-between mt-8">
                <button onClick={() => setCurrentQuestionIndex(p => Math.max(0, p-1))} disabled={currentQuestionIndex === 0} className="bg-white dark:bg-slate-700 font-bold py-3 px-6 rounded-lg shadow disabled:opacity-50">السابق</button>
                {currentQuestionIndex < questions.length - 1 ? (
                    <button onClick={() => setCurrentQuestionIndex(p => Math.min(questions.length-1, p+1))} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow hover:bg-blue-700">التالي</button>
                ) : (
                    <button onClick={finishExam} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow hover:bg-green-700">إنهاء الامتحان</button>
                )}
            </div>
        </div>
    );
};

export default ExamScreen;