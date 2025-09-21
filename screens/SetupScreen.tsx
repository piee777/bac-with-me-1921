import React, { useState } from 'react';
import { avatars, academicStreams } from '../constants';
import { createUserStats } from '../services/api';

interface SetupScreenProps {
  onSetupComplete: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete }) => {
    const [name, setName] = useState('');
    const [selectedStream, setSelectedStream] = useState(academicStreams[0]);
    const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const handleStart = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('يرجى إدخال اسمك.');
            return;
        }
        
        setLoading(true);
        
        // Save user details to localStorage
        localStorage.setItem('userName', trimmedName);
        localStorage.setItem('userStream', selectedStream);
        localStorage.setItem('userAvatarUrl', selectedAvatar);
        localStorage.setItem('isSetupComplete', 'true');
        
        // Initialize user stats in the backend
        try {
            await createUserStats(trimmedName);
        } catch (e) {
            // Log the error but continue, as the app can function with local data as a fallback.
            console.error("Failed to initialize user stats in the backend:", e);
        }

        // Trigger the app to switch to the main view
        onSetupComplete();
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4 animate-fade-in">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white">
                        مرحباً بك في Bac With Me
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        لنقم بإعداد ملفك الشخصي لنبدأ رحلتنا.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-8 space-y-6">
                    {/* Avatar Selection */}
                    <div>
                        <label className="font-bold block mb-3 text-center text-lg text-slate-700 dark:text-slate-200">اختر صورتك الرمزية</label>
                        <div className="flex justify-center flex-wrap gap-4">
                            {avatars.map((avatarUrl) => (
                                <button
                                    key={avatarUrl}
                                    onClick={() => setSelectedAvatar(avatarUrl)}
                                    className={`w-16 h-16 rounded-full overflow-hidden border-4 transition-all duration-200 ${selectedAvatar === avatarUrl ? 'border-teal-500 scale-110' : 'border-transparent hover:border-teal-300'}`}
                                >
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Name Input */}
                    <div>
                         <label htmlFor="name" className="font-bold block mb-2 text-slate-700 dark:text-slate-200">ما هو اسمك؟</label>
                         <input
                            id="name"
                            type="text"
                            placeholder="اكتب اسمك هنا..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-4 text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
                         />
                    </div>
                    
                    {/* Stream Selection */}
                    <div>
                         <label htmlFor="stream" className="font-bold block mb-2 text-slate-700 dark:text-slate-200">ما هي شعبتك؟</label>
                         <select
                            id="stream"
                            value={selectedStream}
                            onChange={(e) => setSelectedStream(e.target.value)}
                            className="w-full p-4 text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
                         >
                            {academicStreams.map(stream => (
                                <option key={stream} value={stream}>{stream}</option>
                            ))}
                         </select>
                    </div>

                    {error && <p className="text-center text-red-500 font-semibold">{error}</p>}
                    
                    {/* Start Button */}
                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="w-full bg-teal-500 text-white font-bold p-4 rounded-lg shadow-lg hover:bg-teal-600 transition-colors disabled:bg-teal-300 flex items-center justify-center mt-4"
                    >
                        {loading ? '...جاري الإعداد' : 'هيا بنا نبدأ!'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetupScreen;