import { useState, useEffect, useCallback } from 'react';

interface GamificationState {
    // Today's progress
    completionRate: number;
    completedBlocks: number;
    totalBlocks: number;

    // Streaks
    currentStreak: number;
    longestStreak: number;
    streakLost: boolean;

    // Stats
    totalBlocksCompleted: number;
    totalProductiveDays: number;

    // UI state
    hasNewAchievement: boolean;
    newAchievements: any[];

    // Loading
    loading: boolean;
}

export const useGamification = () => {
    const [state, setState] = useState<GamificationState>({
        completionRate: 0,
        completedBlocks: 0,
        totalBlocks: 0,
        currentStreak: 0,
        longestStreak: 0,
        streakLost: false,
        totalBlocksCompleted: 0,
        totalProductiveDays: 0,
        hasNewAchievement: false,
        newAchievements: [],
        loading: true
    });

    // Fetch all gamification data
    const fetchData = useCallback(async () => {
        try {
            const [statsRes, todayRes] = await Promise.all([
                fetch('/api/achievements/stats', { credentials: 'include' }),
                fetch('/api/achievements/today', { credentials: 'include' })
            ]);

            const stats = statsRes.ok ? await statsRes.json() : {};
            const today = todayRes.ok ? await todayRes.json() : {};

            // Check if streak was lost (last productive day was more than 2 days ago)
            let streakLost = false;
            if (stats.lastProductiveDay) {
                const lastDay = new Date(stats.lastProductiveDay);
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
                streakLost = diffDays > 2 && stats.currentStreak === 0;
            }

            setState({
                completionRate: today.completionRate || 0,
                completedBlocks: today.completedBlocks || 0,
                totalBlocks: today.totalBlocks || 0,
                currentStreak: stats.currentStreak || today.currentStreak || 0,
                longestStreak: stats.longestStreak || today.longestStreak || 0,
                streakLost,
                totalBlocksCompleted: stats.totalBlocksCompleted || 0,
                totalProductiveDays: stats.totalProductiveDays || 0,
                hasNewAchievement: false,
                newAchievements: [],
                loading: false
            });

            // Auto-check achievements when user hits productive threshold
            if (today.completionRate >= 80 && today.totalBlocks > 0) {
                try {
                    await fetch('/api/achievements/check-day', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({})
                    });
                    // Refresh stats after checking (for updated streak)
                    const updatedStats = await fetch('/api/achievements/stats', { credentials: 'include' });
                    if (updatedStats.ok) {
                        const newStats = await updatedStats.json();
                        setState(prev => ({
                            ...prev,
                            currentStreak: newStats.currentStreak || prev.currentStreak,
                            longestStreak: newStats.longestStreak || prev.longestStreak,
                            totalProductiveDays: newStats.totalProductiveDays || prev.totalProductiveDays
                        }));
                    }
                } catch (e) {
                    console.error('Error auto-checking achievements:', e);
                }
            }
        } catch (err) {
            console.error('Error fetching gamification data:', err);
            setState(prev => ({ ...prev, loading: false }));
        }
    }, []);

    // Check for achievements when a block is completed
    const checkAchievements = useCallback(async () => {
        try {
            const res = await fetch('/api/achievements/check-day', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({})
            });

            if (res.ok) {
                const data = await res.json();
                if (data.newAchievements && data.newAchievements.length > 0) {
                    setState(prev => ({
                        ...prev,
                        hasNewAchievement: true,
                        newAchievements: data.newAchievements
                    }));
                }
                // Refresh data
                fetchData();
            }
        } catch (err) {
            console.error('Error checking achievements:', err);
        }
    }, [fetchData]);

    // Clear new achievement notification
    const clearNewAchievement = useCallback(() => {
        setState(prev => ({ ...prev, hasNewAchievement: false, newAchievements: [] }));
    }, []);

    // Initial fetch with streak recalculation
    useEffect(() => {
        const init = async () => {
            // First recalculate streak from historical data
            try {
                await fetch('/api/achievements/recalculate-streak', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
            } catch (e) {
                console.error('Error recalculating streak:', e);
            }
            // Then fetch display data
            fetchData();
        };
        init();

        // Refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    return {
        ...state,
        refresh: fetchData,
        checkAchievements,
        clearNewAchievement
    };
};

export default useGamification;
