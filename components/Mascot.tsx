import React, { useState, useEffect } from 'react';

// Mascot States based on completion
export type MascotState = 'idle' | 'working' | 'focused' | 'productive' | 'champion';

interface MascotProps {
    completionRate: number;
    currentStreak: number;
    hasNewAchievement?: boolean;
    onClick: () => void;
}

// L2-style tech mascot - professional geometric design
const L2Mascot: React.FC<{ state: MascotState; animate?: boolean }> = ({ state, animate = true }) => {
    // Colors based on state
    const getColors = () => {
        switch (state) {
            case 'idle':
                return { primary: '#94a3b8', secondary: '#64748b', glow: 'none' };
            case 'working':
                return { primary: '#3b82f6', secondary: '#2563eb', glow: 'rgba(59, 130, 246, 0.3)' };
            case 'focused':
                return { primary: '#3b82f6', secondary: '#1d4ed8', glow: 'rgba(59, 130, 246, 0.5)' };
            case 'productive':
                return { primary: '#22c55e', secondary: '#16a34a', glow: 'rgba(34, 197, 94, 0.5)' };
            case 'champion':
                return { primary: '#8b5cf6', secondary: '#7c3aed', glow: 'rgba(139, 92, 246, 0.6)' };
        }
    };

    const colors = getColors();

    // Binary animation for tech feel
    const [binaryBit, setBinaryBit] = useState('1');
    useEffect(() => {
        if (!animate || state === 'idle') return;
        const interval = setInterval(() => {
            setBinaryBit(prev => prev === '1' ? '0' : '1');
        }, 500);
        return () => clearInterval(interval);
    }, [animate, state]);

    return (
        <svg viewBox="0 0 40 40" className="w-full h-full">
            {/* Outer glow for active states */}
            {state !== 'idle' && (
                <circle
                    cx="20" cy="20" r="19"
                    fill="none"
                    stroke={colors.primary}
                    strokeWidth="1"
                    opacity="0.3"
                    className={animate ? 'animate-pulse' : ''}
                />
            )}

            {/* Main shape - L2 inspired rounded square */}
            <rect
                x="6" y="6"
                width="28" height="28"
                rx="8"
                fill={colors.primary}
                className={state === 'champion' ? 'animate-pulse' : ''}
            />

            {/* Inner highlight */}
            <rect
                x="8" y="8"
                width="24" height="12"
                rx="4"
                fill="white"
                opacity="0.15"
            />

            {/* L2 Text */}
            <text
                x="20" y="23"
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
                fontFamily="system-ui, -apple-system, sans-serif"
            >
                L2
            </text>

            {/* Binary indicator at bottom */}
            <text
                x="20" y="32"
                textAnchor="middle"
                fill="white"
                fontSize="6"
                fontFamily="monospace"
                opacity="0.7"
            >
                {state === 'idle' ? '---' : `${binaryBit}${binaryBit === '1' ? '0' : '1'}${binaryBit}`}
            </text>

            {/* Status indicator dot */}
            <circle
                cx="32" cy="8" r="4"
                fill={state === 'idle' ? '#94a3b8' : state === 'champion' ? '#fbbf24' : colors.secondary}
                stroke="white"
                strokeWidth="1.5"
            />

            {/* Sparkle for champion state */}
            {state === 'champion' && (
                <>
                    <polygon
                        points="32,2 33,6 37,6 34,8 35,12 32,10 29,12 30,8 27,6 31,6"
                        fill="#fbbf24"
                        className="animate-ping"
                        style={{ transformOrigin: '32px 8px', animationDuration: '1.5s' }}
                    />
                </>
            )}

            {/* Progress arc for non-idle states */}
            {state !== 'idle' && (
                <circle
                    cx="20" cy="20" r="17"
                    fill="none"
                    stroke={colors.secondary}
                    strokeWidth="2"
                    strokeDasharray={`${state === 'champion' ? 107 : state === 'productive' ? 85 : state === 'focused' ? 54 : 27} 107`}
                    strokeLinecap="round"
                    transform="rotate(-90 20 20)"
                    opacity="0.6"
                />
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
    const [state, setState] = useState<MascotState>('idle');
    const [showBubble, setShowBubble] = useState(false);

    // Determine state based on progress
    useEffect(() => {
        if (completionRate >= 100) {
            setState('champion');
        } else if (completionRate >= 80) {
            setState('productive');
        } else if (completionRate >= 50) {
            setState('focused');
        } else if (completionRate > 0) {
            setState('working');
        } else {
            setState('idle');
        }
    }, [completionRate]);

    // Show bubble for new achievements
    useEffect(() => {
        if (hasNewAchievement) {
            setShowBubble(true);
        }
    }, [hasNewAchievement]);

    // Get glow style based on state
    const getGlowStyle = () => {
        switch (state) {
            case 'champion':
                return 'shadow-[0_0_20px_rgba(139,92,246,0.6),0_0_40px_rgba(139,92,246,0.3)]';
            case 'productive':
                return 'shadow-[0_0_15px_rgba(34,197,94,0.5)]';
            case 'focused':
                return 'shadow-[0_0_12px_rgba(59,130,246,0.5)]';
            case 'working':
                return 'shadow-[0_0_8px_rgba(59,130,246,0.3)]';
            default:
                return '';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={onClick}
                className={`
                    relative w-11 h-11 rounded-xl flex items-center justify-center
                    bg-gradient-to-br from-slate-800 to-slate-900
                    hover:scale-105 transition-all duration-300
                    border border-slate-700
                    ${getGlowStyle()}
                `}
                title={`Progreso: ${Math.round(completionRate)}% | Racha: ${currentStreak} días`}
            >
                <L2Mascot state={state} />
            </button>

            {/* Notification bubble */}
            {showBubble && (
                <div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-bounce cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setShowBubble(false); onClick(); }}
                >
                    <span className="text-white text-[10px] font-bold">!</span>
                </div>
            )}

            {/* Streak badge */}
            {currentStreak > 0 && (
                <div className="absolute -bottom-1 -left-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[16px] text-center shadow-lg flex items-center gap-0.5">
                    <span>🔥</span>
                    <span>{currentStreak}</span>
                </div>
            )}
        </div>
    );
};

export default Mascot;
