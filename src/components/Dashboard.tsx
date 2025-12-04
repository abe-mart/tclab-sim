import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TCLabPhysics, DEFAULT_PARAMS } from '../lib/tclab-physics';
import type { PhysicsParams } from '../lib/tclab-physics';
import { TCLabVisualizer } from './TCLabVisualizer';
import { RealTimePlot } from './RealTimePlot';
import { ControlPanel } from './ControlPanel';
import { SettingsModal } from './SettingsModal';
import { Activity, Clock, Play, Pause, RotateCcw, Download, Settings, Target } from 'lucide-react';

const SIM_STEP = 0.1; // Physics step size in seconds
const UPDATE_RATE = 100; // Update UI every 100ms

// PID Controller class
class PIDController {
    Kp: number;
    Ki: number;
    Kd: number;
    setpoint: number;
    integral: number = 0;
    prevMeasurement: number = 0; // Store previous measurement for derivative on PV
    outputMin: number = 0;
    outputMax: number = 100;

    constructor(Kp: number = 2.0, Ki: number = 0.1, Kd: number = 1.0, setpoint: number = 40) {
        this.Kp = Kp;
        this.Ki = Ki;
        this.Kd = Kd;
        this.setpoint = setpoint;
    }

    compute(measurement: number, dt: number): number {
        const error = this.setpoint - measurement;

        // Derivative on Measurement (prevents derivative kick on setpoint change)
        // D = -Kd * d(PV)/dt
        const derivative = (measurement - this.prevMeasurement) / dt;
        this.prevMeasurement = measurement;

        // Calculate P and D terms first
        const P = this.Kp * error;
        const D = -this.Kd * derivative;

        // Tentative output with current integral
        let output = P + this.Ki * this.integral + D;

        // Anti-windup: Conditional Integration
        // Only integrate if:
        // 1. Output is not saturated
        // 2. OR Output is saturated but error is trying to bring it back (sign opposite to saturation)
        const isSaturatedMax = output > this.outputMax;
        const isSaturatedMin = output < this.outputMin;

        if (!isSaturatedMax && !isSaturatedMin) {
            this.integral += error * dt;
        } else if (isSaturatedMax && error < 0) {
            // Saturated max, but error is negative (trying to decrease), so allow integration
            this.integral += error * dt;
        } else if (isSaturatedMin && error > 0) {
            // Saturated min, but error is positive (trying to increase), so allow integration
            this.integral += error * dt;
        }

        // Re-calculate output with potentially updated integral
        output = P + this.Ki * this.integral + D;

        return Math.max(this.outputMin, Math.min(this.outputMax, output));
    }

    // Bumpless transfer initialization
    initialize(currentOutput: number, currentMeasurement: number) {
        this.prevMeasurement = currentMeasurement;
        const error = this.setpoint - currentMeasurement;
        // Initialize integral such that P + I + D = currentOutput
        // Assuming D is zero at initialization (steady state) or we accept a small bump from D
        // I = (Output - P) / Ki
        // Note: We store integral as the *accumulated value* (sum of error*dt), so the term is Ki * integral
        // Therefore integral_state = (Output - P) / Ki
        if (this.Ki !== 0) {
            this.integral = (currentOutput - this.Kp * error) / this.Ki;
        } else {
            this.integral = 0;
        }
    }

    reset() {
        this.integral = 0;
        this.prevMeasurement = 0;
    }
}

interface DataPoint {
    time: number;
    T1: number;
    T2: number;
    Q1: number;
    Q2: number;
}

const TIME_WINDOWS = [
    { label: '1 Min', value: 60 },
    { label: '5 Min', value: 300 },
    { label: '10 Min', value: 600 },
    { label: 'All', value: Infinity },
];

export const Dashboard: React.FC = () => {
    const simRef = useRef<TCLabPhysics>(new TCLabPhysics(21));
    const fullHistoryRef = useRef<DataPoint[]>([]); // Full history for export
    const pid1Ref = useRef<PIDController>(new PIDController());
    const pid2Ref = useRef<PIDController>(new PIDController());

    // Refs for loop state to avoid restarting interval
    const stateRef = useRef({
        q1: 0,
        q2: 0,
        time: 0,
        paused: false,
        pidMode: false,
        plotWindow: 60
    });

    // UI State
    const [time, setTime] = useState(0);
    const [data, setData] = useState<DataPoint[]>([]);
    const [q1, setQ1] = useState(0);
    const [q2, setQ2] = useState(0);
    const [t1, setT1] = useState(21);
    const [t2, setT2] = useState(21);
    const [paused, setPaused] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [physicsParams, setPhysicsParams] = useState<PhysicsParams>(DEFAULT_PARAMS);
    const [plotWindow, setPlotWindow] = useState(60);

    // PID State
    const [pidMode, setPidMode] = useState(false);
    const [setpoint1, setSetpoint1] = useState(40);
    const [setpoint2, setSetpoint2] = useState(40);
    const [pidParams, setPidParams] = useState({ Kp: 2.0, Ki: 0.1, Kd: 1.0 });

    // Sync UI state to refs
    useEffect(() => {
        stateRef.current.q1 = q1;
        stateRef.current.q2 = q2;
        stateRef.current.paused = paused;
        stateRef.current.pidMode = pidMode;
        stateRef.current.plotWindow = plotWindow;
    }, [q1, q2, paused, pidMode, plotWindow]);

    // Update PID controllers when params change
    useEffect(() => {
        pid1Ref.current.Kp = pidParams.Kp;
        pid1Ref.current.Ki = pidParams.Ki;
        pid1Ref.current.Kd = pidParams.Kd;
        pid1Ref.current.setpoint = setpoint1;

        pid2Ref.current.Kp = pidParams.Kp;
        pid2Ref.current.Ki = pidParams.Ki;
        pid2Ref.current.Kd = pidParams.Kd;
        pid2Ref.current.setpoint = setpoint2;
    }, [pidParams, setpoint1, setpoint2]);

    useEffect(() => {
        const interval = setInterval(() => {
            // Read from refs
            const { time, paused, pidMode, plotWindow } = stateRef.current;
            let { q1, q2 } = stateRef.current;

            if (paused) return;

            const dt = SIM_STEP;
            const now = simRef.current.getSensors();

            // Compute PID outputs if in PID mode
            if (pidMode) {
                q1 = pid1Ref.current.compute(now.T1, dt);
                q2 = pid2Ref.current.compute(now.T2, dt);
                setQ1(q1);
                setQ2(q2);
                stateRef.current.q1 = q1;
                stateRef.current.q2 = q2;
            }

            // Step physics
            simRef.current.setHeaters(q1, q2);
            simRef.current.step(dt);

            const afterStep = simRef.current.getSensors();
            const newTime = time + dt;

            // Update refs
            stateRef.current.time = newTime;

            // Update UI State
            setT1(afterStep.T1);
            setT2(afterStep.T2);
            setTime(newTime);

            const newPoint: DataPoint = {
                time: newTime,
                T1: afterStep.T1,
                T2: afterStep.T2,
                Q1: q1,
                Q2: q2
            };

            // Add to full history
            fullHistoryRef.current.push(newPoint);

            // Update display data based on plot window
            // We slice from fullHistoryRef to ensure we can expand/contract window dynamically
            const history = fullHistoryRef.current;
            if (plotWindow === Infinity) {
                setData([...history]);
            } else {
                // Calculate how many points to keep (10 points per second)
                const pointsToKeep = Math.floor(plotWindow / SIM_STEP);
                if (history.length > pointsToKeep) {
                    setData(history.slice(history.length - pointsToKeep));
                } else {
                    setData([...history]);
                }
            }

        }, UPDATE_RATE);

        return () => clearInterval(interval);
    }, []);

    // When plot window changes, immediately update data view
    useEffect(() => {
        const history = fullHistoryRef.current;
        if (plotWindow === Infinity) {
            setData([...history]);
        } else {
            const pointsToKeep = Math.floor(plotWindow / SIM_STEP);
            if (history.length > pointsToKeep) {
                setData(history.slice(history.length - pointsToKeep));
            } else {
                setData([...history]);
            }
        }
    }, [plotWindow]);

    const handleReset = useCallback(() => {
        simRef.current = new TCLabPhysics(21);
        stateRef.current.time = 0;
        fullHistoryRef.current = []; // Clear full history
        pid1Ref.current.reset();
        pid2Ref.current.reset();
        setTime(0);
        setData([]);
        setT1(21);
        setT2(21);
        setQ1(0);
        setQ2(0);
    }, []);

    const handleExport = useCallback(() => {
        // Export FULL history, not just display data
        const history = fullHistoryRef.current;
        const headers = ['Time,T1,T2,Q1,Q2'];
        const rows = history.map(d => `${d.time.toFixed(2)},${d.T1.toFixed(2)},${d.T2.toFixed(2)},${d.Q1.toFixed(1)},${d.Q2.toFixed(1)}`);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `tclab_data_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const handleSettingsSave = useCallback((params: PhysicsParams) => {
        setPhysicsParams(params);
        simRef.current.setParameters(params);
    }, []);

    const togglePidMode = useCallback(() => {
        const newMode = !pidMode;
        setPidMode(newMode);
        if (newMode) {
            // Bumpless Transfer: Initialize PID controllers with current state
            // We need current Q and T values
            const currentQ1 = stateRef.current.q1;
            const currentQ2 = stateRef.current.q2;
            const currentT1 = simRef.current.getSensors().T1;
            const currentT2 = simRef.current.getSensors().T2;

            pid1Ref.current.initialize(currentQ1, currentT1);
            pid2Ref.current.initialize(currentQ2, currentT2);
        }
    }, [pidMode]);

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 p-3 md:p-4 flex flex-col gap-4 font-sans selection:bg-blue-500/30">
            {/* Background Gradient Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/20 rounded-full blur-[120px]" />
            </div>

            <header className="w-full max-w-full flex flex-col md:flex-row justify-between items-center border-b border-white/5 pb-3 z-10 backdrop-blur-sm bg-[#0f172a]/50 sticky top-0 px-3 rounded-b-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Activity className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-white">
                            TCLab <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Simulator</span>
                        </h1>
                        <p className="text-slate-400 text-xs font-medium">High-Fidelity Process Control Digital Twin</p>
                    </div>
                </div>
                <div className="text-right mt-3 md:mt-0 flex items-center gap-4">
                    {/* Time Window Selector */}
                    <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5">
                        {TIME_WINDOWS.map((window) => (
                            <button
                                key={window.label}
                                onClick={() => setPlotWindow(window.value)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${plotWindow === window.value
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {window.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPaused(!paused)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10"
                            title={paused ? "Resume" : "Pause"}
                        >
                            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleReset}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10"
                            title="Reset Simulation"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleExport}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10"
                            title="Export Full History"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10"
                            title="Settings"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex flex-col items-end border-l border-white/10 pl-4">
                        <div className="text-xs text-slate-500 font-bold tracking-wider uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Simulation Time
                        </div>
                        <div className="text-xl font-mono text-white font-bold tabular-nums">{time.toFixed(1)}s</div>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-full grid grid-cols-1 xl:grid-cols-12 gap-4 z-10">
                {/* Left Column: Visualizer & Controls */}
                <div className="xl:col-span-5 flex flex-col gap-3">
                    {/* Visualizer Card */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-2 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                        <TCLabVisualizer T1={t1} T2={t2} Q1={q1} Q2={q2} />
                    </div>

                    <ControlPanel
                        Q1={q1} Q2={q2}
                        setQ1={setQ1} setQ2={setQ2}
                        T1={t1} T2={t2}
                        disabled={pidMode}
                    />

                    {/* PID Control Panel */}
                    <div className={`backdrop-blur-xl rounded-2xl border shadow-2xl p-4 transition-all duration-300 ${pidMode
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-white/5 border-white/10'
                        }`}>
                        {/* Header with Toggle */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Target className={`w-5 h-5 transition-colors ${pidMode ? 'text-green-400' : 'text-slate-400'}`} />
                                <div>
                                    <h3 className="font-bold text-white text-sm">Control Mode</h3>
                                    <p className="text-xs text-slate-400">{pidMode ? 'Automatic PID Control' : 'Manual Heater Control'}</p>
                                </div>
                            </div>

                            {/* Toggle Switch */}
                            <button
                                onClick={togglePidMode}
                                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${pidMode ? 'bg-green-600' : 'bg-slate-600'
                                    }`}
                                aria-label="Toggle PID Mode"
                            >
                                <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${pidMode ? 'translate-x-7' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        {/* Mode Labels */}
                        <div className="flex justify-between text-xs mb-3">
                            <span className={`font-medium transition-colors ${!pidMode ? 'text-blue-400' : 'text-slate-500'}`}>
                                Manual
                            </span>
                            <span className={`font-medium transition-colors ${pidMode ? 'text-green-400' : 'text-slate-500'}`}>
                                PID Auto
                            </span>
                        </div>

                        {/* PID Settings - only show when PID is active */}
                        {pidMode && (
                            <div className="space-y-3 pt-3 border-t border-white/10">
                                {/* Setpoints */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Setpoint T1 (°C)</label>
                                        <input
                                            type="number"
                                            value={setpoint1}
                                            onChange={e => setSetpoint1(parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded-lg text-white font-mono text-sm"
                                            min={20} max={100} step={1}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Setpoint T2 (°C)</label>
                                        <input
                                            type="number"
                                            value={setpoint2}
                                            onChange={e => setSetpoint2(parseFloat(e.target.value) || 0)}
                                            className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded-lg text-white font-mono text-sm"
                                            min={20} max={100} step={1}
                                        />
                                    </div>
                                </div>

                                {/* PID Gains */}
                                <div>
                                    <label className="text-xs text-slate-400 mb-1.5 block">PID Tuning Parameters</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Kp</label>
                                            <input
                                                type="number"
                                                value={pidParams.Kp}
                                                onChange={e => setPidParams(p => ({ ...p, Kp: parseFloat(e.target.value) || 0 }))}
                                                className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded-lg text-white font-mono text-xs"
                                                min={0} max={50} step={0.1}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Ki</label>
                                            <input
                                                type="number"
                                                value={pidParams.Ki}
                                                onChange={e => setPidParams(p => ({ ...p, Ki: parseFloat(e.target.value) || 0 }))}
                                                className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded-lg text-white font-mono text-xs"
                                                min={0} max={5} step={0.01}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Kd</label>
                                            <input
                                                type="number"
                                                value={pidParams.Kd}
                                                onChange={e => setPidParams(p => ({ ...p, Kd: parseFloat(e.target.value) || 0 }))}
                                                className="w-full px-2 py-1.5 bg-black/30 border border-white/10 rounded-lg text-white font-mono text-xs"
                                                min={0} max={50} step={0.1}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Manual mode hint */}
                        {!pidMode && (
                            <div className="pt-3 border-t border-white/10">
                                <p className="text-xs text-slate-500 text-center">
                                    Enable PID mode for automatic temperature control
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Plots & Stats */}
                <div className="xl:col-span-7 flex flex-col gap-3">
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-4 flex flex-col gap-3 h-full">
                        <div className="flex-grow min-h-[250px] flex flex-col gap-4">
                            {/* Temperature Plot */}
                            <div className="flex-1 min-h-0">
                                <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Temperature</h3>
                                <RealTimePlot
                                    data={data}
                                    yAxisLabel="Temp (°C)"
                                    yDomain={[
                                        (dataMin: number) => Math.floor(dataMin - 2),
                                        (dataMax: number) => Math.ceil(dataMax + 2)
                                    ]}
                                    lines={[
                                        { dataKey: 'T1', stroke: '#ef4444', name: 'T1' },
                                        { dataKey: 'T2', stroke: '#3b82f6', name: 'T2' }
                                    ]}
                                />
                            </div>

                            {/* Power Plot */}
                            <div className="flex-1 min-h-0">
                                <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Heater Power</h3>
                                <RealTimePlot
                                    data={data}
                                    yAxisLabel="Power (%)"
                                    yDomain={[0, 100]}
                                    lines={[
                                        { dataKey: 'Q1', stroke: '#f97316', name: 'Q1', type: 'step', strokeDasharray: '5 5' },
                                        { dataKey: 'Q2', stroke: '#06b6d4', name: 'Q2', type: 'step', strokeDasharray: '5 5' }
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stats / Debug */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white/5 backdrop-blur p-3 rounded-xl border border-white/10">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Ambient Temp</div>
                            <div className="text-base font-mono text-slate-300">{(simRef.current.Ta - 273.15).toFixed(1)}°C</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur p-3 rounded-xl border border-white/10">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Data Points</div>
                            <div className="text-base font-mono text-slate-300">{fullHistoryRef.current.length}</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur p-3 rounded-xl border border-white/10">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Control Mode</div>
                            <div className={`text-lg font-mono ${pidMode ? 'text-green-400' : 'text-blue-400'}`}>
                                {pidMode ? 'PID' : 'Manual'}
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur p-3 rounded-xl border border-white/10">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Status</div>
                            <div className={`text-lg font-mono flex items-center gap-2 ${paused ? 'text-yellow-400' : 'text-green-400'}`}>
                                <span className={`w-2 h-2 rounded-full ${paused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
                                {paused ? 'Paused' : 'Active'}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                params={physicsParams}
                onSave={handleSettingsSave}
            />
        </div>
    );
};
