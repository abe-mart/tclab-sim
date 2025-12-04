export interface PhysicsParams {
    U: number;       // W/m^2-K
    mass: number;    // kg
    Cp: number;      // J/kg-K
    alpha1: number;  // W / % heater 1
    alpha2: number;  // W / % heater 2
    eps: number;     // Emissivity
    Ta: number;      // Ambient temp (Celsius)
}

export const DEFAULT_PARAMS: PhysicsParams = {
    U: 10.0,
    mass: 0.004,
    Cp: 500.0,
    alpha1: 0.01,
    alpha2: 0.01,
    eps: 0.9,
    Ta: 21.0
};

export class TCLabPhysics {
    // State variables
    T1: number; // Temperature Sensor 1 (degC)
    T2: number; // Temperature Sensor 2 (degC)

    // Parameters from Gekko model
    Ta: number = 19.0 + 273.15;     // K
    T0: number = 19.0 + 273.15;     // Initial temperature
    U: number = 10.0;               // W/m^2-K
    mass: number = 4.0 / 1000.0;    // kg
    Cp: number = 0.5 * 1000.0;      // J/kg-K    
    A: number = 10.0 / 100.0 ** 2;    // Area not between heaters in m^2
    As: number = 2.0 / 100.0 ** 2;    // Area between heaters in m^2
    alpha1: number = 0.01;          // W / % heater
    alpha2: number = 0.01;          // W / % heater
    eps: number = 0.9;              // Emissivity
    sigma: number = 5.67e-8;        // Stefan-Boltzman

    // Current Heater Settings (0-100)
    Q1: number = 0;
    Q2: number = 0;

    constructor(initialTemp: number = 21) {
        // Convert initial temp to Kelvin for internal calculation if needed, 
        // but the Gekko model uses Kelvin for everything.
        // Let's stick to Kelvin internally as per Gekko model to be safe with radiation.
        const initialTempK = initialTemp + 273.15;
        this.Ta = initialTempK;
        this.T1 = initialTempK;
        this.T2 = initialTempK;
    }

    setParameters(params: Partial<PhysicsParams>) {
        if (params.U !== undefined) this.U = params.U;
        if (params.mass !== undefined) this.mass = params.mass;
        if (params.Cp !== undefined) this.Cp = params.Cp;
        if (params.alpha1 !== undefined) this.alpha1 = params.alpha1;
        if (params.alpha2 !== undefined) this.alpha2 = params.alpha2;
        if (params.eps !== undefined) this.eps = params.eps;
        if (params.Ta !== undefined) this.Ta = params.Ta + 273.15;
    }

    getParameters(): PhysicsParams {
        return {
            U: this.U,
            mass: this.mass,
            Cp: this.Cp,
            alpha1: this.alpha1,
            alpha2: this.alpha2,
            eps: this.eps,
            Ta: this.Ta - 273.15
        };
    }

    // Step the simulation by dt seconds
    step(dt: number) {
        // Equations from Gekko model:
        // Q_C12 = U*As*(T2-T1)
        // Q_R12 = eps*sigma*As*(T2**4-T1**4)

        // dT1 = (1.0/(mass*Cp))*(U*A*(Ta-T1) \
        //             + eps * sigma * A * (Ta**4 - T1**4) \
        //             + Q_C12 + Q_R12 \
        //             + alpha1*Q1)

        // dT2 = (1.0/(mass*Cp))*(U*A*(Ta-T2) \
        //             + eps * sigma * A * (Ta**4 - T2**4) \
        //             - Q_C12 - Q_R12 \
        //             + alpha2*Q2)

        const Q_C12 = this.U * this.As * (this.T2 - this.T1);
        const Q_R12 = this.eps * this.sigma * this.As * (Math.pow(this.T2, 4) - Math.pow(this.T1, 4));

        const dT1 = (1.0 / (this.mass * this.Cp)) * (
            this.U * this.A * (this.Ta - this.T1)
            + this.eps * this.sigma * this.A * (Math.pow(this.Ta, 4) - Math.pow(this.T1, 4))
            + Q_C12 + Q_R12
            + this.alpha1 * this.Q1
        );

        const dT2 = (1.0 / (this.mass * this.Cp)) * (
            this.U * this.A * (this.Ta - this.T2)
            + this.eps * this.sigma * this.A * (Math.pow(this.Ta, 4) - Math.pow(this.T2, 4))
            - Q_C12 - Q_R12
            + this.alpha2 * this.Q2
        );

        // Euler integration
        this.T1 += dT1 * dt;
        this.T2 += dT2 * dt;
    }

    setHeaters(q1: number, q2: number) {
        this.Q1 = Math.max(0, Math.min(100, q1));
        this.Q2 = Math.max(0, Math.min(100, q2));
    }

    getSensors() {
        // Return in Celsius
        return {
            T1: this.T1 - 273.15,
            T2: this.T2 - 273.15
        };
    }
}
