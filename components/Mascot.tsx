import React, { useState, useEffect } from 'react';

interface MascotProps {
    completionRate: number;
    currentStreak: number;
    hasNewAchievement?: boolean;
    onClick: () => void;
}

// Duolingo-style flame icon
const DuolingoFlame: React.FC<{ streakCount: number; size?: number }> = ({
    streakCount,
    size = 52
}) => {
    return (
        <div
            className="relative flex items-center justify-center animate-flame-dance"
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 32 40"
                width={size}
                height={size * 1.2}
                className="drop-shadow-lg"
            >
                <defs>
                    {/* Main gradient - red to yellow */}
                    <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#ff4500" />
                        <stop offset="50%" stopColor="#ff6b00" />
                        <stop offset="80%" stopColor="#ffc107" />
                        <stop offset="100%" stopColor="#ffeb3b" />
                    </linearGradient>
                    {/* Inner glow gradient */}
                    <linearGradient id="innerGlow" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#ff9800" />
                        <stop offset="100%" stopColor="#ffeb3b" />
                    </linearGradient>
                    {/* Drop shadow */}
                    <filter id="flameShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#ff4500" floodOpacity="0.4" />
                    </filter>
                </defs>

                {/* Main flame shape */}
                <path
                    d="M16 0
                       C16 0 6 12 6 24
                       C6 32 10 38 16 38
                       C22 38 26 32 26 24
                       C26 12 16 0 16 0Z"
                    fill="url(#flameGradient)"
                    filter="url(#flameShadow)"
                />

                {/* Inner flame highlight */}
                <path
                    d="M16 12
                       C16 12 11 20 11 27
                       C11 32 13 35 16 35
                       C19 35 21 32 21 27
                       C21 20 16 12 16 12Z"
                    fill="url(#innerGlow)"
                    opacity="0.8"
                />

                {/* Core bright spot */}
                <ellipse
                    cx="16"
                    cy="30"
                    rx="4"
                    ry="5"
                    fill="#fff9c4"
                    opacity="0.6"
                />
            </svg>

            {/* Number overlay */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ paddingTop: '8px' }}
            >
                <span
                    className="font-black"
                    style={{
                        fontSize: streakCount >= 10 ? '18px' : '22px',
                        color: '#b71c1c',
                        textShadow: '0 1px 0 rgba(255,255,255,0.5)',
                        WebkitTextStroke: '0.5px #7f0000'
                    }}
                >
                    {streakCount}
                </span>
            </div>
        </div>
    );
};

// Simple progress indicator for daily completion
const ProgressDot: React.FC<{ progress: number }> = ({ progress }) => {
    const getColor = () => {
        if (progress >= 100) return 'bg-green-500';
        if (progress >= 80) return 'bg-green-400';
        if (progress >= 50) return 'bg-yellow-400';
        if (progress > 0) return 'bg-orange-400';
        return 'bg-gray-400';
    };

    return (
        <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getColor()} border-2 border-white shadow-sm flex items-center justify-center`}
        >
            {progress >= 100 && <span className="text-[8px]">✓</span>}
        </div>
    );
};

export const Mascot: React.FC<MascotProps> = ({
    completionRate,
    currentStreak,
    hasNewAchievement = false,
    onClick
}) => {
    const [showBubble, setShowBubble] = useState(false);

    useEffect(() => {
        if (hasNewAchievement) setShowBubble(true);
    }, [hasNewAchievement]);

    const hasStreak = currentStreak > 0;

    return (
        <div className="relative">
            <button
                onClick={onClick}
                className="relative flex items-center justify-center hover:scale-110 transition-transform duration-200"
                title={`🔥 Racha: ${currentStreak} días | Progreso hoy: ${Math.round(completionRate)}%`}
            >
                {hasStreak ? (
                    <DuolingoFlame streakCount={currentStreak} size={48} />
                ) : (
                    // No streak - show gray flame or percentage
                    <div className="w-12 h-14 flex items-center justify-center bg-gradient-to-b from-gray-300 to-gray-400 rounded-full text-gray-600 font-bold text-lg relative" style={{ clipPath: 'ellipse(50% 50% at 50% 50%)' }}>
                        <svg viewBox="0 0 32 40" className="w-12 h-14 opacity-40">
                            <path
                                d="M16 0 C16 0 6 12 6 24 C6 32 10 38 16 38 C22 38 26 32 26 24 C26 12 16 0 16 0Z"
                                fill="#9ca3af"
                            />
                        </svg>
                        <span className="absolute text-gray-500 font-bold">
                            {completionRate > 0 ? `${Math.round(completionRate)}%` : '–'}
                        </span>
                    </div>
                )}

                {/* Daily progress indicator */}
                <ProgressDot progress={completionRate} />

                {/* Achievement sparkle */}
                {completionRate >= 100 && hasStreak && (
                    <span className="absolute -top-2 -right-2 text-xl animate-bounce">✨</span>
                )}
            </button>

            {/* Notification bubble */}
            {showBubble && (
                <div
                    className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-bounce cursor-pointer z-20 border-2 border-white"
                    onClick={(e) => { e.stopPropagation(); setShowBubble(false); onClick(); }}
                >
                    <span className="text-white text-xs font-bold">!</span>
                </div>
            )}
        </div>
    );
};

export default Mascot;
