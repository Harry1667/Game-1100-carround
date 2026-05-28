# Traffic Orbit（環島大塞車）

**Traffic Orbit** 是一款高速解謎動作遊戲 — 玩家要把停車場裡卡死的車逐台導入環形高速公路，時機抓不準就連環車禍。

![Game Status](https://img.shields.io/badge/Status-Playable-brightgreen)
![Tech Stack](https://img.shields.io/badge/Tech-React_%7C_Canvas_%7C_TypeScript-blue)

## 🎮 遊戲概述

玩家扮演中央停車島的交通管制官，目標是把島上所有車輛點掉、送上外圍環形道路。時機是一切 —— 車輛必須無縫切入車流，不能撞上既有車輛。

## 🕹️ 操作說明

1. **點擊放行**：點或觸碰停車的車輛使其加速駛出停車場
2. **避免碰撞**：若會撞上環道上已有的車或同時間駛出的車，就不要放行
3. **清空停車場**：把所有停車輛成功匯入環道進入下一關
4. **遊戲結束**：兩車相撞 → 立即結束

## ⚙️ 核心機制

### 1. 移動與匯入
- **停車狀態**：車輛靜止在格子上
- **駛出**：被點擊後直線駛向邊緣
- **匯入**：用 **三次貝茲曲線** 平滑從直線出口過渡到圓環
- **環繞**：上環後以等速持續循環

### 2. 碰撞判定
雙 hitbox 系統，公平與精準兼顧：
- **停車車輛**：寬鬆 hitbox（`PADDING = 8`），手機點擊更容易
- **移動車輛**：嚴格 hitbox（`PADDING = 3`），用 **投影 AABB（軸對齊邊界框）** 計算。即使車輛旋轉 45°，碰撞框也精準貼合車身，避免「幽靈碰撞」或視覺重疊

### 3. 連擊系統
- **觸發**：成功匯入車輛啟動連擊計時
- **窗口**：**1.5 秒** 內匯入下一台保持連擊
- **加分**：
  - 基礎分：每車 100 分
  - 連擊加成：`(連擊數 - 1) * 50` 分
  - 視覺回饋（"Good!", "Great!", "Unstoppable!"）+ 音調隨連擊上升的音效

### 4. 關卡進程
- **1-2 關**：教學階段，環道淨空
- **3 關起**：環道上預置 **障礙車**，強迫玩家精算時機
- **難度**：停車數與環道速度隨關卡上升

### 5. 復活與重開
- **分數累積**：跨關保留
- **失敗時**：
  - **重新開始**：關卡回 1、分數歸 0
  - **復活續關**：（模擬廣告獎勵）保留分數，跳到下一關

## 🛠️ 技術實作

### 技術棧
- **前端**：React 19
- **語言**：TypeScript
- **渲染**：HTML5 Canvas API（60fps 高效能渲染）
- **樣式**：TailwindCSS
- **音效**：Web Audio API（即時合成，零外部資源）

### 關鍵演算法
- **貝茲曲線計算**：平滑有機的匯入動畫
- **Hitbox 投影**：`寬度 = 長度 * |cosθ| + 寬度 * |sinθ|` 動態計算旋轉物體的邊界框

## 🎨 視覺與音效

- **畫風**：簡約向量風 + 鮮豔車色
- **特效**：
  - **煙霧**：發車瞬間
  - **塵跡**：高速駛過
  - **爆炸 / 碎片**：碰撞時
  - **彩帶**：過關時
  - **畫面震動**：撞擊與高連擊時加強衝擊感
- **音效**：動態合成器產生 Start、Crash、Score（音高隨連擊上升）、Victory

## 📝 授權

本專案僅供學習與娛樂用途。

---

## English

**Traffic Orbit** is a high-speed puzzle-action game where players must strategically untangle a gridlocked parking lot by merging cars onto a busy orbital highway without causing catastrophic accidents.

### 🎮 Game Overview

The player acts as a traffic controller for a central parking island. The goal is to clear the island by tapping cars to release them onto the surrounding loop road. However, timing is everything — cars must merge seamlessly into the flow of traffic without colliding with other vehicles.

### 🕹️ How to Play

1. **Tap to Release**: Click or tap on a parked car to make it accelerate out of the parking lot.
2. **Avoid Crashes**: Do not release a car if it will collide with a vehicle already on the orbit or another car exiting at the same time.
3. **Clear the Lot**: Successfully merge all parked cars onto the orbit to advance to the next level.
4. **Game Over**: If two cars collide, the game ends immediately.

### ⚙️ Core Mechanics

#### 1. Movement & Merging
- **Parked State**: Cars are stationary on a grid.
- **Exiting**: Once tapped, cars move straight towards the edge.
- **Merging**: Cars use **Cubic Bezier curves** to smoothly transition from the straight exit path onto the circular orbit.
- **Orbiting**: Once on the track, cars circulate indefinitely at a constant speed.

#### 2. Collision Detection
The game uses a dual-hitbox system to balance fairness and precision:
- **Parked Cars**: Have a larger, forgiving hitbox (`PADDING = 8`) to make selecting/tapping easier on mobile devices.
- **Moving Cars**: Switch to a strict hitbox (`PADDING = 3`) using **Projected AABB (Axis-Aligned Bounding Box)** math. This ensures that even when a car is rotated at 45 degrees, the collision box perfectly wraps the vehicle body, preventing "ghost" collisions or visual overlapping.

#### 3. Combo System
- **Trigger**: Successfully merging a car starts a combo timer.
- **Window**: You have **1.5 seconds** to merge the next car to keep the combo alive.
- **Bonus**:
  - Base Score: 100 points per car.
  - Combo Bonus: `(Combo Count - 1) * 50` points.
  - Visual feedback ("Good!", "Great!", "Unstoppable!") and pitch-shifting audio rewards high combos.

#### 4. Progression
- **Levels 1-2**: Tutorial phase. Empty orbit.
- **Level 3+**: **Obstacle Cars** begin to appear. These cars are already circulating on the orbit when the level starts, forcing the player to time their exits carefully.
- **Difficulty**: The number of parked cars and the speed of the orbit increases as levels progress.

#### 5. Revive & Restart
- **Score Persistence**: Scores accumulate across levels.
- **Loss Condition**: Upon crashing, the player has two options:
  - **Restart Game**: Resets Level to 1 and Score to 0.
  - **Revive & Next Level**: (Simulated Ad reward) Keeps the current score and skips to the next level immediately.

### 🛠️ Technical Implementation

#### Tech Stack
- **Frontend**: React 19
- **Language**: TypeScript
- **Rendering**: HTML5 Canvas API (for high-performance 60fps rendering)
- **Styling**: TailwindCSS
- **Audio**: Web Audio API (Real-time synthesized sound effects, no external assets required)

#### Key Algorithms
- **Bezier Curve Calculation**: Used for the smooth organic merging animation.
- **Hitbox Projection**: `Width = Length * |cosθ| + Width * |sinθ|` is used to calculate the bounding box of rotated entities dynamically.

### 🎨 Visuals & Audio

- **Graphics**: Minimalist vector art style with vibrant car colors.
- **Effects**:
  - **Smoke**: When cars launch.
  - **Dust Trails**: When cars drive at high speed.
  - **Explosions/Debris**: On collision.
  - **Confetti**: On level clear.
  - **Screen Shake**: Adds impact to crashes and high combos.
- **Sound**: Dynamic synthesizer generates sounds for Start, Crash, Score (pitch scales with combo), and Victory.

### 📝 License

This project is for educational and entertainment purposes.
