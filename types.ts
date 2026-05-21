
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export enum CarState {
  PARKED = 'PARKED',
  EXITING = 'EXITING',
  MERGING = 'MERGING',
  ORBITING = 'ORBITING',
  CRASHED = 'CRASHED',
}

export enum CarType {
  SEDAN = 'SEDAN',         // 2 units long
  TRUCK = 'TRUCK',         // 3 units long
  AMBULANCE = 'AMBULANCE', // 2 units long (特有優先通行權)
  POLICE = 'POLICE',       // 2 units long (速度快 1.5 倍)
  BUS = 'BUS',             // 4 units long (超長，多倍積分)
}

export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  type?: 'SMOKE' | 'DEBRIS' | 'CONFETTI'; 
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  rotation?: number;
  vRot?: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number; // 0 to 1
  scale: number;
  vy: number;
}

export interface Car {
  id: string;
  type: CarType;
  length: number; // In grid cells
  color: string;
  
  // Grid properties (for Parked state)
  gridX: number;
  gridY: number;
  direction: Direction;
  
  // Physics properties
  x: number; // Pixel coordinate
  y: number; // Pixel coordinate
  width: number; // Pixel width
  height: number; // Pixel height
  rotation?: number; // Visual rotation in radians
  
  // State
  state: CarState;
  
  // For Orbiting
  orbitDistance: number; // Distance traveled along the perimeter
  speed: number;
  
  // For Merging
  mergePivot?: { x: number, y: number };
  mergeRadius?: number;
  mergeStartAngle?: number;
  mergeEndAngle?: number;
  mergeProgress?: number; // 0 to 1
  
  // Bezier Merging
  mergeBezier?: {
    p0: Point;
    p1: Point;
    p2: Point;
    p3: Point;
  };

  // Visuals
  flash: boolean; // For selection/error feedback
  trailHistory?: Point[]; // 記錄最近 8 幀的座標歷史，用於繪製流光拖尾
  skinId?: string; // 車輛當前穿戴的皮膚 ID
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type GameStatus = 
  | 'MENU' 
  | 'PLAYING' 
  | 'ENDING_WON'       // Confetti phase
  | 'ENDING_LOST'      // Crash shake phase
  | 'LOST_CONTINUE'    // "Continue?" Modal (Yes/No)
  | 'GAME_OVER_SUMMARY'// "Game Over - Click to view score"
  | 'GAME_OVER_RANK'   // "Defeated X% players"
  | 'SHOP';            // 🛒 皮膚商店狀態

