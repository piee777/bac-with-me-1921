import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserProfile, Subject, Exercise, Flashcard, LeaderboardUser, PastExam, CommunityPost, CommunityAnswer, Lesson, QuizQuestion, QuizOption } from '../types';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { mockSubjects, mockDailyChallenge, mockFlashcards, mockLeaderboard, mockPastExams, mockCommunityPosts, avatars, academicStreams } from '../constants';


// --- Data Transformation Helpers ---
const transformSubject = (subject: any): Subject => ({
    id: subject.id,
    name: subject.name,
    icon: subject.icon ?? '📚',
    color: subject.color ?? 'default',
    lessons: subject.lessons ? subject.lessons.map((l: any) => transformLesson(l, subject.id)) : [],
});

const transformLesson = (lesson: any, subjectId: string): Lesson => ({
    id: lesson.id,
    title: lesson.title,
    summary: lesson.summary ?? 'ملخص الدرس غير متوفر حالياً.',
    content: lesson.content ?? 'محتوى الدرس سيتم إضافته قريباً.',
    examples: lesson.examples ?? [],
    completed: lesson.completed ?? false,
    difficulty: (lesson.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium',
    imageUrl: lesson.image_url ?? undefined,
    videoUrl: lesson.video_url ?? undefined,
    pdfUrl: lesson.pdf_url ?? '#',
    audioUrl: lesson.audio_url ?? undefined,
    quiz: (lesson.quiz as QuizQuestion[] | null) ?? undefined,
    subjectId: subjectId, // Pass subjectId down to the lesson
});

const transformExercise = (exercise: any): Exercise => {
    const options: QuizOption[] = [];
    if (exercise.type === 'mcq' && exercise.options && Array.isArray(exercise.options)) {
        (exercise.options as string[]).forEach(opt => {
            options.push({
                text: opt,
                is_correct: opt === exercise.correct_answer,
            });
        });
    } else if (exercise.type === 'true-false') {
        options.push({ text: 'صحيح', is_correct: exercise.correct_answer === 'True' });
        options.push({ text: 'خطأ', is_correct: exercise.correct_answer === 'False' });
    }

    return {
        id: exercise.id,
        subject: exercise.subject,
        type: exercise.type as 'mcq' | 'true-false',
        question: exercise.question,
        options: options,
    };
};

const transformFlashcard = (flashcard: any): Flashcard => ({
    id: flashcard.id,
    subject: flashcard.subject,
    term: flashcard.term,
    definition: flashcard.definition,
});

const transformPastExam = (exam: any): PastExam => ({
    id: exam.id,
    subjectId: exam.subject_id,
    subjectName: exam.subject_name,
    year: exam.year,
    topicUrl: exam.topic_url ?? '#',
    solutionUrl: exam.solution_url ?? '#',
});

const transformPost = (post: any): CommunityPost => ({
    id: post.id,
    author: post.author,
    avatarUrl: post.avatar_url ?? `https://i.pravatar.cc/150?u=${post.author}`,
    question: post.question,
    subject: post.subject ?? 'عام',
    timestamp: post.created_at ? new Date(post.created_at).toLocaleString('ar-DZ', { day: 'numeric', month: 'long', hour: 'numeric', minute: 'numeric' }) : '',
    answers: post.answers ? post.answers.map(transformAnswer) : [],
});

const transformAnswer = (answer: any): CommunityAnswer => ({
    id: answer.id,
    author: answer.author,
    avatarUrl: answer.avatar_url ?? `https://i.pravatar.cc/150?u=${answer.author}`,
    text: answer.text,
    timestamp: answer.created_at ? new Date(answer.created_at).toLocaleString('ar-DZ', { hour: 'numeric', minute: 'numeric' }) : 'الآن',
});


// --- NEW REAL PROGRESSION SYSTEM ---

const getUserName = (): string | null => localStorage.getItem('userName');

const POINTS_CONFIG = {
    LESSON_COMPLETE: 10,
    EXERCISE_CORRECT: 5,
    COMMUNITY_POST: 15,
};

// This central function handles all rewards and badge checks
const _handleActivity = async (activityType: 'LESSON' | 'EXERCISE' | 'POST', details: any) => {
    const userName = getUserName();
    if (!userName || !isSupabaseConfigured) return;

    try {
        // 1. Award points
        let pointsToAdd = 0;
        if (activityType === 'LESSON') pointsToAdd = POINTS_CONFIG.LESSON_COMPLETE;
        if (activityType === 'EXERCISE') pointsToAdd = POINTS_CONFIG.EXERCISE_CORRECT * (details.correctCount || 0);
        if (activityType === 'POST') pointsToAdd = POINTS_CONFIG.COMMUNITY_POST;

        if (pointsToAdd > 0) {
            const { error: pointsError } = await supabase.rpc('increment_points', {
                user_name_param: userName,
                points_to_add: pointsToAdd
            });
            if (pointsError) console.error('Error incrementing points:', pointsError);
        }

        // 2. Check for badges
        const { data: userProgress, error: progressError } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id, lessons(subject_id)', { count: 'exact' })
            .eq('user_name', userName);

        const { data: userPosts, error: postsError } = await supabase
            .from('posts')
            .select('id', { count: 'exact' })
            .eq('author', userName);
        
        const { data: userBadgesData, error: currentBadgesError } = await supabase
            .from('user_badges')
            .select('*')
            .eq('user_name', userName);
        
        if (progressError || postsError || currentBadgesError) {
            console.error('Error fetching progress for badge check');
            return;
        }

        // FIX: Explicitly typing `new Set` as `Set<string>` prevents TypeScript
        // from inferring `Set<never>` when the initialization array is empty,
        // which causes a type error on `.has()`.
        const awardedBadges = new Set<string>(userBadgesData?.map(b => b.badge_id) || []);
        const newBadgesToAward: { user_name: string; badge_id: string }[] = [];

        // Badge: first_lesson
        if (activityType === 'LESSON' && !awardedBadges.has('first_lesson') && (userProgress?.length || 0) >= 1) {
            newBadgesToAward.push({ user_name: userName, badge_id: 'first_lesson' });
        }
        // Badge: community_starter
        if (activityType === 'POST' && !awardedBadges.has('community_starter') && (userPosts?.length || 0) >= 1) {
            newBadgesToAward.push({ user_name: userName, badge_id: 'community_starter' });
        }
        // You can add more complex badge checks here (e.g., math_explorer_5)
        
        if (newBadgesToAward.length > 0) {
            const { error: awardError } = await supabase.from('user_badges').insert(newBadgesToAward);
            if (awardError) console.error('Error awarding badges:', awardError);
        }

    } catch (e) {
        console.error('Error in _handleActivity:', e);
    }
};

export const createUserStats = async (userName: string): Promise<any> => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase.from('user_stats').insert({ user_name: userName, last_active_date: new Date().toISOString().slice(0, 10) });
    if (error && error.code !== '23505') { // Ignore if user already exists
        console.error('Failed to create user stats:', error);
    }
    return data;
};

// FIX: Added missing function `fetchPublicProfileByUsername` required by AuthScreen.tsx.
export const fetchPublicProfileByUsername = async (username: string): Promise<{ avatarUrl: string } | null> => {
    if (!isSupabaseConfigured) {
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('name', username)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // This code means no rows were found, which is expected for a new user.
                return null;
            }
            // For other database errors, log it but don't crash the signup flow.
            console.error("Error fetching public profile:", error);
            return null;
        }

        // If a profile is found, return the avatar, using a default if it's not set.
        if (data) {
             return { avatarUrl: data.avatar_url || avatars[0] };
        }
        
        return null;

    } catch (err) {
        console.error("Exception fetching profile:", err);
        return null; // Return null to allow signup to proceed
    }
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
    const name = getUserName() || 'طالب';
    const avatarUrl = localStorage.getItem('userAvatarUrl') || avatars[0];
    const stream = localStorage.getItem('userStream') || academicStreams[0];

    if (!isSupabaseConfigured) {
        return { id: 'local-user', name, avatarUrl, stream, points: 0, streak: 0, badges: [] };
    }

    try {
        const userName = getUserName();
        if (!userName) throw new Error("User not set up.");
        
        // Fetch stats and badges in parallel
        const [statsRes, badgesRes] = await Promise.all([
            supabase.from('user_stats').select('*').eq('user_name', userName).single(),
            supabase.from('user_badges').select('badges(*)').eq('user_name', userName)
        ]);

        let { data: stats, error: statsError } = statsRes;
        if (statsError && statsError.code === 'PGRST116') { // If no stats found, create them
            await createUserStats(userName);
            const { data: newStats, error: newStatsError } = await supabase.from('user_stats').select('*').eq('user_name', userName).single();
            if(newStatsError) throw newStatsError;
            stats = newStats;
        } else if (statsError) {
            throw statsError;
        }

        const { data: badgesData, error: badgesError } = badgesRes;
        if (badgesError) throw badgesError;

        // Streak Logic
        const today = new Date();
        const lastActive = stats?.last_active_date ? new Date(stats.last_active_date) : null;
        let currentStreak = stats?.streak || 0;
        
        if (lastActive) {
            const diffTime = today.setHours(0,0,0,0) - lastActive.setHours(0,0,0,0);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                currentStreak++;
            } else if (diffDays > 1) {
                currentStreak = 1; // Reset streak
            }
            // if diffDays is 0, do nothing.
        } else {
             currentStreak = 1; // First activity
        }

        if (!lastActive || lastActive.toISOString().slice(0, 10) !== today.toISOString().slice(0, 10)) {
            await supabase.from('user_stats').update({
                streak: currentStreak,
                last_active_date: today.toISOString().slice(0, 10)
            }).eq('user_name', userName);
        }

        return {
            id: userName,
            name,
            avatarUrl,
            stream,
            points: stats?.points || 0,
            streak: currentStreak,
            badges: badgesData?.map((b: any) => ({
                id: b.badges.id,
                name: b.badges.name,
                icon: b.badges.icon ?? '🏆',
                description: b.badges.description,
            })) || []
        };
    } catch (e) {
        console.error('Failed to fetch real user profile:', e);
        // Fallback to local data on error
        return { id: 'local-user', name, avatarUrl, stream, points: 0, streak: 0, badges: [] };
    }
};

export const fetchSubjects = async (): Promise<Subject[]> => {
    if (!isSupabaseConfigured) return mockSubjects;
    try {
        const userName = localStorage.getItem('userName');
        
        const [subjectsRes, progressRes] = await Promise.all([
            supabase.from('subjects').select('*, lessons(*)'),
            userName 
                ? supabase.from('user_lesson_progress').select('lesson_id').eq('user_name', userName)
                : Promise.resolve({ data: null, error: null })
        ]);

        const { data: subjectsData, error: subjectsError } = subjectsRes;
        if (subjectsError) throw subjectsError;
        if (!subjectsData || subjectsData.length === 0) return mockSubjects;

        const { data: progressData } = progressRes;
        const completedLessonIds = new Set(progressData?.map(p => p.lesson_id) || []);

        const subjectsWithProgress = subjectsData.map(subject => ({
            ...subject,
            lessons: subject.lessons?.map((lesson: any) => ({
                ...lesson,
                completed: completedLessonIds.has(lesson.id)
            })) || []
        }));

        return subjectsWithProgress.map(transformSubject);

    } catch (err) {
        console.error('API Error fetching subjects:', err);
        return mockSubjects;
    }
};

export const markLessonAsComplete = async (lessonId: string, subjectId: string): Promise<any> => {
    const userName = getUserName();
    if (!userName || !isSupabaseConfigured) return Promise.resolve();
    
    const { data, error } = await supabase
        .from('user_lesson_progress')
        .insert({ user_name: userName, lesson_id: lessonId });

    if (error && error.code !== '23505') {
        console.error('API Error marking lesson as complete:', error);
        throw error;
    }
    
    // Only handle activity if it's a new completion
    if (!error) {
        await _handleActivity('LESSON', { lessonId, subjectId });
    }
    return data;
};

export const recordExerciseResult = async (correctCount: number): Promise<void> => {
    await _handleActivity('EXERCISE', { correctCount });
};

export const fetchDailyChallenge = async (): Promise<Exercise[]> => {
    if (!isSupabaseConfigured) return mockDailyChallenge;
    try {
        const { data, error } = await supabase.from('exercises').select('*').limit(5);
        if (error) throw error;
        return data?.length > 0 ? data.map(transformExercise) : mockDailyChallenge;
    } catch (err) {
        console.error('API Error fetching daily challenge:', err);
        return mockDailyChallenge;
    }
};

export const fetchFlashcards = async (): Promise<Flashcard[]> => {
    if (!isSupabaseConfigured) return mockFlashcards;
    try {
        const { data, error } = await supabase.from('flashcards').select('*');
        if (error) throw error;
        return data?.length > 0 ? data.map(transformFlashcard) : mockFlashcards;
    } catch(err) {
        console.error('API Error fetching flashcards:', err);
        return mockFlashcards;
    }
};

export const fetchExamQuestions = async (): Promise<Exercise[]> => fetchDailyChallenge();

export const fetchLeaderboard = async (): Promise<LeaderboardUser[]> => {
    if (!isSupabaseConfigured) return mockLeaderboard;

    try {
        // Fetch top 15 users from user_stats ordered by points
        const { data: statsData, error: statsError } = await supabase
            .from('user_stats')
            .select('user_name, points')
            .order('points', { ascending: false })
            .limit(15);

        if (statsError) throw statsError;
        if (!statsData || statsData.length === 0) return [];

        // Get the list of usernames to fetch profiles for
        const userNames = statsData.map(s => s.user_name);

        // Fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .in('name', userNames);

        if (profilesError) throw profilesError;

        // Create a map for easy lookup of avatar URLs
        const profilesMap = new Map(profilesData?.map(p => [p.name, p.avatar_url]));

        // Combine stats and profile data
        const leaderboardData: LeaderboardUser[] = statsData.map((stat, index) => ({
            id: stat.user_name,
            name: stat.user_name,
            avatarUrl: profilesMap.get(stat.user_name) || avatars[0], // Fallback to a default avatar
            score: stat.points || 0,
            rank: index + 1,
        }));

        return leaderboardData;

    } catch (err) {
        console.error('API Error fetching leaderboard:', err);
        return mockLeaderboard; // Fallback to mock data on any error
    }
};

export const fetchPastExams = async (): Promise<PastExam[]> => {
    if (!isSupabaseConfigured) return mockPastExams;
    try {
        const { data, error } = await supabase.from('past_exams').select('*').order('year', { ascending: false });
        if (error) throw error;
        return data?.length > 0 ? data.map(transformPastExam) : mockPastExams;
    } catch(err) {
        console.error('API Error fetching past exams:', err);
        return mockPastExams;
    }
};

export const fetchCommunityPosts = async (): Promise<CommunityPost[]> => {
    if (!isSupabaseConfigured) return mockCommunityPosts;
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*, answers(*)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data?.length > 0 ? data.map(transformPost) : mockCommunityPosts;
    } catch(err) {
        console.error('API Error fetching community posts:', err);
        return mockCommunityPosts;
    }
};

export const addCommunityPost = async (question: string, subject: string): Promise<CommunityPost> => {
    const name = getUserName() || 'مجهول';
    const avatarUrl = localStorage.getItem('userAvatarUrl') || avatars[0];
    
    if (!isSupabaseConfigured) {
        const newPost = { id: new Date().toISOString(), question, subject, author: name, avatarUrl: avatarUrl, timestamp: 'الآن', answers: [] };
        mockCommunityPosts.unshift(newPost);
        return newPost;
    }

    const { data, error }: PostgrestSingleResponse<any> = await supabase
        .from('posts')
        .insert({ question, subject, author: name, avatar_url: avatarUrl })
        .select('*, answers(*)')
        .single();
    
    if (error) {
        console.error("Supabase error creating post:", error);
        if (error.code === '42501') throw new Error("فشل إنشاء المنشور. قواعد الأمان في قاعدة البيانات تمنع هذه العملية.");
        throw new Error("فشل إنشاء المنشور بسبب خطأ في قاعدة البيانات.");
    }
    
    await _handleActivity('POST', {});

    return transformPost(data);
};

export const addCommunityAnswer = async (postId: string, answerText: string): Promise<CommunityAnswer> => {
    const name = getUserName() || 'مجهول';
    const avatarUrl = localStorage.getItem('userAvatarUrl') || avatars[0];

    if (!isSupabaseConfigured) {
        const newAnswer = { id: new Date().toISOString(), text: answerText, author: name, avatarUrl: avatarUrl, timestamp: 'الآن' };
        mockCommunityPosts.find(p => p.id === postId)?.answers.push(newAnswer);
        return newAnswer;
    }

    const { data, error }: PostgrestSingleResponse<any> = await supabase
        .from('answers')
        .insert({ post_id: postId, text: answerText, author: name, avatar_url: avatarUrl })
        .select('*')
        .single();
        
    if (error) {
        console.error("Supabase error adding answer:", error);
        if (error.code === '42501') throw new Error("فشل إضافة الإجابة. قواعد الأمان في قاعدة البيانات تمنع هذه العملية.");
        throw new Error("فشل إضافة الإجابة بسبب خطأ في قاعدة البيانات.");
    }
    return transformAnswer(data);
};