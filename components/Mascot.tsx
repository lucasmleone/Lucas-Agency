import React, { useState, useEffect } from 'react';

interface MascotProps {
    completionRate: number;
    currentStreak: number;
    hasNewAchievement?: boolean;
    onClick: () => void;
}

// Duolingo-style flame icon with animated internal flames
const DuolingoFlame: React.FC<{ streakCount: number }> = ({ streakCount }) => {
    // Fire grows with streak
    const baseSize = 48;
    const growthFactor = Math.min(streakCount * 1.5, 12);
    const size = baseSize + growthFactor;

    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: size, height: size * 1.2 }}
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

                {/* Main flame shape - with animation */}
                <path
                    d="M16 0
                       C16 0 6 12 6 24
                       C6 32 10 38 16 38
                       C22 38 26 32 26 24
                       C26 12 16 0 16 0Z"
                    fill="url(#flameGradient)"
                    filter="url(#flameShadow)"
                    className="animate-flame-outer"
                />

                {/* Inner flame highlight - animated */}
                <path
                    d="M16 8
                       C16 8 10 18 10 26
                       C10 32 12 36 16 36
                       C20 36 22 32 22 26
                       C22 18 16 8 16 8Z"
                    fill="url(#innerGlow)"
                    opacity="0.9"
                    className="animate-flame-inner"
                />

                {/* Core bright spot - animated */}
                <ellipse
                    cx="16"
                    cy="30"
                    rx="5"
                    ry="6"
                    fill="#fff9c4"
                    opacity="0.7"
                    className="animate-flame-core"
                />
            </svg>

            {/* Number overlay */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ paddingTop: '10%' }}
            >
                <span
                    className="font-black"
                    style={{
                        fontSize: streakCount >= 100 ? '14px' : streakCount >= 10 ? '18px' : '22px',
                        color: '#b71c1c',
                        textShadow: '0 1px 0 rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.3)',
                        WebkitTextStroke: '0.5px #8b0000'
                    }}
                >
                    {streakCount}
                </span>
            </div>
        </div>
    );
};

// Progress indicator dot with glow
const ProgressDot: React.FC<{ progress: number }> = ({ progress }) => {
    const getColor = () => {
        if (progress >= 100) return 'bg-green-500';
        if (progress >= 80) return 'bg-green-400';
        if (progress >= 50) return 'bg-yellow-400';
        if (progress > 0) return 'bg-orange-400';
        return 'bg-gray-400';
    };

    // Glow intensity based on progress
    const getGlowStyle = () => {
        if (progress >= 100) return { boxShadow: '0 0 12px 4px rgba(34, 197, 94, 0.7), 0 0 20px 8px rgba(34, 197, 94, 0.4)' };
        if (progress >= 80) return { boxShadow: '0 0 10px 3px rgba(34, 197, 94, 0.6)' };
        if (progress >= 50) return { boxShadow: '0 0 8px 2px rgba(234, 179, 8, 0.5)' };
        if (progress > 0) return { boxShadow: '0 0 6px 2px rgba(249, 115, 22, 0.4)' };
        return {};
    };

    return (
        <div
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${getColor()} border-2 border-white flex items-center justify-center transition-all duration-500`}
            style={getGlowStyle()}
        >
            {progress >= 100 && <span className="text-white text-[9px] font-bold">✓</span>}
        </div>
    );
};

// Gray flame for no streak
const GrayFlame: React.FC<{ completionRate: number }> = ({ completionRate }) => (
    <div className="relative w-12 h-14 flex items-center justify-center">
        <svg viewBox="0 0 32 40" className="w-12 h-14">
            <defs>
                <linearGradient id="grayFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#6b7280" />
                    <stop offset="100%" stopColor="#9ca3af" />
                </linearGradient>
            </defs>
            <path
                d="M16 2 C16 2 7 12 7 23 C7 31 10 37 16 37 C22 37 25 31 25 23 C25 12 16 2 16 2Z"
                fill="url(#grayFlame)"
                opacity="0.6"
            />
        </svg>
        <span className="absolute text-gray-500 font-bold text-sm" style={{ paddingTop: '8px' }}>
            {completionRate > 0 ? `${Math.round(completionRate)}%` : '–'}
        </span>
    </div>
);

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
                    <DuolingoFlame streakCount={currentStreak} />
                ) : (
                    <GrayFlame completionRate={completionRate} />
                )}

                <ProgressDot progress={completionRate} />
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
