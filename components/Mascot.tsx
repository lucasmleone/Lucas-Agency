import React, { useState, useEffect } from 'react';

interface MascotProps {
    completionRate: number;
    currentStreak: number;
    hasNewAchievement?: boolean;
    onClick: () => void;
}

// Animated flame component
const Flame: React.FC<{ size: 'small' | 'medium' | 'large'; delay?: number }> = ({ size, delay = 0 }) => {
    const heights = { small: 12, medium: 18, large: 24 };
    const widths = { small: 8, medium: 12, large: 16 };
    const h = heights[size];
    const w = widths[size];

    return (
        <svg
            viewBox={`0 0 ${w} ${h}`}
            width={w}
            height={h}
            className="animate-flicker"
            style={{ animationDelay: `${delay}ms` }}
        >
            <defs>
                <linearGradient id={`flameGrad-${size}`} x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#ff6b35" />
                    <stop offset="40%" stopColor="#ff9500" />
                    <stop offset="80%" stopColor="#ffcc00" />
                    <stop offset="100%" stopColor="#fff3b0" />
                </linearGradient>
            </defs>
            <path
                d={`M${w / 2} 0 
                    Q${w * 0.9} ${h * 0.3} ${w * 0.8} ${h * 0.5}
                    Q${w} ${h * 0.7} ${w * 0.7} ${h}
                    L${w * 0.3} ${h}
                    Q0 ${h * 0.7} ${w * 0.2} ${h * 0.5}
                    Q${w * 0.1} ${h * 0.3} ${w / 2} 0`}
                fill={`url(#flameGrad-${size})`}
            />
            {/* Inner glow */}
            <ellipse
                cx={w / 2}
                cy={h * 0.7}
                rx={w * 0.25}
                ry={h * 0.15}
                fill="#fff3b0"
                opacity="0.8"
            />
        </svg>
    );
};

// Progress ring component
const ProgressRing: React.FC<{ progress: number; size: number; strokeWidth: number }> = ({
    progress, size, strokeWidth
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const getColor = () => {
        if (progress >= 80) return '#22c55e'; // green
        if (progress >= 50) return '#eab308'; // yellow
        return '#94a3b8'; // gray
    };

    return (
        <svg width={size} height={size} className="absolute inset-0">
            {/* Background circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
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
                className="transition-all duration-500"
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
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (hasNewAchievement) {
            setShowBubble(true);
        }
    }, [hasNewAchievement]);

    // Determine flame intensity based on streak
    const getFlameConfig = () => {
        if (currentStreak >= 7) return { count: 3, size: 'large' as const };
        if (currentStreak >= 3) return { count: 2, size: 'medium' as const };
        if (currentStreak >= 1) return { count: 1, size: 'medium' as const };
        return { count: 0, size: 'small' as const };
    };

    const flameConfig = getFlameConfig();
    const hasStreak = currentStreak > 0;

    // Glow effect based on progress
    const getGlowClass = () => {
        if (completionRate >= 100) return 'shadow-[0_0_20px_rgba(34,197,94,0.6),0_0_40px_rgba(34,197,94,0.3)]';
        if (completionRate >= 80) return 'shadow-[0_0_15px_rgba(34,197,94,0.5)]';
        if (hasStreak) return 'shadow-[0_0_12px_rgba(251,146,60,0.5)]';
        return '';
    };

    return (
        <div className="relative">
            <button
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                    relative w-14 h-14 rounded-full flex items-center justify-center
                    bg-gradient-to-br from-slate-800 to-slate-900
                    hover:scale-105 transition-all duration-300
                    border-2 border-slate-700
                    ${getGlowClass()}
                `}
                title={`Racha: ${currentStreak} días | Progreso: ${Math.round(completionRate)}%`}
            >
                {/* Progress ring */}
                <ProgressRing progress={completionRate} size={56} strokeWidth={3} />

                {/* Center content */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                    {hasStreak ? (
                        <>
                            {/* Flames container */}
                            <div className="flex items-end justify-center -mb-1" style={{ height: 20 }}>
                                {flameConfig.count >= 2 && (
                                    <div className="-mr-1 transform -rotate-12">
                                        <Flame size="small" delay={100} />
                                    </div>
                                )}
                                <div className="relative z-10">
                                    <Flame size={flameConfig.size} />
                                </div>
                                {flameConfig.count >= 2 && (
                                    <div className="-ml-1 transform rotate-12">
                                        <Flame size="small" delay={200} />
                                    </div>
                                )}
                                {flameConfig.count >= 3 && (
                                    <>
                                        <div className="-ml-2 transform rotate-20">
                                            <Flame size="small" delay={300} />
                                        </div>
                                    </>
                                )}
                            </div>
                            {/* Streak number */}
                            <span className="text-white font-bold text-sm leading-none">
                                {currentStreak}
                            </span>
                        </>
                    ) : (
                        // No streak - show percentage
                        <div className="text-center">
                            <span className="text-white font-bold text-lg leading-none">
                                {completionRate > 0 ? Math.round(completionRate) : '–'}
                            </span>
                            {completionRate > 0 && (
                                <span className="text-gray-400 text-[8px] block">%</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Achievement sparkle for 100% */}
                {completionRate >= 100 && (
                    <div className="absolute -top-1 -right-1 text-yellow-400 animate-ping">
                        ✨
                    </div>
                )}
            </button>

            {/* Tooltip on hover */}
            {isHovered && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap z-50 border border-slate-700">
                    {hasStreak ? (
                        <span>🔥 Racha de {currentStreak} días</span>
                    ) : (
                        <span>Progreso del día: {Math.round(completionRate)}%</span>
                    )}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 transform rotate-45"></div>
                </div>
            )}

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
