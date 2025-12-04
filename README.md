# TCLab Simulator

A high-fidelity digital twin of the [Temperature Control Lab (TCLab)](http://apmonitor.com/heat.htm), designed for process control education and experimentation.

![TCLab Simulator Screenshot](https://raw.githubusercontent.com/jckantor/TCLab/master/images/tclab_board.jpg)
*(Note: Replace with actual screenshot of the simulator)*

## Overview

This web-based simulator provides a realistic physics simulation of the TCLab hardware, allowing users to experiment with heat transfer dynamics and feedback control without needing the physical device. It models the two-heater, two-sensor system with configurable physics parameters.

## Features

### 🔬 High-Fidelity Physics
- **Realistic Heat Transfer**: Models convection, radiation, and conduction between heaters.
- **Configurable Parameters**: Adjust heat transfer coefficient ($U$), mass, specific heat ($C_p$), heater power factors ($\alpha_1, \alpha_2$), emissivity ($\epsilon$), and ambient temperature.
- **Dynamic Visualization**: 3D-style visualizer with real-time heat glow effects based on temperature and power.

### 🎛️ Control Systems
- **Manual Control**: Direct slider control of Heater 1 (Q1) and Heater 2 (Q2) power (0-100%).
- **PID Controller**: Built-in closed-loop PID controller with:
  - Configurable gains ($K_p, K_i, K_d$)
  - Individual setpoints for T1 and T2
  - Anti-windup protection
  - Smooth manual/auto switching

### 📊 Real-Time Analysis
- **Live Plotting**: Interactive real-time graphs for Temperature (T1, T2) and Power (Q1, Q2).
- **Time Window Selection**: View data for the last 1 minute, 5 minutes, 10 minutes, or the entire session.
- **Data Export**: Download full simulation history as CSV for analysis in Python/MATLAB/Excel.

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tcsim.git
   cd tcsim/webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the simulator**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Physics Model

The simulation solves the following energy balance equations in real-time:

$$
\frac{dT_1}{dt} = \frac{1}{m C_p} [ U A (T_a - T_1) + \epsilon \sigma A (T_a^4 - T_1^4) + Q_{C12} + Q_{R12} + \alpha_1 Q_1 ]
$$

$$
\frac{dT_2}{dt} = \frac{1}{m C_p} [ U A (T_a - T_2) + \epsilon \sigma A (T_a^4 - T_2^4) - Q_{C12} - Q_{R12} + \alpha_2 Q_2 ]
$$

Where:
- $Q_{C12}$ is conduction between heaters
- $Q_{R12}$ is radiation between heaters

## License

MIT License
