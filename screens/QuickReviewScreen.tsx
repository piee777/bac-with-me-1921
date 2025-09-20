import React, { useState, useEffect } from 'react';
import { fetchFlashcards } from '../services/api';
import { Screen, Flashcard } from '../types';

interface QuickReviewScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const QuickReviewScreen: React.FC<QuickReviewScreenProps> = ({ setActiveScreen }) => {
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    
    useEffect(() => {
        const loadFlashcards = async () => {
            try {
                setLoading(true);
                const data = await fetchFlashcards();
                setFlashcards(data);
                setError(null);
            } catch (err) {
                setError("Failed to load flashcards.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadFlashcards();
    }, []);

    if (loading) {
        return <div className="p-6 h-screen flex justify-center items-center">Loading Flashcards...</div>;
    }

    if (error || flashcards.length === 0) {
        return <div className="p-6 h-screen flex justify-center items-center">{error || "No flashcards available."}</div>;
    }

    const card = flashcards[currentIndex];

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % flashcards.length);
        }, 150)
    };

    const handlePrev = () => {
        setIsFlipped(false);
         setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
        }, 150)
    };
    
    return (
        <div className="p-6 h-screen flex flex-col">
            <header className="flex items-center justify-between mb-6">
                <button onClick={() => setActiveScreen('home')} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-2">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 -scale-x-100"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>
                </button>
                 <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">مراجعة سريعة</h1>
                 <div className="w-10"></div>
            </header>
            
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-md h-64" style={{ perspective: '1000px' }}>
                    <button 
                        className={`relative w-full h-full transition-transform duration-500 rounded-2xl`} 
                        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                        onClick={() => setIsFlipped(!isFlipped)}
                        aria-live="polite"
                    >
                        {/* Front */}
                        <div className="absolute w-full h-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center p-6" style={{ backfaceVisibility: 'hidden' }}>
                            <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white">{card.term}</h2>
                        </div>
                        {/* Back */}
                        <div className="absolute w-full h-full bg-teal-500 text-white rounded-2xl shadow-xl flex items-center justify-center p-6" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            <p className="text-lg text-center">{card.definition}</p>
                        </div>
                    </button>
                </div>

                <p className="text-slate-500 dark:text-slate-400 mt-4">انقر على البطاقة لإظهار التعريف</p>
                
                 {/* Controls */}
                <div className="flex items-center justify-center gap-8 mt-8">
                     <button onClick={handlePrev} className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-md hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="البطاقة السابقة">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                     </button>
                     <span className="font-bold text-lg tabular-nums">{currentIndex + 1} / {flashcards.length}</span>
                     <button onClick={handleNext} className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-md hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="البطاقة التالية">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                     </button>
                </div>
            </div>
        </div>
    );
};

export default QuickReviewScreen;