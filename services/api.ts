import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserProfile, Subject, Exercise, Flashcard, LeaderboardUser, PastExam, CommunityPost, CommunityAnswer, Lesson, QuizQuestion, QuizOption, RealtimeChatMessage, Challenge, ChallengeLobby, ChallengeParticipant } from '../types';
import { PostgrestSingleResponse, RealtimeChannel } from '@supabase/supabase-js';
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
    let options: QuizOption[] = [];
    
    // Check if options are already in the correct {text, is_correct} format
    if (Array.isArray(exercise.options) && exercise.options.length > 0 && typeof exercise.options[0] === 'object' && exercise.options[0] !== null && 'text' in exercise.options[0] && 'is_correct' in exercise.options[0]) {
        options = exercise.options;
    } 
    // Handle the database format: string array + correct_answer string
    else if (exercise.type === 'mcq' && Array.isArray(exercise.options)) {
        options = (exercise.options as string[]).map(optionText => ({
            text: optionText,
            is_correct: optionText === exercise.correct_answer,
        }));
    } else if (exercise.type === 'true-false') {
        options = [
            { text: 'صحيح', is_correct: exercise.correct_answer === 'True' || exercise.correct_answer === 'صحيح' },
            { text: 'خطأ', is_correct: exercise.correct_answer === 'False' || exercise.correct_answer === 'خطأ' }
        ];
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

const transformChatMessage = (message: any): RealtimeChatMessage => ({
    id: message.id,
    createdAt: message.created_at,
    userName: message.user_name,
    avatarUrl: message.avatar_url ?? avatars[0],
    content: message.content,
});

const transformChallenge = (challenge: any): Challenge => ({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    subject_id: challenge.subject_id,
    question_count: challenge.question_count,
    time_limit_seconds: challenge.time_limit_seconds,
});

// --- NEW REAL PROGRESSION SYSTEM ---

const getUserName = (): string | null => localStorage.getItem('userName');

const POINTS_CONFIG = {
    LESSON_COMPLETE: 10,
    EXERCISE_CORRECT: 5,
    COMMUNITY_POST: 15,
    CHALLENGE_WIN: 25,
};

// This central function handles all rewards and badge checks
const _handleActivity = async (activityType: 'LESSON' | 'EXERCISE' | 'POST' | 'CHALLENGE', details: any) => {
    const userName = getUserName();
    if (!userName || !isSupabaseConfigured) return;

    try {
        // 1. Award points
        let pointsToAdd = 0;
        if (activityType === 'LESSON') pointsToAdd = POINTS_CONFIG.LESSON_COMPLETE;
        if (activityType === 'EXERCISE') pointsToAdd = POINTS_CONFIG.EXERCISE_CORRECT * (details.correctCount || 0);
        if (activityType === 'POST') pointsToAdd = POINTS_CONFIG.COMMUNITY_POST;
        if (activityType === 'CHALLENGE') pointsToAdd = POINTS_CONFIG.CHALLENGE_WIN;


        if (pointsToAdd > 0) {
            const { data: currentStats, error: fetchError } = await supabase
                .from('user_stats')
                .select('points')
                .eq('user_name', userName)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching points before increment:', fetchError);
            } else {
                const currentPoints = currentStats?.points || 0;
                const { error: updateError } = await supabase
                    .from('user_stats')
                    .update({ points: currentPoints + pointsToAdd })
                    .eq('user_name', userName);

                if (updateError) {
                    console.error('Error updating points:', updateError);
                }
            }
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
        
        if (newBadgesToAward.length > 0) {
            const { error: awardError } = await supabase.from('user_badges').insert(newBadgesToAward);
            if (awardError) console.error('Error awarding badges:', awardError);
        }

    } catch (e) {
        console.error('Error in _handleActivity:', e);
    }
};

export const upsertUserProfileAndStats = async (userName: string, avatarUrl: string, stream: string) => {
    if (!isSupabaseConfigured) return;

    const { data, error } = await supabase.from('user_stats').upsert(
        { 
            user_name: userName, 
            avatar_url: avatarUrl,
            stream: stream,
            last_active_date: new Date().toISOString().slice(0, 10)
        }, 
        { 
            onConflict: 'user_name',
        }
    );

    if (error) {
        console.error('Failed to upsert user profile stats:', error);
        throw error;
    }

    return data;
}

// FIX: Added missing function to check if a user profile exists by username.
export const fetchPublicProfileByUsername = async (username: string): Promise<{ avatarUrl: string } | null> => {
    if (!isSupabaseConfigured) {
        // If Supabase is not configured, we cannot check. Assume username is available.
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('name', username)
            .single();

        // "PGRST116" means no rows were found, which is the expected outcome for a new user.
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching public profile by username:', error);
            throw error; // Throw other database errors
        }

        if (data) {
            // A profile was found, return its avatar URL.
            return { avatarUrl: data.avatar_url || avatars[0] };
        }

        // No profile was found.
        return null;

    } catch (err) {
        console.error('API Error in fetchPublicProfileByUsername:', err);
        // In case of an unexpected exception, re-throw it to be handled by the caller.
        throw err;
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
        
        const [statsRes, userBadgesRes] = await Promise.all([
            supabase.from('user_stats').select('*').eq('user_name', userName).single(),
            supabase.from('user_badges').select('badge_id').eq('user_name', userName)
        ]);

        let { data: stats, error: statsError } = statsRes;
        
        if (statsError && statsError.code !== 'PGRST116') {
            throw statsError;
        }
        
        const { data: userBadgesData, error: userBadgesError } = userBadgesRes;
        if (userBadgesError) throw userBadgesError;
        
        let badges = [];
        if (userBadgesData && userBadgesData.length > 0) {
            const badgeIds = userBadgesData.map(ub => ub.badge_id);
            const { data: badgesData, error: badgesError } = await supabase
                .from('badges')
                .select('*')
                .in('id', badgeIds);
            
            if (badgesError) throw badgesError;

            if (badgesData) {
                badges = badgesData.map((b: any) => ({
                    id: b.id,
                    name: b.name,
                    icon: b.icon ?? '🏆',
                    description: b.description,
                }));
            }
        }

        const today = new Date();
        const lastActive = stats?.last_active_date ? new Date(stats.last_active_date) : null;
        let currentStreak = stats?.streak || 0;
        
        if (lastActive) {
            const diffTime = today.setHours(0,0,0,0) - lastActive.setHours(0,0,0,0);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                currentStreak++;
            } else if (diffDays > 1) {
                currentStreak = 1;
            }
        } else if (stats) {
             currentStreak = 1;
        }

        if (stats && (!lastActive || lastActive.toISOString().slice(0, 10) !== today.toISOString().slice(0, 10))) {
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
            badges: badges,
        };
    } catch (e) {
        console.error('Failed to fetch real user profile:', e);
        return { id: 'local-user', name, avatarUrl, stream, points: 0, streak: 0, badges: [] };
    }
};

export const fetchSubjects = async (): Promise<Subject[]> => {
    if (!isSupabaseConfigured) return mockSubjects;
    try {
        const userName = localStorage.getItem('userName');
        
        const [subjectsRes, lessonsRes, progressRes] = await Promise.all([
            supabase.from('subjects').select('*'),
            supabase.from('lessons').select('*'),
            userName 
                ? supabase.from('user_lesson_progress').select('lesson_id').eq('user_name', userName)
                : Promise.resolve({ data: null, error: null })
        ]);

        const { data: subjectsData, error: subjectsError } = subjectsRes;
        if (subjectsError) throw subjectsError;
        
        const { data: lessonsData, error: lessonsError } = lessonsRes;
        if (lessonsError) throw lessonsError;

        if (!subjectsData || subjectsData.length === 0) return mockSubjects;

        // Group lessons by subject ID for efficient mapping
        const lessonsBySubjectId = (lessonsData || []).reduce((acc, lesson) => {
            const subjectId = lesson.subject_id;
            if (subjectId) {
                if (!acc[subjectId]) acc[subjectId] = [];
                acc[subjectId].push(lesson);
            }
            return acc;
        }, {} as Record<string, any[]>);

        // Attach lessons to their respective subjects
        const subjectsWithLessons = (subjectsData || []).map(subject => ({
            ...subject,
            lessons: lessonsBySubjectId[subject.id] || []
        }));

        const { data: progressData } = progressRes;
        const completedLessonIds = new Set<string>(progressData?.map(p => p.lesson_id) || []);

        const subjectsWithProgress = subjectsWithLessons.map(subject => ({
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
    
    if (!error) {
        await _handleActivity('LESSON', { lessonId, subjectId });
    }
    return data;
};

export const recordExerciseResult = async (correctCount: number): Promise<void> => {
    await _handleActivity('EXERCISE', { correctCount });
};

// --- Gamification / Challenges API ---

export const fetchChallenges = async (): Promise<Challenge[]> => {
    if (!isSupabaseConfigured) return [];
    try {
        const { data, error } = await supabase.from('challenges').select('*');
        if (error) throw error;
        return data.map(transformChallenge);
    } catch (err) {
        console.error('API Error fetching challenges:', err);
        return [];
    }
};

export const fetchChallengeExercises = async (subjectId: string, count: number): Promise<Exercise[]> => {
    if (!isSupabaseConfigured) return mockDailyChallenge.slice(0, count);
    try {
        const { data, error } = await supabase
            .from('exercises')
            .select('*')
            .eq('subject', subjectId)
            .limit(count); // In a real app, you might want to randomize this with a function
        if (error) throw error;
        return data.map(transformExercise);
    } catch (err) {
        console.error('API Error fetching challenge exercises:', err);
        return mockDailyChallenge.slice(0, count);
    }
};

export const createChallengeLobby = async (challengeId: string): Promise<ChallengeLobby> => {
    const hostUsername = getUserName();
    if (!hostUsername || !isSupabaseConfigured) throw new Error("User not identified.");
    const { data, error } = await supabase
        .from('challenge_lobbies')
        .insert({ challenge_id: challengeId, host_username: hostUsername })
        .select()
        .single();
    if (error) throw error;
    return data as ChallengeLobby;
};

export const subscribeToLobby = (
    lobbyId: string,
    onParticipantsChange: (participants: ChallengeParticipant[]) => void,
    onLobbyStatusChange: (status: 'waiting' | 'running' | 'finished') => void
): RealtimeChannel => {

    const channel = supabase.channel(`challenge-lobby-${lobbyId}`);
    
    const presence = channel.on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const participants = Object.values(presenceState)
            .map((p: any) => p[0])
            .map((p: any) => ({
                user_name: p.user_name,
                avatar_url: p.avatar_url,
                score: 0, // Initial score
            }));
        onParticipantsChange(participants);
    });

    const broadcast = channel.on('broadcast', { event: 'status_update' }, (payload) => {
        onLobbyStatusChange(payload.payload.status);
    });

    channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            const userName = getUserName();
            const avatarUrl = localStorage.getItem('userAvatarUrl');
            await channel.track({ user_name: userName, avatar_url: avatarUrl });
        }
    });

    return channel;
};

export const updateLobbyStatus = (channel: RealtimeChannel | null, status: 'running' | 'finished') => {
    channel?.send({
        type: 'broadcast',
        event: 'status_update',
        payload: { status },
    });
};

export const submitChallengeResult = async (lobbyId: string, score: number, time: number) => {
    const userName = getUserName();
    if (!userName || !isSupabaseConfigured) return;

    await supabase.from('challenge_participants').insert({
        lobby_id: lobbyId,
        user_name: userName,
        score,
        finish_time_seconds: time,
    });
    
    // Award points for winning
    await _handleActivity('CHALLENGE', { score });
};

export const fetchChallengeResults = async (lobbyId: string): Promise<ChallengeParticipant[]> => {
    if (!isSupabaseConfigured) return [];
    
    const { data, error } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('lobby_id', lobbyId)
        .order('score', { ascending: false })
        .order('finish_time_seconds', { ascending: true });
        
    if (error) throw error;
    
    // We need to fetch avatars for the results
    const userNames = data.map(p => p.user_name);
    const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('user_name, avatar_url')
        .in('user_name', userNames);

    if (statsError) {
        console.error("Could not fetch avatars for results", statsError);
        // FIX: The original `data` from `challenge_participants` lacks the `avatar_url` required by `ChallengeParticipant`. Map the data to include a default avatar.
        return data.map(p => ({
            ...p,
            avatar_url: avatars[0]
        }));
    }
    
    const avatarMap = new Map(statsData.map(s => [s.user_name, s.avatar_url]));

    return data.map(p => ({
        ...p,
        avatar_url: avatarMap.get(p.user_name) || avatars[0]
    }));
};


// FIX: Added the missing `fetchDailyChallenge` function, which is called by `fetchExamQuestions`.
export const fetchDailyChallenge = async (): Promise<Exercise[]> => {
    if (!isSupabaseConfigured) return mockDailyChallenge;
    try {
        // In a real app, this should probably fetch random questions or questions of the day
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
        const { data: statsData, error: statsError } = await supabase
            .from('user_stats')
            .select('user_name, points, avatar_url')
            .order('points', { ascending: false })
            .limit(15);

        if (statsError) throw statsError;
        if (!statsData || statsData.length === 0) return [];

        const leaderboardData: LeaderboardUser[] = statsData.map((stat, index) => ({
            id: stat.user_name,
            name: stat.user_name,
            avatarUrl: stat.avatar_url || avatars[0],
            score: stat.points || 0,
            rank: index + 1,
        }));

        return leaderboardData;

    } catch (err) {
        console.error('API Error fetching leaderboard:', err);
        return mockLeaderboard;
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

// --- Live Chat Functions ---

export const fetchChatMessages = async (): Promise<RealtimeChatMessage[]> => {
    if (!isSupabaseConfigured) return [];
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(100);
        if (error) throw error;
        return data.map(transformChatMessage);
    } catch (err) {
        console.error('API Error fetching chat messages:', err);
        return [];
    }
};

export const sendChatMessage = async (content: string): Promise<RealtimeChatMessage> => {
    const userName = getUserName() || 'مجهول';
    const avatarUrl = localStorage.getItem('userAvatarUrl') || avatars[0];

    if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");

    const { data, error }: PostgrestSingleResponse<any> = await supabase
        .from('chat_messages')
        .insert({ 
            content: content, 
            user_name: userName, 
            avatar_url: avatarUrl
        })
        .select('*')
        .single();
    
    if (error) {
        console.error("Supabase error sending chat message:", error);
        throw new Error("Failed to send message.");
    }
    return transformChatMessage(data);
};

export const subscribeToChatMessages = (onNewMessage: (message: RealtimeChatMessage) => void): RealtimeChannel => {
    const channel = supabase.channel('public:chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          onNewMessage(transformChatMessage(payload.new));
        }
      );
      
    return channel;
};