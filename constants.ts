
import { CarType } from './types';

// Grid Configuration
// Updated to 8x16 as requested
export const GRID_COLS = 8;
export const GRID_ROWS = 16;

// Reduced cell size slightly to accommodate the larger 8x16 grid on mobile screens
export const CELL_SIZE = 32; 
export const GAP = 4; 

// Orbit Configuration
// "Outer ring width is 2.5 grids"
export const ORBIT_PADDING = CELL_SIZE * 2.5; 
export const TRACK_WIDTH = ORBIT_PADDING; // Visual width matches padding

export const ORBIT_RADIUS = 25; 
export const ISLAND_RADIUS = 16; 
export const MERGE_RADIUS = 30; 

// Physics
export const BASE_SPEED = 4.5;
export const EXIT_SPEED = BASE_SPEED;
export const ORBIT_SPEED_BASE = BASE_SPEED;
export const ORBIT_SPEED_INC = 0.2;

// Visuals - Matched to Image (Green BG, Beige Island, Gray Road)
export const COLORS = {
  BACKGROUND: '#a3e6aa', // Light Green (App & Header)
  ROAD: '#9ca3af',       // Medium Gray (Road)
  ISLAND: '#f5f0e1',     // Beige (Parking Lot)
  ISLAND_BORDER: '#ffffff', 
  TEXT: '#000000',       // Black text for visibility on green
  OUTER_BORDER: '#6b7280', // Darker gray edge
};

export const CAR_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
];

// Car Configuration
export const CAR_CONFIG = {
  [CarType.SEDAN]: { length: 2 },
  [CarType.TRUCK]: { length: 3 },
  [CarType.AMBULANCE]: { length: 2 },
  [CarType.POLICE]: { length: 2 },
  [CarType.BUS]: { length: 4 },
};

// Skin Shop Configuration
export interface SkinInfo {
  id: string;
  nameKey: string;
  price: number;
  color: string;
  trailColor?: string;
  isSpecial?: boolean;
}

export const SKIN_CONFIG: SkinInfo[] = [
  { id: 'default', nameKey: 'shop.skin.default', price: 0, color: '' }, 
  { id: 'taxi', nameKey: 'shop.skin.taxi', price: 50, color: '#eab308', trailColor: 'rgba(234, 179, 8, 0.3)' }, // 暖黃計程車
  { id: 'cyberpunk', nameKey: 'shop.skin.cyberpunk', price: 150, color: '#06b6d4', trailColor: 'rgba(6, 182, 212, 0.3)' }, // 科技青藍
  { id: 'neon_pink', nameKey: 'shop.skin.neon_pink', price: 300, color: '#d946ef', trailColor: 'rgba(217, 70, 239, 0.3)' }, // 霓虹粉紫
  { id: 'rainbow', nameKey: 'shop.skin.rainbow', price: 500, color: '#6366f1', trailColor: 'RAINBOW', isSpecial: true }, // 彩虹流光
];

