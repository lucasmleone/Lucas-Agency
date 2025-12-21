import React, { useState, useEffect } from 'react';

// Mascot States
export type MascotState = 'sleeping' | 'awake' | 'focused' | 'victorious' | 'sad';

interface MascotProps {
    completionRate: number;
    currentStreak: number;
    streakLost?: boolean;
    hasNewAchievement?: boolean;
    onClick: () => void;
}

// Lion emoji states with expressions
const LION_STATES: Record<MascotState, { emoji: string; bg: string; animation: string }> = {
    sleeping: { emoji: '😴', bg: 'bg-gray-200', animation: '' },
    awake: { emoji: '🦁', bg: 'bg-amber-100', animation: 'animate-pulse-slow' },
    focused: { emoji: '🔥', bg: 'bg-orange-200', animation: 'animate-bounce-slow' },
    victorious: { emoji: '👑', bg: 'bg-yellow-300', animation: 'animate-wiggle' },
    sad: { emoji: '😿', bg: 'bg-gray-300', animation: '' }
};

export const Mascot: React.FC<MascotProps> = ({
    completionRate,
    currentStreak,
    streakLost = false,
    hasNewAchievement = false,
    onClick
}) => {
    const [state, setState] = useState<MascotState>('awake');
    const [showBubble, setShowBubble] = useState(false);

    // Determine state based on progress
    useEffect(() => {
        if (streakLost) {
            setState('sad');
        } else if (completionRate >= 80) {
            setState('victorious');
        } else if (completionRate >= 50) {
            setState('focused');
        } else if (completionRate > 0) {
            setState('awake');
        } else {
            setState('sleeping');
        }
    }, [completionRate, streakLost]);

    // Show bubble for new achievements
    useEffect(() => {
        if (hasNewAchievement) {
            setShowBubble(true);
        }
    }, [hasNewAchievement]);

    const config = LION_STATES[state];

    return (
        <div className="relative">
            <button
                onClick={onClick}
                className={`
                    relative w-10 h-10 rounded-full flex items-center justify-center
                    ${config.bg} ${config.animation}
                    hover:scale-110 transition-all duration-300
                    shadow-md hover:shadow-lg
                    border-2 border-white/50
                `}
                title={`Racha: ${currentStreak} días | Progreso: ${completionRate}%`}
            >
                <span className="text-xl">{config.emoji}</span>

                {/* Streak fire indicator */}
                {currentStreak > 0 && state !== 'sad' && (
                    <span className="absolute -bottom-1 -right-1 text-xs">
                        🔥
                    </span>
                )}

                {/* Crown for victorious state */}
                {state === 'victorious' && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm animate-bounce">
                        ✨
                    </span>
                )}
            </button>

            {/* Notification bubble */}
            {showBubble && (
                <div
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-ping-once"
                    onClick={(e) => { e.stopPropagation(); setShowBubble(false); onClick(); }}
                >
                    <span className="text-white text-xs font-bold">!</span>
                </div>
            )}

            {/* Streak counter badge */}
            {currentStreak > 2 && (
                <div className="absolute -bottom-1 -left-1 bg-orange-500 text-white text-xs font-bold px-1 rounded-full min-w-[16px] text-center shadow">
                    {currentStreak}
                </div>
            )}
        </div>
    );
};

// CSS to add to global styles
export const mascotStyles = `
@keyframes pulse-slow {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}
@keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
}
@keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    75% { transform: rotate(5deg); }
}
@keyframes ping-once {
    0% { transform: scale(1); opacity: 1; }
    75% { transform: scale(1.2); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
}
.animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
.animate-bounce-slow { animation: bounce-slow 1s ease-in-out infinite; }
.animate-wiggle { animation: wiggle 0.5s ease-in-out infinite; }
.animate-ping-once { animation: ping-once 1s ease-in-out; }
`;

export default Mascot;
