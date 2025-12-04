import React from 'react';
import { motion } from 'framer-motion';

interface TCLabVisualizerProps {
    T1: number;
    T2: number;
    Q1: number;
    Q2: number;
}

export const TCLabVisualizer: React.FC<TCLabVisualizerProps> = ({ T1, T2, Q1, Q2 }) => {
    // Calculate heat glow intensity based on temperature and power
    const getHeatGlow = (temp: number, power: number) => {
        const intensity = Math.min(1, Math.max(0, (temp - 25) / 55));
        const powerGlow = power / 100;
        return {
            background: `radial-gradient(circle, rgba(255,${Math.max(0, 100 - intensity * 100)},0,${0.2 + powerGlow * 0.4}) 0%, transparent 60%)`,
            opacity: 0.4 + intensity * 0.6
        };
    };

    const isHot = T1 > 35 || T2 > 35;

    return (
        <div className="relative w-full max-w-md aspect-[4/3] p-4">
            <div className="relative w-full h-full" style={{ perspective: '800px' }}>

                {/* Main PCB Shield */}
                <div
                    className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
                    style={{
                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
                        transform: 'rotateX(3deg)',
                        transformOrigin: 'bottom'
                    }}
                >
                    {/* PCB Texture overlay */}
                    <div className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%23fff' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
                            backgroundSize: '20px 20px'
                        }}
                    />

                    {/* Hot LED Indicator - Top Left */}
                    <div className="absolute top-6 left-4 flex items-center gap-2">
                        <motion.div
                            className="w-3 h-3 rounded-full"
                            animate={{
                                backgroundColor: isHot ? '#ef4444' : '#330d0dff',
                                boxShadow: isHot ? '0 0 12px 4px rgba(239, 68, 68, 0.6)' : 'none'
                            }}
                            transition={{ duration: 0.3 }}
                        />
                        <span className={`text-xs font-bold ${isHot ? 'text-red-200' : 'text-red-900'}`}>
                            {isHot ? 'HOT!' : ''}
                        </span>
                    </div>

                    {/* Title - Top Center */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
                        <div className="text-white/90 font-bold text-sm tracking-widest uppercase" style={{ fontFamily: 'monospace' }}>
                            Temperature Control Lab
                        </div>
                    </div>

                    {/* Heater 1 Module */}
                    <div className="absolute top-[25%] left-[25%] -translate-x-1/2 flex flex-col items-center">
                        {/* Heat glow effect */}
                        <motion.div
                            className="absolute w-28 h-28 rounded-full pointer-events-none -z-10"
                            style={{ top: '-20%', left: '-30%' }}
                            animate={getHeatGlow(T1, Q1)}
                        />

                        {/* Heater Label */}
                        <div className="text-white font-bold text-sm mb-2">Heater 1</div>

                        {/* TO-220 Heatsink */}
                        <div className="w-16 h-14 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 rounded-t-md relative shadow-lg border border-gray-500">
                            {/* Fins */}
                            <div className="absolute inset-x-1 top-1 bottom-3 flex justify-between">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-0.5 h-full bg-gray-500 rounded-full" />
                                ))}
                            </div>
                            {/* Screw */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border border-gray-400 flex items-center justify-center">
                                <div className="w-3 h-0.5 bg-gray-600" />
                                <div className="w-3 h-0.5 bg-gray-600 absolute rotate-90" />
                            </div>
                        </div>

                        {/* Transistor body */}
                        <motion.div
                            className="w-12 h-8 bg-gray-900 rounded-b shadow-md"
                            animate={{
                                boxShadow: Q1 > 0 ? `0 0 ${Q1 * 0.3}px ${Q1 * 0.15}px rgba(255, 100, 0, ${Q1 / 150})` : 'none'
                            }}
                        />

                        {/* Legs */}
                        <div className="flex gap-2">
                            <div className="w-1 h-2 bg-gray-400 rounded-b-sm" />
                            <div className="w-1 h-2 bg-gray-400 rounded-b-sm" />
                            <div className="w-1 h-2 bg-gray-400 rounded-b-sm" />
                        </div>

                        {/* Sensor label */}
                        <div className="mt-2 text-white/70 text-xs font-mono">T1</div>
                    </div>

                    {/* Heater 2 Module */}
                    <div className="absolute top-[25%] right-[25%] translate-x-1/2 flex flex-col items-center">
                        {/* Heat glow effect */}
                        <motion.div
                            className="absolute w-28 h-28 rounded-full pointer-events-none -z-10"
                            style={{ top: '-20%', right: '-30%' }}
                            animate={getHeatGlow(T2, Q2)}
                        />

                        {/* Heater Label */}
                        <div className="text-white font-bold text-sm mb-2">Heater 2</div>

                        {/* TO-220 Heatsink */}
                        <div className="w-16 h-14 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 rounded-t-md relative shadow-lg border border-gray-500">
                            {/* Fins */}
                            <div className="absolute inset-x-1 top-1 bottom-3 flex justify-between">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-0.5 h-full bg-gray-500 rounded-full" />
                                ))}
                            </div>
                            {/* Screw */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border border-gray-400 flex items-center justify-center">
                                <div className="w-3 h-0.5 bg-gray-600" />
                                <div className="w-3 h-0.5 bg-gray-600 absolute rotate-90" />
                            </div>
                        </div>

                        {/* Transistor body */}
                        <motion.div
                            className="w-12 h-8 bg-gray-900 rounded-b shadow-md"
                            animate={{
                                boxShadow: Q2 > 0 ? `0 0 ${Q2 * 0.3}px ${Q2 * 0.15}px rgba(255, 100, 0, ${Q2 / 150})` : 'none'
                            }}
                        />

                        {/* Legs */}
                        <div className="flex gap-2">
                            <div className="w-1 h-2 bg-gray-400 rounded-b-sm" />
                            <div className="w-1 h-2 bg-gray-400 rounded-b-sm" />
                            <div className="w-1 h-2 bg-gray-400 rounded-b-sm" />
                        </div>

                        {/* Sensor label */}
                        <div className="mt-2 text-white/70 text-xs font-mono">T2</div>
                    </div>

                    {/* URL - Bottom Center */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                        <div className="text-white/50 text-xs" style={{ fontFamily: 'monospace' }}>
                            apmonitor.com/heat.htm
                        </div>
                    </div>

                    {/* Header Pins (decorative) */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="w-2 h-3 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-sm" />
                        ))}
                    </div>

                    {/* Corner mounting holes */}
                    {[[5, 5], [95, 5], [5, 95], [95, 95]].map(([x, y], i) => (
                        <div
                            key={i}
                            className="absolute w-3 h-3 rounded-full bg-slate-900/80 border border-gray-500/50"
                            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                        />
                    ))}

                    {/* Subtle traces */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
                        <path d="M 10% 60% Q 18% 50% 25% 55%" stroke="#93c5fd" strokeWidth="1.5" fill="none" />
                        <path d="M 90% 60% Q 82% 50% 75% 55%" stroke="#93c5fd" strokeWidth="1.5" fill="none" />
                    </svg>
                </div>
            </div>
        </div>
    );
};
