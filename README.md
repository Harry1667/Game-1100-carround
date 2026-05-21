# Traffic Orbit (環島大塞車)

**Traffic Orbit** is a high-speed puzzle-action game where players must strategically untangle a gridlocked parking lot by merging cars onto a busy orbital highway without causing catastrophic accidents.

![Game Status](https://img.shields.io/badge/Status-Playable-brightgreen)
![Tech Stack](https://img.shields.io/badge/Tech-React_%7C_Canvas_%7C_TypeScript-blue)

## 🎮 Game Overview (遊戲概述)

The player acts as a traffic controller for a central parking island. The goal is to clear the island by tapping cars to release them onto the surrounding loop road. However, timing is everything—cars must merge seamlessly into the flow of traffic without colliding with other vehicles.

## 🕹️ How to Play (操作說明)

1.  **Tap to Release:** Click or tap on a parked car to make it accelerate out of the parking lot.
2.  **Avoid Crashes:** Do not release a car if it will collide with a vehicle already on the orbit or another car exiting at the same time.
3.  **Clear the Lot:** Successfully merge all parked cars onto the orbit to advance to the next level.
4.  **Game Over:** If two cars collide, the game ends immediately.

## ⚙️ Core Mechanics (核心機制)

### 1. Movement & Merging (移動與匯入)
*   **Parked State:** Cars are stationary on a grid.
*   **Exiting:** Once tapped, cars move straight towards the edge.
*   **Merging:** Cars use **Cubic Bezier curves** to smoothly transition from the straight exit path onto the circular orbit.
*   **Orbiting:** Once on the track, cars circulate indefinitely at a constant speed.

### 2. Collision Detection (碰撞判定)
The game uses a dual-hitbox system to balance fairness and precision:
*   **Parked Cars:** Have a larger, forgiving hitbox (`PADDING = 8`) to make selecting/tapping easier on mobile devices.
*   **Moving Cars:** Switch to a strict hitbox (`PADDING = 3`) using **Projected AABB (Axis-Aligned Bounding Box)** math. This ensures that even when a car is rotated at 45 degrees, the collision box perfectly wraps the vehicle body, preventing "ghost" collisions or visual overlapping.

### 3. Combo System (連擊系統)
*   **Trigger:** Successfully merging a car starts a combo timer.
*   **Window:** You have **1.5 seconds** to merge the next car to keep the combo alive.
*   **Bonus:** 
    *   Base Score: 100 points per car.
    *   Combo Bonus: `(Combo Count - 1) * 50` points.
    *   Visual feedback ("Good!", "Great!", "Unstoppable!") and pitch-shifting audio rewards high combos.

### 4. Progression (關卡進程)
*   **Levels 1-2:** Tutorial phase. Empty orbit.
*   **Level 3+:** **Obstacle Cars** begin to appear. These cars are already circulating on the orbit when the level starts, forcing the player to time their exits carefully.
*   **Difficulty:** The number of parked cars and the speed of the orbit increases as levels progress.

### 5. Revive & Restart (復活與重開)
*   **Score Persistence:** Scores accumulate across levels.
*   **Loss Condition:** Upon crashing, the player has two options:
    *   **Restart Game:** Resets Level to 1 and Score to 0.
    *   **Revive & Next Level:** (Simulated Ad reward) Keeps the current score and skips to the next level immediately.

## 🛠️ Technical Implementation

### Tech Stack
*   **Frontend:** React 19
*   **Language:** TypeScript
*   **Rendering:** HTML5 Canvas API (for high-performance 60fps rendering)
*   **Styling:** TailwindCSS
*   **Audio:** Web Audio API (Real-time synthesized sound effects, no external assets required)

### Key Algorithms
*   **Bezier Curve Calculation:** Used for the smooth organic merging animation.
*   **Hitbox Projection:** `Width = Length * |cosθ| + Width * |sinθ|` is used to calculate the bounding box of rotated entities dynamically.

## 🎨 Visuals & Audio

*   **Graphics:** Minimalist vector art style with vibrant car colors.
*   **Effects:**
    *   **Smoke:** When cars launch.
    *   **Dust Trails:** When cars drive at high speed.
    *   **Explosions/Debris:** On collision.
    *   **Confetti:** On level clear.
    *   **Screen Shake:** Adds impact to crashes and high combos.
*   **Sound:** Dynamic synthesizer generates sounds for Start, Crash, Score (pitch scales with combo), and Victory.

## 📝 License

This project is for educational and entertainment purposes.
