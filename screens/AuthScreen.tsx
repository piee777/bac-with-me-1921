import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { avatars, academicStreams } from '../constants';
import { fetchPublicProfileByUsername } from '../services/api';

const LoadingSpinner: React.FC<{className?: string}> = ({ className = 'h-5 w-5' }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const InputField: React.FC<{
    id: string;
    type?: 'text' | 'password';
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    // FIX: Replaced `JSX.Element` with `React.ReactElement` to resolve TypeScript error.
    icon: React.ReactElement;
    isPassword?: boolean;
}> = ({ id, type = 'text', placeholder, value, onChange, icon, isPassword = false }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const inputType = isPassword ? (isPasswordVisible ? 'text' : 'password') : type;

    return (
        <div className="relative">
            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">{icon}</span>
            {isPassword && (
                <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10"
                    aria-label={isPasswordVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                    {isPasswordVisible ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    )}
                </button>
            )}
            <input
                id={id}
                type={inputType}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required
                autoCapitalize="none"
                className="w-full p-4 pr-12 text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
            />
        </div>
    );
};

const translateSupabaseError = (message: string): string => {
    const lowerCaseMessage = message.toLowerCase();
    if (lowerCaseMessage.includes('invalid login credentials')) return 'اسم المستخدم أو كلمة المرور غير صحيحة.';
    if (lowerCaseMessage.includes('user already registered') || lowerCaseMessage.includes('unique constraint')) return 'اسم المستخدم هذا مسجل بالفعل.';
    if (lowerCaseMessage.includes('password should be at least')) return 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.';
    return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
};

const usernameToSafeEmail = (username: string): string => {
    let hex = '';
    for (let i = 0; i < username.length; i++) {
        const charCode = username.charCodeAt(i).toString(16);
        hex += charCode.padStart(2, '0');
    }
    return `${hex}@bacwithme.user`;
};

const AuthScreen: React.FC = () => {
    const [step, setStep] = useState<'initial' | 'enterPassword' | 'completeProfile'>('initial');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedStream, setSelectedStream] = useState(academicStreams[0]);
    const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profileForLogin, setProfileForLogin] = useState<{ avatarUrl: string } | null>(null);

    const passwordIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
    const userIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;

    const handleBack = () => {
        setError(null);
        setPassword('');
        setConfirmPassword('');
        setProfileForLogin(null);
        setStep('initial');
    };

    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanUsername = username.trim();
        if (!cleanUsername) {
            setError('يرجى إدخال اسم مستخدم.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const profile = await fetchPublicProfileByUsername(cleanUsername);
            if (profile) {
                setProfileForLogin(profile);
                setStep('enterPassword');
            } else {
                setStep('completeProfile');
            }
        } catch (err) {
            setError('حدث خطأ أثناء التحقق من اسم المستخدم.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({
            email: usernameToSafeEmail(username.trim()),
            password,
        });
        if (error) setError(translateSupabaseError(error.message));
        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const cleanUsername = username.trim();

        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            setLoading(false);
            return;
        }

        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email: usernameToSafeEmail(cleanUsername),
            password: password,
        });

        if (signUpError) {
            setError(translateSupabaseError(signUpError.message));
            setLoading(false);
            return;
        }
        
        if (!user) {
            setError('فشل إنشاء المستخدم. يرجى المحاولة مرة أخرى.');
            setLoading(false);
            return;
        }

        const { error: profileError } = await supabase.from('profiles').insert({
            id: user.id,
            name: cleanUsername,
            avatar_url: selectedAvatar,
            stream: selectedStream,
        });

        if (profileError) {
            setError('نجح إنشاء الحساب ولكن فشل إنشاء الملف الشخصي.');
            // Here you might want to inform the user or attempt a cleanup.
        }
        // onAuthStateChange will handle successful navigation.
        setLoading(false);
    };

    const renderInitialStep = () => (
        <form onSubmit={handleContinue} className="space-y-6">
            <InputField id="username" placeholder="اسم المستخدم" value={username} onChange={setUsername} icon={userIcon} />
            <button type="submit" disabled={loading} className="w-full bg-teal-500 text-white font-bold p-4 rounded-lg shadow-lg hover:bg-teal-600 transition-colors disabled:bg-teal-300 flex items-center justify-center">
                {loading ? <LoadingSpinner /> : 'متابعة'}
            </button>
        </form>
    );
    
    const renderLoginStep = () => (
        <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex flex-col items-center text-center">
                <img src={profileForLogin?.avatarUrl} alt="User Avatar" className="w-20 h-20 rounded-full mb-4 border-4 border-slate-200 dark:border-slate-700"/>
                <p className="font-bold text-xl text-slate-800 dark:text-white">مرحباً بعودتك، {username}!</p>
            </div>
            <InputField id="password" placeholder="كلمة المرور" value={password} onChange={setPassword} icon={passwordIcon} isPassword={true} />
            <div className="space-y-3">
                <button type="submit" disabled={loading} className="w-full bg-teal-500 text-white font-bold p-4 rounded-lg shadow-lg hover:bg-teal-600 transition-colors disabled:bg-teal-300 flex items-center justify-center">
                    {loading ? <LoadingSpinner /> : 'تسجيل الدخول'}
                </button>
                <button type="button" onClick={handleBack} className="w-full text-slate-500 dark:text-slate-400 font-semibold text-sm hover:underline">
                    لست أنت؟ العودة
                </button>
            </div>
        </form>
    );
    
    const renderRegisterStep = () => (
         <form onSubmit={handleSignUp} className="space-y-4">
            <p className="text-center font-bold text-xl text-slate-800 dark:text-white">أكمل ملفك الشخصي</p>
            <div className="space-y-3">
                 <label className="font-bold block text-center text-md text-slate-700 dark:text-slate-200">اختر صورتك الرمزية</label>
                 <div className="flex justify-center flex-wrap gap-3">
                     {avatars.map((avatarUrl) => (
                         <button type="button" key={avatarUrl} onClick={() => setSelectedAvatar(avatarUrl)} className={`w-14 h-14 rounded-full overflow-hidden border-4 transition-all duration-200 ${selectedAvatar === avatarUrl ? 'border-teal-500 scale-110' : 'border-transparent hover:border-teal-300'}`}>
                             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                         </button>
                     ))}
                 </div>
            </div>
            <select id="stream" value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)} className="w-full p-4 text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors">
                {academicStreams.map(stream => (<option key={stream} value={stream}>{stream}</option>))}
            </select>
            <InputField id="password" placeholder="كلمة المرور" value={password} onChange={setPassword} icon={passwordIcon} isPassword={true} />
            <InputField id="confirmPassword" placeholder="تأكيد كلمة المرور" value={confirmPassword} onChange={setConfirmPassword} icon={passwordIcon} isPassword={true} />
            <div className="space-y-3 pt-2">
                <button type="submit" disabled={loading} className="w-full bg-teal-500 text-white font-bold p-4 rounded-lg shadow-lg hover:bg-teal-600 transition-colors disabled:bg-teal-300 flex items-center justify-center">
                    {loading ? <LoadingSpinner /> : 'إنشاء الحساب'}
                </button>
                 <button type="button" onClick={handleBack} className="w-full text-slate-500 dark:text-slate-400 font-semibold text-sm hover:underline">
                    العودة
                </button>
            </div>
        </form>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                 <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white">Bac With Me</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        {step === 'initial' && 'لنبدأ رحلتنا نحو النجاح!'}
                        {step === 'enterPassword' && 'أدخل كلمة المرور للمتابعة.'}
                        {step === 'completeProfile' && `مرحباً بك، ${username}!`}
                    </p>
                </div>
                 <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-8">
                     {step === 'initial' && renderInitialStep()}
                     {step === 'enterPassword' && renderLoginStep()}
                     {step === 'completeProfile' && renderRegisterStep()}
                     {error && <p className="mt-4 text-center text-red-500 text-sm font-semibold">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
