import React, { useState, useEffect } from 'react';
import { X, Flame, Target, Trophy, Zap, Star, TrendingUp, Calendar } from 'lucide-react';

interface ProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    completionRate: number;
    completedBlocks: number;
    totalBlocks: number;
    currentStreak: number;
    longestStreak: number;
    totalBlocksCompleted: number;
    totalProductiveDays: number;
    newAchievements?: any[];
    onClearAchievements?: () => void;
}

const MOTIVATIONAL_QUOTES = [
    { text: "El obstáculo es el camino.", author: "Marco Aurelio" },
    { text: "No busques que los eventos sucedan como deseas.", author: "Epicteto" },
    { text: "Haz cada acto como si fuera el último de tu vida.", author: "Marco Aurelio" },
    { text: "La riqueza no consiste en tener grandes posesiones, sino en tener pocas necesidades.", author: "Epicteto" },
    { text: "Lo que nos perturba no son las cosas, sino lo que pensamos de ellas.", author: "Epicteto" }
];

export const ProgressModal: React.FC<ProgressModalProps> = ({
    isOpen,
    onClose,
    completionRate,
    completedBlocks,
    totalBlocks,
    currentStreak,
    longestStreak,
    totalBlocksCompleted,
    totalProductiveDays,
    newAchievements = [],
    onClearAchievements
}) => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [animatedProgress, setAnimatedProgress] = useState(0);
    const [quote] = useState(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

    // Animate progress bar on open
    useEffect(() => {
        if (isOpen) {
            setAnimatedProgress(0);
            const timer = setTimeout(() => {
                setAnimatedProgress(completionRate);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, completionRate]);

    // Show confetti for new achievements or 100% completion
    useEffect(() => {
        if (isOpen && (newAchievements.length > 0 || completionRate >= 100)) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, newAchievements, completionRate]);

    if (!isOpen) return null;

    const getProgressColor = () => {
        if (completionRate >= 80) return 'from-green-400 to-emerald-500';
        if (completionRate >= 50) return 'from-yellow-400 to-orange-500';
        return 'from-gray-400 to-gray-500';
    };

    const getMascotMessage = () => {
        if (completionRate >= 100) return "¡PERFECTO! 👑 Día completado al 100%";
        if (completionRate >= 80) return "¡Excelente! 🔥 Superaste el objetivo";
        if (completionRate >= 50) return "¡Vas bien! 💪 Sigue así";
        if (completionRate > 0) return "¡Ya empezaste! 🌱 Cada bloque cuenta";
        if (totalBlocks > 0) return "¡Hoy tenés trabajo! 📋 A por ello";
        return "Día libre 😴 Descansá o planificá";
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            {/* Confetti effect */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-fall"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        >
                            {['🎉', '✨', '🔥', '⭐', '💪'][Math.floor(Math.random() * 5)]}
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
                {/* Header with gradient */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white relative overflow-hidden">
                    <button
                        onClick={() => { onClose(); onClearAchievements?.(); }}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Animated background circles */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
                    <div className="absolute -left-5 -bottom-5 w-24 h-24 bg-white/10 rounded-full" />

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-5xl animate-bounce-slow">
                                {completionRate >= 80 ? '🦁' : completionRate >= 50 ? '🔥' : '💪'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Tu Progreso</h2>
                                <p className="text-white/80 text-sm">{getMascotMessage()}</p>
                            </div>
                        </div>

                        {/* Main progress bar */}
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span>Hoy</span>
                                <span className="font-bold">{completedBlocks}/{totalBlocks} bloques</span>
                            </div>
                            <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full transition-all duration-1000 ease-out relative`}
                                    style={{ width: `${animatedProgress}%` }}
                                >
                                    {animatedProgress >= 80 && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 animate-pulse">✨</div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between text-xs mt-1 opacity-70">
                                <span>0%</span>
                                <span className="text-yellow-300">80% = Día Productivo</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Streak Card */}
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 text-center border border-orange-100">
                            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-orange-600">{currentStreak}</div>
                            <div className="text-xs text-gray-500">Racha Actual</div>
                            {currentStreak > 0 && currentStreak >= longestStreak && (
                                <div className="text-xs text-orange-500 mt-1 font-medium">🏆 Mejor racha!</div>
                            )}
                        </div>

                        {/* Total Blocks Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 text-center border border-blue-100">
                            <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-blue-600">{totalBlocksCompleted}</div>
                            <div className="text-xs text-gray-500">Bloques Totales</div>
                        </div>

                        {/* Productive Days */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 text-center border border-green-100">
                            <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-green-600">{totalProductiveDays}</div>
                            <div className="text-xs text-gray-500">Días Productivos</div>
                        </div>

                        {/* Best Streak */}
                        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 text-center border border-yellow-100">
                            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-yellow-600">{longestStreak}</div>
                            <div className="text-xs text-gray-500">Mejor Racha</div>
                        </div>
                    </div>

                    {/* New Achievement Alert */}
                    {newAchievements.length > 0 && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl border border-yellow-200 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="text-3xl">{newAchievements[0].emoji || '🏅'}</div>
                                <div>
                                    <div className="font-bold text-gray-800">¡Nuevo Logro!</div>
                                    <div className="text-sm text-gray-600">{newAchievements[0].name}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Motivational Quote */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-gray-600 italic text-sm">"{quote.text}"</p>
                        <p className="text-gray-400 text-xs mt-1">— {quote.author}</p>
                    </div>

                    {/* CTA Button */}
                    {completionRate < 80 && totalBlocks > 0 && (
                        <button
                            onClick={onClose}
                            className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
                        >
                            ¡Seguir Trabajando! 💪
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Add these CSS keyframes to global styles
export const progressModalStyles = `
@keyframes scale-in {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
@keyframes fall {
    from { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
    to { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
.animate-scale-in { animation: scale-in 0.3s ease-out; }
.animate-fall { animation: fall linear forwards; }
`;

export default ProgressModal;
