import React, { useState, useEffect } from 'react';

interface MascotProps {
    completionRate: number;
    currentStreak: number;
    hasNewAchievement?: boolean;
    onClick: () => void;
}

// Clean fire SVG icon
const FireIcon: React.FC<{ size?: number; intensity?: 'low' | 'medium' | 'high' }> = ({
    size = 24,
    intensity = 'medium'
}) => {
    const colors = {
        low: { outer: '#f97316', inner: '#fbbf24', core: '#fef3c7' },
        medium: { outer: '#ea580c', inner: '#f97316', core: '#fcd34d' },
        high: { outer: '#dc2626', inner: '#f97316', core: '#fef08a' }
    };
    const c = colors[intensity];

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {/* Outer flame */}
            <path
                d="M12 2C12 2 9 7 9 11C9 13 10 14 10 14C10 14 9 12 10 10C11 8 12 6 12 6C12 6 13 8 14 10C15 12 14 14 14 14C14 14 15 13 15 11C15 7 12 2 12 2Z"
                fill={c.outer}
            />
            {/* Middle flame */}
            <path
                d="M12 6C12 6 10 9 10 12C10 14 11 15 11 15C11 15 10.5 13.5 11 12C11.5 10.5 12 9 12 9C12 9 12.5 10.5 13 12C13.5 13.5 13 15 13 15C13 15 14 14 14 12C14 9 12 6 12 6Z"
                fill={c.inner}
            />
            {/* Core glow */}
            <ellipse cx="12" cy="16" rx="2" ry="3" fill={c.core} />
            {/* Base */}
            <path
                d="M8 20C8 18 10 16 12 16C14 16 16 18 16 20C16 22 14 22 12 22C10 22 8 22 8 20Z"
                fill={c.outer}
            />
        </svg>
    );
};

// Progress ring
const ProgressRing: React.FC<{ progress: number; size: number; strokeWidth: number }> = ({
    progress, size, strokeWidth
}) => {
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
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth={strokeWidth}
            />
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
    const intensity = currentStreak >= 7 ? 'high' : currentStreak >= 3 ? 'medium' : 'low';

    const getGlowClass = () => {
        if (completionRate >= 100) return 'shadow-[0_0_20px_rgba(34,197,94,0.6)]';
        if (completionRate >= 80) return 'shadow-[0_0_15px_rgba(34,197,94,0.4)]';
        if (hasStreak) return 'shadow-[0_0_12px_rgba(249,115,22,0.5)]';
        return '';
    };

    return (
        <div className="relative">
            <button
                onClick={onClick}
                className={`
                    relative w-12 h-12 rounded-full flex items-center justify-center
                    bg-slate-800 hover:bg-slate-700
                    hover:scale-105 transition-all duration-300
                    border-2 border-slate-600
                    ${getGlowClass()}
                `}
                title={`Racha: ${currentStreak} días | Progreso: ${Math.round(completionRate)}%`}
            >
                <ProgressRing progress={completionRate} size={48} strokeWidth={3} />

                <div className="relative z-10 flex flex-col items-center justify-center">
                    {hasStreak ? (
                        <>
                            <FireIcon size={20} intensity={intensity} />
                            <span className="text-white font-bold text-xs -mt-1">{currentStreak}</span>
                        </>
                    ) : (
                        <span className="text-white font-bold text-sm">
                            {completionRate > 0 ? `${Math.round(completionRate)}%` : '–'}
                        </span>
                    )}
                </div>

                {completionRate >= 100 && (
                    <span className="absolute -top-0.5 -right-0.5 text-xs">✨</span>
                )}
            </button>

            {showBubble && (
                <div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-bounce cursor-pointer z-20"
                    onClick={(e) => { e.stopPropagation(); setShowBubble(false); onClick(); }}
                >
                    <span className="text-white text-[10px] font-bold">!</span>
                </div>
            )}
        </div>
    );
};

export default Mascot;
