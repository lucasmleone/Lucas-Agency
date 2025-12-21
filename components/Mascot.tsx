import React, { useState, useEffect } from 'react';

// Mascot States based on completion
export type MascotState = 'sleeping' | 'neutral' | 'happy' | 'excited' | 'ecstatic';

interface MascotProps {
    completionRate: number;
    currentStreak: number;
    hasNewAchievement?: boolean;
    onClick: () => void;
}

// Lion SVG with different expressions
const LionFace: React.FC<{ state: MascotState }> = ({ state }) => {
    // Eye expressions based on state
    const getEyeExpression = () => {
        switch (state) {
            case 'sleeping':
                return (
                    <>
                        {/* Closed eyes - curved lines */}
                        <path d="M12 14 Q14 12 16 14" stroke="#5D4037" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <path d="M24 14 Q26 12 28 14" stroke="#5D4037" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </>
                );
            case 'neutral':
                return (
                    <>
                        {/* Normal eyes */}
                        <circle cx="14" cy="14" r="3" fill="#5D4037" />
                        <circle cx="26" cy="14" r="3" fill="#5D4037" />
                        <circle cx="15" cy="13" r="1" fill="white" />
                        <circle cx="27" cy="13" r="1" fill="white" />
                    </>
                );
            case 'happy':
                return (
                    <>
                        {/* Happy eyes - slightly squinted */}
                        <ellipse cx="14" cy="14" rx="3" ry="2.5" fill="#5D4037" />
                        <ellipse cx="26" cy="14" rx="3" ry="2.5" fill="#5D4037" />
                        <circle cx="15" cy="13" r="1" fill="white" />
                        <circle cx="27" cy="13" r="1" fill="white" />
                    </>
                );
            case 'excited':
            case 'ecstatic':
                return (
                    <>
                        {/* Excited eyes - big and sparkling */}
                        <circle cx="14" cy="14" r="4" fill="#5D4037" />
                        <circle cx="26" cy="14" r="4" fill="#5D4037" />
                        <circle cx="15" cy="12" r="1.5" fill="white" />
                        <circle cx="27" cy="12" r="1.5" fill="white" />
                        <circle cx="13" cy="15" r="0.8" fill="white" />
                        <circle cx="25" cy="15" r="0.8" fill="white" />
                    </>
                );
        }
    };

    // Mouth expressions based on state
    const getMouthExpression = () => {
        switch (state) {
            case 'sleeping':
                return <path d="M17 22 Q20 23 23 22" stroke="#5D4037" strokeWidth="1.5" fill="none" strokeLinecap="round" />;
            case 'neutral':
                return <path d="M16 22 Q20 24 24 22" stroke="#5D4037" strokeWidth="1.5" fill="none" strokeLinecap="round" />;
            case 'happy':
                return <path d="M15 21 Q20 26 25 21" stroke="#5D4037" strokeWidth="1.5" fill="none" strokeLinecap="round" />;
            case 'excited':
                return (
                    <>
                        <path d="M14 20 Q20 28 26 20" stroke="#5D4037" strokeWidth="1.5" fill="#FF8A80" strokeLinecap="round" />
                        {/* Tongue */}
                        <ellipse cx="20" cy="24" rx="3" ry="2" fill="#FF5252" />
                    </>
                );
            case 'ecstatic':
                return (
                    <>
                        <path d="M12 19 Q20 30 28 19" stroke="#5D4037" strokeWidth="2" fill="#FF8A80" strokeLinecap="round" />
                        {/* Big smile with tongue */}
                        <ellipse cx="20" cy="25" rx="4" ry="3" fill="#FF5252" />
                    </>
                );
        }
    };

    return (
        <svg viewBox="0 0 40 40" className="w-full h-full">
            {/* Mane */}
            <circle cx="20" cy="20" r="18" fill="#D4A574" />
            <circle cx="20" cy="20" r="15" fill="#FFB74D" />

            {/* Face base */}
            <circle cx="20" cy="18" r="12" fill="#FFCC80" />

            {/* Ears */}
            <circle cx="8" cy="10" r="4" fill="#FFCC80" />
            <circle cx="8" cy="10" r="2" fill="#FFAB91" />
            <circle cx="32" cy="10" r="4" fill="#FFCC80" />
            <circle cx="32" cy="10" r="2" fill="#FFAB91" />

            {/* Nose */}
            <ellipse cx="20" cy="18" rx="3" ry="2" fill="#8D6E63" />
            <ellipse cx="20" cy="17.5" rx="1" ry="0.5" fill="#A1887F" />

            {/* Eyes */}
            {getEyeExpression()}

            {/* Mouth */}
            {getMouthExpression()}

            {/* Whisker dots */}
            <circle cx="13" cy="19" r="0.8" fill="#5D4037" />
            <circle cx="11" cy="17" r="0.8" fill="#5D4037" />
            <circle cx="27" cy="19" r="0.8" fill="#5D4037" />
            <circle cx="29" cy="17" r="0.8" fill="#5D4037" />

            {/* Blush for happy states */}
            {(state === 'happy' || state === 'excited' || state === 'ecstatic') && (
                <>
                    <ellipse cx="9" cy="18" rx="2.5" ry="1.5" fill="#FFAB91" opacity="0.7" />
                    <ellipse cx="31" cy="18" rx="2.5" ry="1.5" fill="#FFAB91" opacity="0.7" />
                </>
            )}

            {/* Crown for ecstatic state */}
            {state === 'ecstatic' && (
                <g transform="translate(12, -2)">
                    <polygon points="8,8 6,0 10,4 14,0 12,8" fill="#FFD700" stroke="#FFA000" strokeWidth="0.5" />
                </g>
            )}
        </svg>
    );
};

export const Mascot: React.FC<MascotProps> = ({
    completionRate,
    currentStreak,
    hasNewAchievement = false,
    onClick
}) => {
    const [state, setState] = useState<MascotState>('neutral');
    const [showBubble, setShowBubble] = useState(false);

    // Determine state based on progress
    useEffect(() => {
        if (completionRate >= 100) {
            setState('ecstatic');
        } else if (completionRate >= 80) {
            setState('excited');
        } else if (completionRate >= 50) {
            setState('happy');
        } else if (completionRate > 0) {
            setState('neutral');
        } else {
            setState('sleeping');
        }
    }, [completionRate]);

    // Show bubble for new achievements
    useEffect(() => {
        if (hasNewAchievement) {
            setShowBubble(true);
        }
    }, [hasNewAchievement]);

    // Get glow colors based on state
    const getGlowStyle = () => {
        switch (state) {
            case 'ecstatic':
                return 'shadow-[0_0_20px_rgba(255,215,0,0.8),0_0_40px_rgba(255,107,107,0.5),0_0_60px_rgba(168,85,247,0.3)]';
            case 'excited':
                return 'shadow-[0_0_15px_rgba(251,146,60,0.6),0_0_30px_rgba(245,158,11,0.3)]';
            case 'happy':
                return 'shadow-[0_0_10px_rgba(34,197,94,0.5)]';
            default:
                return '';
        }
    };

    // Get animation based on state
    const getAnimation = () => {
        switch (state) {
            case 'ecstatic':
                return 'animate-wiggle';
            case 'excited':
                return 'animate-bounce-slow';
            case 'happy':
                return 'animate-pulse-slow';
            default:
                return '';
        }
    };

    return (
        <div className="relative">
            {/* Rainbow glow background for ecstatic */}
            {state === 'ecstatic' && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 animate-spin-slow opacity-50 blur-md"
                    style={{ animationDuration: '3s' }} />
            )}

            <button
                onClick={onClick}
                className={`
                    relative w-12 h-12 rounded-full flex items-center justify-center
                    bg-gradient-to-br from-amber-100 to-orange-100
                    hover:scale-110 transition-all duration-300
                    border-2 border-amber-200
                    ${getGlowStyle()}
                    ${getAnimation()}
                `}
                title={`Racha: ${currentStreak} días | Progreso: ${Math.round(completionRate)}%`}
            >
                <LionFace state={state} />

                {/* Streak fire indicator */}
                {currentStreak > 0 && (
                    <span className="absolute -bottom-1 -right-1 text-sm animate-pulse">
                        🔥
                    </span>
                )}

                {/* Sparkles for ecstatic */}
                {state === 'ecstatic' && (
                    <>
                        <span className="absolute -top-1 -right-1 text-xs animate-ping">✨</span>
                        <span className="absolute -top-1 -left-1 text-xs animate-ping" style={{ animationDelay: '0.5s' }}>✨</span>
                    </>
                )}
            </button>

            {/* Notification bubble */}
            {showBubble && (
                <div
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-bounce cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setShowBubble(false); onClick(); }}
                >
                    <span className="text-white text-xs font-bold">!</span>
                </div>
            )}

            {/* Streak counter badge */}
            {currentStreak > 2 && (
                <div className="absolute -bottom-1 -left-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-1.5 rounded-full min-w-[18px] text-center shadow-lg">
                    {currentStreak}
                </div>
            )}
        </div>
    );
};

export default Mascot;
