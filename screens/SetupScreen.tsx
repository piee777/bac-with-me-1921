import React, { useState, useRef } from 'react';
import { academicStreams } from '../constants';
import { upsertUserProfileAndStats } from '../services/api';

interface SetupScreenProps {
  onSetupComplete: () => void;
}

// Helper function to resize and compress the image
const processImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 128;
        const MAX_HEIGHT = 128;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get the data URL with compression for performance
        resolve(canvas.toDataURL('image/jpeg', 0.8)); // 80% quality JPEG
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete }) => {
    const [name, setName] = useState('');
    const [selectedStream, setSelectedStream] = useState(academicStreams[0]);
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleStart = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('يرجى إدخال اسمك.');
            return;
        }
        if (!selectedAvatar) {
            setError('يرجى رفع صورة شخصية.');
            return;
        }
        
        setLoading(true);
        setError(null); // Clear error on successful start
        
        // Save user details to localStorage first for immediate UI update
        localStorage.setItem('userName', trimmedName);
        localStorage.setItem('userStream', selectedStream);
        localStorage.setItem('userAvatarUrl', selectedAvatar);
        localStorage.setItem('isSetupComplete', 'true');
        
        // Then, save the complete profile to the backend
        try {
            await upsertUserProfileAndStats(trimmedName, selectedAvatar, selectedStream);
        } catch (e) {
            // Log the error but continue, as the app can function with local data as a fallback.
            console.error("Failed to save user profile to backend:", e);
        }

        // Trigger the app to switch to the main view
        onSetupComplete();
    };
    
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            try {
                setLoading(true);
                const processedDataUrl = await processImage(file);
                setSelectedAvatar(processedDataUrl);
                setError(null);
            } catch (error) {
                console.error("Error processing image:", error);
                setError("حدث خطأ أثناء معالجة الصورة.");
            } finally {
                setLoading(false);
            }
        } else if (file) {
            setError("يرجى اختيار ملف صورة صالح.");
        }
        // Clear the input value to allow re-uploading the same file
        if(event.target) {
          event.target.value = '';
        }
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
                        <label className="font-bold block mb-3 text-center text-lg text-slate-700 dark:text-slate-200">أضف صورتك الشخصية</label>
                        <div className="flex justify-center">
                             <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-24 h-24 rounded-full border-4 transition-all duration-200 flex items-center justify-center bg-slate-200 dark:bg-slate-700 overflow-hidden ${selectedAvatar ? 'border-teal-500' : 'border-dashed border-slate-400 hover:border-teal-400'}`}
                                aria-label="رفع صورة خاصة"
                            >
                                {selectedAvatar ? (
                                    <img src={selectedAvatar} alt="Uploaded Avatar Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                )}
                            </button>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
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