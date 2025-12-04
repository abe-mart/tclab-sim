import React, { useState, useEffect } from 'react';
import { X, Settings, RotateCcw } from 'lucide-react';
import { DEFAULT_PARAMS } from '../lib/tclab-physics';
import type { PhysicsParams } from '../lib/tclab-physics';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    params: PhysicsParams;
    onSave: (params: PhysicsParams) => void;
}

interface ParamConfig {
    key: keyof PhysicsParams;
    label: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    description: string;
}

const PARAM_CONFIGS: ParamConfig[] = [
    { key: 'U', label: 'Heat Transfer Coeff (U)', unit: 'W/m²·K', min: 1, max: 50, step: 0.5, description: 'Convective heat transfer coefficient' },
    { key: 'mass', label: 'Mass', unit: 'kg', min: 0.001, max: 0.02, step: 0.001, description: 'Mass of heater element' },
    { key: 'Cp', label: 'Specific Heat (Cp)', unit: 'J/kg·K', min: 100, max: 1000, step: 10, description: 'Specific heat capacity' },
    { key: 'alpha1', label: 'Heater 1 Power (α₁)', unit: 'W/%', min: 0.001, max: 0.05, step: 0.001, description: 'Power per % for heater 1' },
    { key: 'alpha2', label: 'Heater 2 Power (α₂)', unit: 'W/%', min: 0.001, max: 0.05, step: 0.001, description: 'Power per % for heater 2' },
    { key: 'eps', label: 'Emissivity (ε)', unit: '', min: 0.1, max: 1.0, step: 0.05, description: 'Surface emissivity for radiation' },
    { key: 'Ta', label: 'Ambient Temp', unit: '°C', min: 10, max: 40, step: 0.5, description: 'Ambient temperature' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, params, onSave }) => {
    const [localParams, setLocalParams] = useState<PhysicsParams>(params);

    useEffect(() => {
        setLocalParams(params);
    }, [params, isOpen]);

    if (!isOpen) return null;

    const handleChange = (key: keyof PhysicsParams, value: number) => {
        setLocalParams(prev => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setLocalParams(DEFAULT_PARAMS);
    };

    const handleSave = () => {
        onSave(localParams);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <Settings className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Physics Parameters</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {PARAM_CONFIGS.map(config => (
                        <div key={config.key} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-slate-300">
                                    {config.label}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={localParams[config.key]}
                                        onChange={e => handleChange(config.key, parseFloat(e.target.value) || 0)}
                                        min={config.min}
                                        max={config.max}
                                        step={config.step}
                                        className="w-24 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-right font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                    <span className="text-xs text-slate-500 w-16">{config.unit}</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                value={localParams[config.key]}
                                onChange={e => handleChange(config.key, parseFloat(e.target.value))}
                                min={config.min}
                                max={config.max}
                                step={config.step}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <p className="text-xs text-slate-500">{config.description}</p>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/5">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset to Defaults
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
