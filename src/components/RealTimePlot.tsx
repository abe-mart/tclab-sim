import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataPoint {
    time: number;
    T1: number;
    T2: number;
    Q1: number;
    Q2: number;
}

interface LineConfig {
    dataKey: keyof DataPoint;
    stroke: string;
    name?: string;
    type?: "monotone" | "step";
    strokeDasharray?: string;
}

interface RealTimePlotProps {
    data: DataPoint[];
    lines: LineConfig[];
    yAxisLabel: string;
    yDomain?: [number | string | ((dataMin: number) => number), number | string | ((dataMax: number) => number)];
    timeWindow?: number; // seconds to display
}

export const RealTimePlot: React.FC<RealTimePlotProps> = ({ data, lines, yAxisLabel, yDomain = [0, 'auto'], timeWindow = 60 }) => {
    // Compute a stable x-axis domain based on current time
    const xDomain = useMemo(() => {
        if (data.length === 0) return [0, timeWindow];
        const currentTime = data[data.length - 1].time;
        // Use actual time for smooth scrolling
        const startTime = Math.max(0, currentTime - timeWindow);
        return [startTime, currentTime];
    }, [data, timeWindow]);

    return (
        <div className="w-full h-64 bg-slate-900 rounded-xl border border-slate-700 p-4 shadow-lg">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="time"
                        stroke="#94a3b8"
                        tickFormatter={(t) => Math.floor(t).toString()}
                        domain={xDomain}
                        type="number"
                        allowDataOverflow
                        label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                        domain={yDomain}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                    />
                    <Legend />
                    {lines.map((line) => (
                        <Line
                            key={line.dataKey}
                            type={line.type || "monotone"}
                            dataKey={line.dataKey}
                            stroke={line.stroke}
                            name={line.name || line.dataKey}
                            dot={false}
                            strokeWidth={2}
                            strokeDasharray={line.strokeDasharray}
                            isAnimationActive={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
