import React from 'react';
import { Zap } from 'lucide-react';

interface ControlPanelProps {
    Q1: number;
    Q2: number;
    setQ1: (val: number) => void;
    setQ2: (val: number) => void;
    T1: number;
    T2: number;
    disabled?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ Q1, Q2, setQ1, setQ2, T1, T2, disabled = false }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            {/* Heater 1 Control */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-red-500/20 transition-colors duration-500" />

                <div className="flex justify-between items-center border-b border-white/10 pb-4 gap-4">
                    <h2 className="text-xl font-bold text-red-400 flex items-center gap-2 whitespace-nowrap">
                        <Zap className="w-5 h-5" /> Heater 1
                    </h2>
                    <div className="flex items-center gap-2 text-3xl font-mono text-white tracking-tighter">
                        {T1.toFixed(1)}<span className="text-sm text-slate-400 mt-2">°C</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex justify-between text-sm text-slate-300 font-medium">
                        <span>Power Output</span>
                        <span className="font-mono text-red-300">{Q1.toFixed(0)}%</span>
                    </div>
                    <div className="relative h-10 flex items-center">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={Q1}
                            onChange={(e) => setQ1(Number(e.target.value))}
                            disabled={disabled}
                            className={`w-full h-10 bg-transparent rounded-lg appearance-none cursor-pointer accent-red-500 z-10 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-slate-700/50 rounded-lg pointer-events-none" />
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-3 bg-gradient-to-r from-red-900/50 to-red-500 rounded-lg pointer-events-none"
                            style={{ width: `${Q1}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Heater 2 Control */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-500" />

                <div className="flex justify-between items-center border-b border-white/10 pb-4 gap-4">
                    <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2 whitespace-nowrap">
                        <Zap className="w-5 h-5" /> Heater 2
                    </h2>
                    <div className="flex items-center gap-2 text-3xl font-mono text-white tracking-tighter">
                        {T2.toFixed(1)}<span className="text-sm text-slate-400 mt-2">°C</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex justify-between text-sm text-slate-300 font-medium">
                        <span>Power Output</span>
                        <span className="font-mono text-blue-300">{Q2.toFixed(0)}%</span>
                    </div>
                    <div className="relative h-10 flex items-center">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={Q2}
                            onChange={(e) => setQ2(Number(e.target.value))}
                            disabled={disabled}
                            className={`w-full h-10 bg-transparent rounded-lg appearance-none cursor-pointer accent-blue-500 z-10 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-slate-700/50 rounded-lg pointer-events-none" />
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-3 bg-gradient-to-r from-blue-900/50 to-blue-500 rounded-lg pointer-events-none"
                            style={{ width: `${Q2}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
