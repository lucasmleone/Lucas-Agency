import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Target, Zap, Star, Crown, X, CheckCircle2 } from 'lucide-react';

interface Achievement {
    id: number;
    type: string;
    name: string;
    emoji: string;
    description: string;
    date: string;
}

interface Stats {
    currentStreak: number;
    longestStreak: number;
    totalBlocksCompleted: number;
    totalProductiveDays: number;
}

interface TodayProgress {
    date: string;
    totalBlocks: number;
    completedBlocks: number;
    completionRate: number;
    isProductiveDay: boolean;
    isPerfectDay: boolean;
    currentStreak: number;
}

interface StoicDashboardProps {
    onClose?: () => void;
}

export const StoicDashboard: React.FC<StoicDashboardProps> = ({ onClose }) => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [todayProgress, setTodayProgress] = useState<TodayProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);
    const [newAchievements, setNewAchievements] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, achievementsRes, todayRes] = await Promise.all([
                fetch('/api/achievements/stats', { credentials: 'include' }),
                fetch('/api/achievements', { credentials: 'include' }),
                fetch('/api/achievements/today', { credentials: 'include' })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (achievementsRes.ok) setAchievements(await achievementsRes.json());
            if (todayRes.ok) setTodayProgress(await todayRes.json());
        } catch (err) {
            console.error('Error fetching achievements:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkDayAchievements = async () => {
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
                    setNewAchievements(data.newAchievements);
                    setShowCelebration(true);
                }
                fetchData(); // Refresh all data
            }
        } catch (err) {
            console.error('Error checking achievements:', err);
        }
    };

    const getStreakEmoji = (streak: number) => {
        if (streak >= 30) return '👑';
        if (streak >= 7) return '🌟';
        if (streak >= 3) return '🔥🔥🔥';
        if (streak >= 1) return '🔥';
        return '💤';
    };

    const getMotivationalQuote = () => {
        const quotes = [
            { text: "No busques que los eventos ocurran como deseas. Desea que ocurran como ocurren.", author: "Epicteto" },
            { text: "La felicidad de tu vida depende de la calidad de tus pensamientos.", author: "Marco Aurelio" },
            { text: "Haz cada acto como si fuera el último de tu vida.", author: "Marco Aurelio" },
            { text: "Lo que nos perturba no son las cosas, sino lo que pensamos de ellas.", author: "Epicteto" },
            { text: "No pierdas tiempo discutiendo qué debería ser un buen hombre. Sé uno.", author: "Marco Aurelio" }
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    };

    const quote = getMotivationalQuote();

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 rounded-t-2xl relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Logros Estoicos</h1>
                            <p className="text-white/80 text-sm">Controla lo que puedes. Acepta lo que no.</p>
                        </div>
                    </div>
                </div>

                {/* Quote */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b">
                    <p className="text-gray-700 italic">"{quote.text}"</p>
                    <p className="text-gray-500 text-sm mt-1">— {quote.author}</p>
                </div>

                {/* Stats Grid */}
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        Tu Progreso
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {/* Current Streak */}
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 text-center border border-orange-100">
                            <div className="text-3xl mb-1">{getStreakEmoji(stats?.currentStreak || 0)}</div>
                            <div className="text-2xl font-bold text-orange-600">{stats?.currentStreak || 0}</div>
                            <div className="text-xs text-gray-500">Racha Actual</div>
                        </div>

                        {/* Longest Streak */}
                        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 text-center border border-yellow-100">
                            <div className="text-3xl mb-1">🏆</div>
                            <div className="text-2xl font-bold text-amber-600">{stats?.longestStreak || 0}</div>
                            <div className="text-xs text-gray-500">Mejor Racha</div>
                        </div>

                        {/* Total Blocks */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center border border-blue-100">
                            <div className="text-3xl mb-1">💪</div>
                            <div className="text-2xl font-bold text-blue-600">{stats?.totalBlocksCompleted || 0}</div>
                            <div className="text-xs text-gray-500">Bloques Completados</div>
                        </div>

                        {/* Productive Days */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-100">
                            <div className="text-3xl mb-1">📅</div>
                            <div className="text-2xl font-bold text-green-600">{stats?.totalProductiveDays || 0}</div>
                            <div className="text-xs text-gray-500">Días Productivos</div>
                        </div>
                    </div>

                    {/* Today's Progress */}
                    {todayProgress && todayProgress.totalBlocks > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-500" />
                                Hoy
                            </h2>

                            <div className="bg-gray-50 rounded-xl p-4 border">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-gray-600">Progreso del día</span>
                                    <span className={`font-bold ${todayProgress.completionRate >= 80 ? 'text-green-600' : todayProgress.completionRate >= 50 ? 'text-yellow-600' : 'text-gray-500'}`}>
                                        {todayProgress.completionRate}%
                                    </span>
                                </div>

                                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
                                    <div
                                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${todayProgress.completionRate >= 80
                                                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                                : todayProgress.completionRate >= 50
                                                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                                                    : 'bg-gray-400'
                                            }`}
                                        style={{ width: `${todayProgress.completionRate}%` }}
                                    />
                                    {/* 80% marker */}
                                    <div className="absolute top-0 bottom-0 w-0.5 bg-green-600 opacity-50" style={{ left: '80%' }} />
                                </div>

                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>{todayProgress.completedBlocks} de {todayProgress.totalBlocks} bloques</span>
                                    {todayProgress.isProductiveDay && (
                                        <span className="text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" /> Día Productivo
                                        </span>
                                    )}
                                </div>

                                {!todayProgress.isProductiveDay && todayProgress.completionRate < 80 && (
                                    <div className="mt-3 text-center">
                                        <button
                                            onClick={checkDayAchievements}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                        >
                                            Verificar Logros del Día
                                        </button>
                                    </div>
                                )}

                                {todayProgress.isProductiveDay && (
                                    <div className="mt-3 text-center">
                                        <button
                                            onClick={checkDayAchievements}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                        >
                                            🎉 Reclamar Logro del Día
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recent Achievements */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Logros Recientes
                        </h2>

                        {achievements.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <div className="text-4xl mb-3">🎯</div>
                                <p className="text-gray-500">Aún no tienes logros.</p>
                                <p className="text-gray-400 text-sm">¡Completa bloques para ganar tu primer logro!</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {achievements.slice(0, 10).map(achievement => (
                                    <div
                                        key={achievement.id}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="text-2xl">{achievement.emoji}</div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-800">{achievement.name}</div>
                                            <div className="text-xs text-gray-500">{achievement.description}</div>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {new Date(achievement.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Celebration Overlay */}
            {showCelebration && newAchievements.length > 0 && (
                <div
                    className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center"
                    onClick={() => setShowCelebration(false)}
                >
                    <div className="bg-white rounded-2xl p-8 max-w-md text-center animate-bounce-in">
                        <div className="text-6xl mb-4">{newAchievements[0].emoji}</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Nuevo Logro!</h2>
                        <p className="text-xl text-indigo-600 font-medium mb-2">{newAchievements[0].name}</p>
                        <p className="text-gray-500 mb-4">{newAchievements[0].description}</p>
                        <button
                            onClick={() => setShowCelebration(false)}
                            className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            ¡Genial!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoicDashboard;
