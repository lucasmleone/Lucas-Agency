import React, { useState, useEffect } from 'react';

interface MascotProps {
    completionRate: number;
    currentStreak: number;
    hasNewAchievement?: boolean;
    onClick: () => void;
}

// Larger, more visible fire SVG
const FireIcon: React.FC<{ streakCount: number }> = ({ streakCount }) => {
    // Fire grows with streak
    const baseSize = 28;
    const size = Math.min(baseSize + streakCount * 2, 40);

    // Intensity changes color
    const getColors = () => {
        if (streakCount >= 7) return { outer: '#dc2626', mid: '#f97316', inner: '#fbbf24', core: '#fef3c7' };
        if (streakCount >= 3) return { outer: '#ea580c', mid: '#f97316', inner: '#fbbf24', core: '#fef3c7' };
        return { outer: '#f97316', mid: '#fb923c', inner: '#fcd34d', core: '#fef3c7' };
    };
    const c = getColors();

    return (
        <svg width={size} height={size} viewBox="0 0 32 32" className="drop-shadow-lg">
            {/* Outer glow */}
            <defs>
                <filter id="fireGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <g filter="url(#fireGlow)">
                {/* Outer flame */}
                <path
                    d="M16 2C16 2 10 10 10 18C10 22 12 25 12 25C12 25 11 21 13 17C15 13 16 10 16 10C16 10 17 13 19 17C21 21 20 25 20 25C20 25 22 22 22 18C22 10 16 2 16 2Z"
                    fill={c.outer}
                    className="animate-flicker"
                />
                {/* Middle flame */}
                <path
                    d="M16 8C16 8 12 14 12 20C12 23 14 25 14 25C14 25 13 22 14.5 19C16 16 16 13 16 13C16 13 16 16 17.5 19C19 22 18 25 18 25C18 25 20 23 20 20C20 14 16 8 16 8Z"
                    fill={c.mid}
                    className="animate-flicker"
                    style={{ animationDelay: '0.1s' }}
                />
                {/* Inner flame */}
                <path
                    d="M16 14C16 14 14 18 14 22C14 24 15 25 15 25C15 25 14.5 23 15.5 21C16.5 19 16 17 16 17C16 17 15.5 19 16.5 21C17.5 23 17 25 17 25C17 25 18 24 18 22C18 18 16 14 16 14Z"
                    fill={c.inner}
                    className="animate-flicker"
                    style={{ animationDelay: '0.2s' }}
                />
                {/* Core glow */}
                <ellipse cx="16" cy="24" rx="2.5" ry="3" fill={c.core} opacity="0.9" />
            </g>

            {/* Extra flames for high streaks */}
            {streakCount >= 5 && (
                <>
                    <path
                        d="M8 18C8 18 6 12 8 8C8 8 10 12 9 16C8.5 18 8 18 8 18Z"
                        fill={c.mid}
                        opacity="0.7"
                        className="animate-flicker"
                        style={{ animationDelay: '0.3s' }}
                    />
                    <path
                        d="M24 18C24 18 26 12 24 8C24 8 22 12 23 16C23.5 18 24 18 24 18Z"
                        fill={c.mid}
                        opacity="0.7"
                        className="animate-flicker"
                        style={{ animationDelay: '0.4s' }}
                    />
                </>
            )}
        </svg>
    );
};

// Progress ring - thicker and more visible
const ProgressRing: React.FC<{ progress: number; size: number }> = ({ progress, size }) => {
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const getColor = () => {
        if (progress >= 100) return '#22c55e';
        if (progress >= 80) return '#22c55e';
        if (progress >= 50) return '#eab308';
        if (progress > 0) return '#f97316';
        return '#475569';
    };

    return (
        <svg width={size} height={size} className="absolute inset-0">
            {/* Background track */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#334155"
                strokeWidth={strokeWidth}
            />
            {/* Progress arc */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={getColor()}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="transition-all duration-700 ease-out"
                style={{
                    filter: progress >= 80 ? 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.5))' : 'none'
                }}
            />
        </svg>
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

    const getGlowClass = () => {
        if (completionRate >= 100) return 'shadow-[0_0_25px_rgba(34,197,94,0.7)]';
        if (completionRate >= 80) return 'shadow-[0_0_20px_rgba(34,197,94,0.5)]';
        if (hasStreak) return 'shadow-[0_0_15px_rgba(249,115,22,0.6)]';
        return 'shadow-md';
    };

    // Larger size for visibility
    const buttonSize = 60;

    return (
        <div className="relative">
            <button
                onClick={onClick}
                className={`
                    relative flex items-center justify-center
                    bg-slate-800 hover:bg-slate-700
                    hover:scale-105 transition-all duration-300
                    rounded-full border-2 border-slate-600
                    ${getGlowClass()}
                `}
                style={{ width: buttonSize, height: buttonSize }}
                title={`🔥 Racha: ${currentStreak} días | Progreso: ${Math.round(completionRate)}%`}
            >
                <ProgressRing progress={completionRate} size={buttonSize} />

                <div className="relative z-10 flex flex-col items-center justify-center">
                    {hasStreak ? (
                        <div className="relative">
                            <FireIcon streakCount={currentStreak} />
                            {/* Streak number overlay */}
                            <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '4px' }}>
                                <span
                                    className="text-white font-black text-lg"
                                    style={{
                                        textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)'
                                    }}
                                >
                                    {currentStreak}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <span className="text-white font-bold text-lg">
                                {completionRate > 0 ? Math.round(completionRate) : '–'}
                            </span>
                            {completionRate > 0 && (
                                <span className="text-gray-400 text-xs">%</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Achievement sparkle */}
                {completionRate >= 100 && (
                    <span className="absolute -top-1 -right-1 text-lg animate-pulse">✨</span>
                )}
            </button>

            {/* Notification bubble */}
            {showBubble && (
                <div
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-bounce cursor-pointer z-20"
                    onClick={(e) => { e.stopPropagation(); setShowBubble(false); onClick(); }}
                >
                    <span className="text-white text-xs font-bold">!</span>
                </div>
            )}
        </div>
    );
};

export default Mascot;
