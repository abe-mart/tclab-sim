import { describe, it, expect } from 'vitest';
import { TCLabPhysics } from './tclab-physics';

describe('TCLabPhysics', () => {
    it('should initialize with ambient temperature', () => {
        const sim = new TCLabPhysics(25);
        const sensors = sim.getSensors();
        expect(sensors.T1).toBeCloseTo(25, 1);
        expect(sensors.T2).toBeCloseTo(25, 1);
    });

    it('should heat up when heater is on', () => {
        const sim = new TCLabPhysics(21);
        sim.setHeaters(100, 0); // Heater 1 on full

        // Run for 100 seconds
        for (let i = 0; i < 100; i++) {
            sim.step(1);
        }

        const sensors = sim.getSensors();
        expect(sensors.T1).toBeGreaterThan(21);
        expect(sensors.T2).toBeGreaterThan(21); // Coupling
        expect(sensors.T1).toBeGreaterThan(sensors.T2); // T1 should be hotter than T2
    });

    it('should cool down when heater is off', () => {
        const sim = new TCLabPhysics(21);
        sim.setHeaters(100, 0);

        // Heat up
        for (let i = 0; i < 100; i++) {
            sim.step(1);
        }
        const hotTemp = sim.getSensors().T1;

        // Turn off
        sim.setHeaters(0, 0);

        // Cool down
        for (let i = 0; i < 100; i++) {
            sim.step(1);
        }

        expect(sim.getSensors().T1).toBeLessThan(hotTemp);
    });
});
