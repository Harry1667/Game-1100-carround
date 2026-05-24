import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Car, CarState, CarType, Direction, GameStatus, Rect, Point, Particle, FloatingText } from '../types';
import { useTranslation } from '../utils/i18n';
import { triggerHaptic } from '../utils/haptic';
import { SettingsModal } from './SettingsModal';
import { HeaderBar } from './HeaderBar';
import { ContinuePopup } from './ContinuePopup';
import { GameOverSummaryPopup } from './GameOverSummaryPopup';
import { RankingScreen } from './RankingScreen';
import { GameCanvas } from './GameCanvas';
import { ShopModal } from './ShopModal';
import { 
  GRID_COLS, 
  GRID_ROWS, 
  CELL_SIZE, 
  GAP, 
  ORBIT_PADDING,
  ISLAND_RADIUS,
  ORBIT_RADIUS,
  MERGE_RADIUS, 
  EXIT_SPEED, 
  ORBIT_SPEED_BASE, 
  ORBIT_SPEED_INC,
  CAR_COLORS,
  COLORS,
  TRACK_WIDTH,
  CAR_CONFIG,
  SKIN_CONFIG
} from '../constants';

// --- Collider Types ---
interface CircleCollider {
  x: number;
  y: number;
  radius: number;
}

// --- Audio Synthesizer ---
const playSound = (type: 'START' | 'CRASH' | 'SCORE' | 'COMBO' | 'WIN' | 'LOSE' | 'CONTINUE', intensity = 0) => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === 'START') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.3);

  } else if (type === 'CRASH') {
    // 低沉悶響，不刺耳：triangle 波短促降調
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);

    // 極輕的白噪音質感，有撞擊感但不爆音
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    noise.start(now);

  } else if (type === 'COMBO') {
    // Soft chime: C4 → E4 → G4 → C5 → E5，純 sine 波鐘聲，不刺耳
    const comboNotes = [261.63, 329.63, 392.00, 523.25, 659.25];
    const freq = comboNotes[Math.min(intensity - 1, comboNotes.length - 1)];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    osc.start(now);
    osc.stop(now + 0.55);

    // 泛音：加一個低一半音量的 2 倍頻，讓鐘聲更圓潤
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.07, now + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc2.start(now);
    osc2.stop(now + 0.35);

  } else if (type === 'SCORE') {
    // New simplified score sound (ding)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);
    
    osc.start(now);
    osc.stop(now + 0.15);

  } else if (type === 'WIN') {
    const notes = [523.25, 659.25, 783.99, 1046.50]; 
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

    notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        o.connect(gain);
        o.start(now + i * 0.1);
        o.stop(now + 2.0);
    });

  } else if (type === 'LOSE') {
    // 溫和下滑音：triangle 波，短促降調，不嚇人
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.6);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.6);

    osc.start(now);
    osc.stop(now + 0.6);

  } else if (type === 'CONTINUE') {
    // 繼續挑戰彈窗提示音：兩聲輕柔鐘，降調暗示「你還有機會」
    const notes = [440, 330];
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, now + i * 0.22);
      g.gain.setValueAtTime(0, now + i * 0.22);
      g.gain.linearRampToValueAtTime(0.15, now + i * 0.22 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.22 + 0.45);
      o.start(now + i * 0.22);
      o.stop(now + i * 0.22 + 0.45);
    });
  }
};

// --- Helper Math Functions ---

const checkCirclesCollision = (circlesA: CircleCollider[], circlesB: CircleCollider[]): boolean => {
  for (const c1 of circlesA) {
    for (const c2 of circlesB) {
      const dx = c1.x - c2.x;
      const dy = c1.y - c2.y;
      const distSq = dx * dx + dy * dy;
      const radSum = c1.radius + c2.radius;
      if (distSq < radSum * radSum) {
        return true;
      }
    }
  }
  return false;
};

const getCarColliders = (car: Car): CircleCollider[] => {
  const circles: CircleCollider[] = [];
  const numCircles = car.length;
  // Radius calculation: Half the visual width, slightly reduced for forgiveness
  const radius = ((CELL_SIZE - GAP) / 2) * 0.9; 
  
  // Calculate Center Position
  let centerX = car.x;
  let centerY = car.y;
  let rotation = car.rotation || 0;

  // Normalize Parked vs Moving Center Logic
  // Apply offset for any state where (x,y) refers to top-left of the bounding box
  // This ensures collision circles follow the car correctly when it starts moving (EXITING)
  if (car.state === CarState.PARKED || car.state === CarState.EXITING) {
     centerX += car.width / 2;
     centerY += car.height / 2;
  }

  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  for (let i = 0; i < numCircles; i++) {
    const offsetUnits = i - (numCircles - 1) / 2;
    const offsetPx = offsetUnits * CELL_SIZE;

    const rX = offsetPx * cos;
    const rY = offsetPx * sin;

    circles.push({
      x: centerX + rX,
      y: centerY + rY,
      radius: radius
    });
  }
  return circles;
};

// Returns the grid index bounds [min, max] for a car.
const getGridFootprint = (c: Car) => {
  let x1 = c.gridX, x2 = c.gridX;
  let y1 = c.gridY, y2 = c.gridY;
  
  if (c.direction === 'LEFT') {
    x1 = c.gridX - c.length + 1;
    x2 = c.gridX;
  } else if (c.direction === 'RIGHT') {
    x1 = c.gridX;
    x2 = c.gridX + c.length - 1;
  } else if (c.direction === 'UP') {
    y1 = c.gridY - c.length + 1;
    y2 = c.gridY;
  } else if (c.direction === 'DOWN') {
    y1 = c.gridY;
    y2 = c.gridY + c.length - 1;
  }
  return { x1, x2, y1, y2 };
};

// Check if two cars share the same "Lane" (Grid row or column)
const areCarsInSameLane = (c1: Car, c2: Car): boolean => {
  const fp1 = getGridFootprint(c1);
  const fp2 = getGridFootprint(c2);
  
  const isV1 = c1.direction === 'UP' || c1.direction === 'DOWN';

  if (isV1) {
    if (fp1.x2 < fp2.x1 || fp1.x1 > fp2.x2) return false;
  } else {
    if (fp1.y2 < fp2.y1 || fp1.y1 > fp2.y2) return false;
  }
  
  return true;
};


const cubicBezier = (t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point => {
  const k = 1 - t;
  const k2 = k * k;
  const k3 = k * k * k;
  const t2 = t * t;
  const t3 = t * t * t;
  
  const x = k3 * p0.x + 3 * k2 * t * p1.x + 3 * k * t2 * p2.x + t3 * p3.x;
  const y = k3 * p0.y + 3 * k2 * t * p1.y + 3 * k * t2 * p2.y + t3 * p3.y;
  
  return { x, y };
};

const bezierTangent = (t: number, p0: Point, p1: Point, p2: Point, p3: Point): number => {
  const k = 1 - t;
  // Derivative of cubic bezier B'(t)
  const d0x = p1.x - p0.x; const d0y = p1.y - p0.y;
  const d1x = p2.x - p1.x; const d1y = p2.y - p1.y;
  const d2x = p3.x - p2.x; const d2y = p3.y - p2.y;
  
  const tx = 3 * k * k * d0x + 6 * k * t * d1x + 3 * t * t * d2x;
  const ty = 3 * k * k * d0y + 6 * k * t * d1y + 3 * t * t * d2y;
  
  return Math.atan2(ty, tx);
};

const lerpAngle = (start: number, end: number, t: number) => {
  let diff = end - start;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  return start + diff * t;
};

// --- Component ---

export const TrafficGame: React.FC = () => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null); 
  const requestRef = useRef<number>(0);

  const carsRef = useRef<Car[]>([]);
  // Store initial state of level for Retry functionality
  const initialCarsRef = useRef<Car[]>([]);
  const startLevelScoreRef = useRef<number>(0);

  const particlesRef = useRef<Particle[]>([]);
  const clicksRef = useRef<{x: number, y: number, life: number}[]>([]); 
  const floatTextsRef = useRef<FloatingText[]>([]);
  
  // Game State
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState<GameStatus>('MENU');
  const [carsLeft, setCarsLeft] = useState(0);
  const [scale, setScale] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  // 🪙 玩家金幣數量 (配合 console.log 輸出調試)
  const [gold, setGold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('traffic_orbit_gold');
      const val = saved ? parseInt(saved, 10) : 0;
      console.log('🚀 [Storage] 初始化載入金幣數量:', val);
      return val;
    } catch (e) {
      console.error('💥 [Storage] 讀取金幣失敗:', e);
      return 0;
    }
  });

  // 裝備的皮膚 ID
  const [activeSkinId, setActiveSkinId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('traffic_orbit_active_skin');
      const val = saved || 'default';
      console.log('🚀 [Storage] 初始化載入裝備皮膚:', val);
      return val;
    } catch (e) {
      return 'default';
    }
  });

  // 已解鎖皮膚列表
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('traffic_orbit_unlocked_skins');
      const val = saved ? JSON.parse(saved) : ['default'];
      console.log('🚀 [Storage] 初始化載入已解鎖皮膚:', val);
      return val;
    } catch (e) {
      return ['default'];
    }
  });

  // 是否顯示商店彈窗
  const [showShop, setShowShop] = useState(false);

  // 儲存金幣、皮膚與解鎖記錄至 LocalStorage
  useEffect(() => {
    console.log('🚀 [Storage] 保存金幣變更:', gold);
    localStorage.setItem('traffic_orbit_gold', gold.toString());
  }, [gold]);

  useEffect(() => {
    console.log('🚀 [Storage] 保存裝備皮膚變更:', activeSkinId);
    localStorage.setItem('traffic_orbit_active_skin', activeSkinId);
  }, [activeSkinId]);

  useEffect(() => {
    console.log('🚀 [Storage] 保存已解鎖皮膚列表變更:', unlockedSkins);
    localStorage.setItem('traffic_orbit_unlocked_skins', JSON.stringify(unlockedSkins));
  }, [unlockedSkins]);

  // 商店購買與裝備回調
  const handleUnlockSkin = (skinId: string, price: number) => {
    if (gold >= price) {
      setGold(g => g - price);
      setUnlockedSkins(prev => {
        const next = [...prev, skinId];
        return next;
      });
      console.log(`🛒 [Shop] 成功解鎖皮膚: ${skinId}，扣除金幣: ${price}`);
      triggerHaptic('medium');
    }
  };

  const handleEquipSkin = (skinId: string) => {
    setActiveSkinId(skinId);
    console.log(`🛒 [Shop] 成功裝備皮膚: ${skinId}`);
    triggerHaptic('light');
  };

  // 根據關卡等級決定地圖類型
  const getMapTypeForLevel = (_lvl: number): 'STANDARD' | 'EIGHT_SHAPE' | 'INTERSECTION' => {
    return 'STANDARD';
  };

  const mapType = getMapTypeForLevel(level);

  // 判斷特定 Grid 是否在當前地圖的停車島嶼內，避免車輛生成在道路區
  const isGridInIsland = useCallback((gx: number, gy: number, type: 'STANDARD' | 'EIGHT_SHAPE' | 'INTERSECTION'): boolean => {
    if (type === 'STANDARD') return true; // 全島
    
    if (type === 'EIGHT_SHAPE') {
      // 8字形地圖：y 必須在 0 到 6 (上島) 或 9 到 15 (下島)
      const row = gy;
      return row <= 6 || row >= 9;
    }
    
    // INTERSECTION (四角島)
    // x 必須在左半 (0 到 3) 或右半 (5 到 7)，y 必須在上半 (0 到 6) 或下半 (9 到 15)
    const col = gx;
    const row = gy;
    const isColValid = col <= 3 || col >= 5;
    const isRowValid = row <= 6 || row >= 9;
    return isColValid && isRowValid;
  }, []);
  
  const comboRef = useRef<number>(0); 
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMergeTimeRef = useRef<number>(0);

  const shakeRef = useRef<number>(0); 
  const shakeTimeRef = useRef<number>(0); 
  
  const [showSettings, setShowSettings] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1.0);
  const [debugMode, setDebugMode] = useState(false); 

  // --- Particle Systems ---

  const createSmoke = (x: number, y: number, direction: Direction) => {
    for(let i=0; i<8; i++) {
      let vx = (Math.random() - 0.5) * 2;
      let vy = (Math.random() - 0.5) * 2;
      
      if (direction === 'UP') vy += 2;
      if (direction === 'DOWN') vy -= 2;
      if (direction === 'LEFT') vx += 2;
      if (direction === 'RIGHT') vx -= 2;

      particlesRef.current.push({
        type: 'SMOKE',
        x: x + (Math.random() - 0.5) * 20, 
        y: y + (Math.random() - 0.5) * 20,
        vx,
        vy,
        life: 1.0,
        color: '#e5e7eb',
        size: Math.random() * 5 + 3
      });
    }
  };
  
  const createDust = (x: number, y: number) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.5;
      particlesRef.current.push({
        type: 'SMOKE',
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        color: 'rgba(200, 200, 200, 0.2)',
        size: Math.random() * 4 + 2
      });
  };

  const createDebris = (circles: CircleCollider[], color: string) => {
    // Pick a random circle from the collider to spawn debris from
    if (circles.length === 0) return;
    const c = circles[Math.floor(Math.random() * circles.length)];
    
    const numParticles = 12;
    for(let i=0; i<numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6; 
      particlesRef.current.push({
        type: 'DEBRIS',
        x: c.x + (Math.random() - 0.5) * c.radius,
        y: c.y + (Math.random() - 0.5) * c.radius,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.5,
        color: color,
        size: Math.random() * 6 + 4,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.5
      });
    }
  };

  const createExplosion = (x: number, y: number) => {
    for(let i=0; i<20; i++) {
      particlesRef.current.push({
        type: 'SMOKE',
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        color: '#f87171',
        size: Math.random() * 4 + 2
      });
    }
    for(let i=0; i<10; i++) {
       particlesRef.current.push({
        type: 'SMOKE',
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 0.8,
        color: '#cbd5e1',
        size: Math.random() * 3 + 2
      });
    }
  };

  const createConfetti = (centerX: number, centerY: number, width: number, height: number) => {
    const colors = ['#f87171', '#60a5fa', '#facc15', '#4ade80', '#a78bfa', '#f472b6'];
    for(let i=0; i<150; i++) {
        const x = centerX + (Math.random() - 0.5) * width;
        const y = centerY + (Math.random() - 0.5) * height;
        particlesRef.current.push({
            type: 'CONFETTI',
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: -Math.random() * 10 - 2, 
            life: 3.0 + Math.random() * 2, 
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 6 + 4,
            rotation: Math.random() * Math.PI,
            vRot: (Math.random() - 0.5) * 0.2
        });
    }
  };
  
  const spawnFloatingText = (text: string, x: number, y: number, color: string) => {
      floatTextsRef.current.push({
          id: Date.now() + Math.random(),
          text, x, y, color,
          life: 1.0,
          scale: 0.5,
          vy: -2
      });
  };

  // --- Initialization & Level Gen ---

  const generateLevel = useCallback((lvl: number) => {
    particlesRef.current = [];
    clicksRef.current = [];
    floatTextsRef.current = [];
    // Reset combo state for new level
    setCombo(0);
    comboRef.current = 0;
    
    const currentMapType = getMapTypeForLevel(lvl);
    console.log(`🚀 [LevelGen] 開始生成關卡 ${lvl}，地圖類型: ${currentMapType}`);

    const newCars: Car[] = [];
    const numCars = Math.min(4 + Math.floor(lvl * 1.5), 24);
    const usedCells = new Set<string>();

    const checkCollision = (x: number, y: number) => usedCells.has(`${x},${y}`);
    const markCells = (x: number, y: number, len: number, dir: Direction) => {
      for(let i=0; i<len; i++) {
        if (dir === 'UP') usedCells.add(`${x},${y-i}`);
        if (dir === 'DOWN') usedCells.add(`${x},${y+i}`);
        if (dir === 'LEFT') usedCells.add(`${x-i},${y}`);
        if (dir === 'RIGHT') usedCells.add(`${x+i},${y}`);
      }
    };

    let attempts = 0;
    while(newCars.length < numCars && attempts < 8000) {
      attempts++;
      const isVertical = Math.random() > 0.5;
      
      let carType = CarType.SEDAN;
      if (lvl === 2) {
        carType = Math.random() > 0.75 ? CarType.TRUCK : CarType.SEDAN;
      } else if (lvl >= 3) {
        const r = Math.random();
        if (r < 0.40) carType = CarType.SEDAN;
        else if (r < 0.60) carType = CarType.TRUCK;
        else if (r < 0.75) carType = CarType.BUS;       // 15% 大巴士
        else if (r < 0.90) carType = CarType.POLICE;    // 15% 警車
        else carType = CarType.AMBULANCE;               // 10% 救護車
      }
      
      const len = CAR_CONFIG[carType].length;
      
      const dir: Direction = isVertical ? (Math.random() > 0.5 ? 'UP' : 'DOWN') : (Math.random() > 0.5 ? 'LEFT' : 'RIGHT');
      const gx = Math.floor(Math.random() * GRID_COLS);
      const gy = Math.floor(Math.random() * GRID_ROWS);

      let overlapsOrOutOfIsland = false;
      for(let i=0; i<len; i++) {
        let cx = gx;
        let cy = gy;
        if (dir === 'UP') cy -= i;
        else if (dir === 'DOWN') cy += i;
        else if (dir === 'LEFT') cx -= i;
        else if (dir === 'RIGHT') cx += i;
        
        if (cx < 0 || cx >= GRID_COLS || cy < 0 || cy >= GRID_ROWS || !isGridInIsland(cx, cy, currentMapType)) {
          overlapsOrOutOfIsland = true;
          break;
        }
        if (checkCollision(cx, cy)) overlapsOrOutOfIsland = true;
      }
      if (overlapsOrOutOfIsland) continue;

      let isDeadlock = false;
      for (const other of newCars) {
        if (isVertical && (other.direction === 'UP' || other.direction === 'DOWN') && other.gridX === gx) {
           if (dir === 'DOWN' && other.direction === 'UP' && gy < other.gridY) isDeadlock = true;
           if (dir === 'UP' && other.direction === 'DOWN' && gy > other.gridY) isDeadlock = true;
        }
        if (!isVertical && (other.direction === 'LEFT' || other.direction === 'RIGHT') && other.gridY === gy) {
           if (dir === 'RIGHT' && other.direction === 'LEFT' && gx < other.gridX) isDeadlock = true;
           if (dir === 'LEFT' && other.direction === 'RIGHT' && gx > other.gridX) isDeadlock = true;
        }
      }
      if (isDeadlock) continue;

      markCells(gx, gy, len, dir);
      const color = CAR_COLORS[newCars.length % CAR_COLORS.length];

      newCars.push({
        id: `car-${newCars.length}`,
        type: carType,
        length: len,
        color: color,
        gridX: gx,
        gridY: gy,
        direction: dir,
        x: 0, y: 0, width: 0, height: 0,
        state: CarState.PARKED,
        orbitDistance: 0,
        speed: 0,
        flash: false
      });
    }

    console.log(`🚀 [LevelGen] 關卡車輛生成完畢，重試次數: ${attempts}，生成車輛數: ${newCars.length}`);

    if (lvl >= 3) {
      const orbitCarsCount = Math.min(Math.floor((lvl - 2) / 2) + 1, 6);
      for(let i=0; i<orbitCarsCount; i++) {
         const color = CAR_COLORS[(i + 3) % CAR_COLORS.length];
         // 關卡 5 以上偶數障礙車改為卡車，增加佔用長度的壓迫感
         const obstacleType = (lvl >= 5 && i % 2 === 1) ? CarType.TRUCK : CarType.SEDAN;
         const obstacleLen = obstacleType === CarType.TRUCK ? 3 : 2;
         newCars.push({
            id: `orbit-obstacle-${i}`,
            type: obstacleType,
            length: obstacleLen,
            color: color,
            gridX: -100,
            gridY: -100,
            direction: 'RIGHT', 
            x: 0, y: 0, width: 0, height: 0,
            state: CarState.ORBITING,
            orbitDistance: i * 380 + 100, 
            speed: ORBIT_SPEED_BASE + (lvl * ORBIT_SPEED_INC),
            flash: false
         });
      }
    }

    carsRef.current = newCars;
    initialCarsRef.current = JSON.parse(JSON.stringify(newCars)); 
    setCarsLeft(newCars.filter(c => c.state === CarState.PARKED).length);
  }, [isGridInIsland]);

  // Full Restart (Level 1, Score 0)
  const restartGameFull = () => {
    setStatus('PLAYING');
    setLevel(1);
    setScore(0);
    startLevelScoreRef.current = 0;
    setCombo(0);
    comboRef.current = 0;
    generateLevel(1);
  };

  // Retry Current Level (Restore state, reset score for this level)
  const retryLevel = () => {
    // Restore cars from snapshot
    carsRef.current = JSON.parse(JSON.stringify(initialCarsRef.current));
    setCarsLeft(carsRef.current.filter(c => c.state === CarState.PARKED).length);
    
    // Reset score to what it was at start of level
    setScore(startLevelScoreRef.current);
    
    setCombo(0);
    comboRef.current = 0;
    particlesRef.current = [];
    setStatus('PLAYING');
  };

  const nextLevel = () => {
    startLevelScoreRef.current = score; // Snapshot current score before next level
    const next = level + 1;
    setLevel(next);
    setStatus('PLAYING');
    generateLevel(next);
  };

  // Used for internal initialization, not for UI restart
  const initGame = () => {
    restartGameFull();
  };

  const triggerWin = () => {
    setStatus('ENDING_WON');
    playSound('WIN');
    const totalW = GRID_COLS * CELL_SIZE + ORBIT_PADDING * 2;
    const totalH = GRID_ROWS * CELL_SIZE + ORBIT_PADDING * 2;
    createConfetti(totalW/2, totalH/2, totalW, totalH);
    
    // Auto advance after 3 seconds
    setTimeout(() => {
        nextLevel();
    }, 3000); 
  };

  const triggerLoss = () => {
    setStatus('ENDING_LOST');
    playSound('LOSE');
    setTimeout(() => {
        setStatus('LOST_CONTINUE');
        playSound('CONTINUE');
    }, 1500);
  };

  const resetCombo = () => {
      setCombo(0);
      comboRef.current = 0;
  };

  const getPerimeter = (rect: Rect, type: 'STANDARD' | 'EIGHT_SHAPE' | 'INTERSECTION') => {
    if (type === 'STANDARD') {
      const straightW = rect.w - 2 * MERGE_RADIUS;
      const straightH = rect.h - 2 * MERGE_RADIUS;
      const arcLen = (Math.PI * MERGE_RADIUS) / 2;
      return 2 * straightW + 2 * straightH + 4 * arcLen;
    }
    if (type === 'EIGHT_SHAPE') {
      const rx = rect.w / 2 - 4;
      const ry = rect.h / 2 - 4;
      return Math.PI * 2 * Math.max(rx, ry) * 1.25;
    }
    // INTERSECTION
    const baseR = rect.w / 2 - 16;
    return Math.PI * 2 * baseR * 1.35;
  };

  const getOrbitCoords = (dist: number, orbitRect: Rect, radius: number, type: 'STANDARD' | 'EIGHT_SHAPE' | 'INTERSECTION') => {
    const { x, y, w, h } = orbitRect;
    const r = radius;

    if (type === 'EIGHT_SHAPE') {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const rx = w / 2 - 4;
      const ry = h / 2 - 4;
      
      const perimeter = getPerimeter(orbitRect, 'EIGHT_SHAPE');
      let theta = (dist / perimeter) * Math.PI * 2;
      
      const px = cx + rx * Math.sin(theta);
      const py = cy + ry * Math.sin(2 * theta) / 2;
      
      const dx = rx * Math.cos(theta);
      const dy = ry * Math.cos(2 * theta);
      const angle = Math.atan2(dy, dx);
      
      return { x: px, y: py, angle };
    }

    if (type === 'INTERSECTION') {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const baseR = w / 2 - 16;
      const amp = w / 5;
      
      const perimeter = getPerimeter(orbitRect, 'INTERSECTION');
      let theta = (dist / perimeter) * Math.PI * 2;
      
      const r_val = baseR + amp * Math.cos(4 * theta);
      const px = cx + r_val * Math.cos(theta);
      const py = cy + r_val * Math.sin(theta);
      
      const dr = -4 * amp * Math.sin(4 * theta);
      const dx = dr * Math.cos(theta) - r_val * Math.sin(theta);
      const dy = dr * Math.sin(theta) + r_val * Math.cos(theta);
      const angle = Math.atan2(dy, dx);
      
      return { x: px, y: py, angle };
    }

    const straightW = w - 2 * r;
    const straightH = h - 2 * r;
    const arcLen = (Math.PI * r) / 2;
    const perimeter = 2 * straightW + 2 * straightH + 4 * arcLen;

    let d = dist % perimeter;
    if (d < 0) d += perimeter;

    if (d < straightH) {
      return { x: x, y: y + r + d, angle: Math.PI / 2 };
    }
    d -= straightH;

    if (d < arcLen) {
      const theta = (d / arcLen) * (Math.PI / 2);
      const cx = x + r;
      const cy = y + h - r;
      return {
        x: cx - r * Math.cos(theta),
        y: cy + r * Math.sin(theta),
        angle: Math.PI / 2 - theta 
      };
    }
    d -= arcLen;

    if (d < straightW) {
      return { x: x + r + d, y: y + h, angle: 0 };
    }
    d -= straightW;

    if (d < arcLen) {
      const theta = (d / arcLen) * (Math.PI / 2);
      const cx = x + w - r;
      const cy = y + h - r;
      return {
        x: cx + r * Math.sin(theta),
        y: cy + r * Math.cos(theta),
        angle: 0 - theta 
      };
    }
    d -= arcLen;

    if (d < straightH) {
      return { x: x + w, y: y + h - r - d, angle: -Math.PI / 2 };
    }
    d -= straightH;

    if (d < arcLen) {
      const theta = (d / arcLen) * (Math.PI / 2);
      const cx = x + w - r;
      const cy = y + r;
      return {
        x: cx + r * Math.cos(theta),
        y: cy - r * Math.sin(theta),
        angle: -Math.PI / 2 - theta
      };
    }
    d -= arcLen;

    if (d < straightW) {
      return { x: x + w - r - d, y: y, angle: Math.PI };
    }
    d -= straightW;

    const thetaVal = (d / arcLen) * (Math.PI / 2);
    const cxVal = x + r;
    const cyVal = y + r;
    return {
      x: cxVal - r * Math.sin(thetaVal),
      y: cyVal - r * Math.cos(thetaVal),
      angle: Math.PI - thetaVal
    };
  };

  const update = useCallback(() => {
    if (status !== 'PLAYING' && status !== 'ENDING_WON' && status !== 'ENDING_LOST' && status !== 'LOST_CONTINUE') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const shouldUpdatePhysics = status === 'PLAYING' || status === 'ENDING_WON' || status === 'ENDING_LOST';

    const gridW = GRID_COLS * CELL_SIZE;
    const gridH = GRID_ROWS * CELL_SIZE;
    const totalW = gridW + ORBIT_PADDING * 2;
    const totalH = gridH + ORBIT_PADDING * 2;
    const offsetX = (canvas.width / scale - totalW) / 2;
    const offsetY = (canvas.height / scale - totalH) / 2;

    const orbitRect = {
      x: offsetX + ORBIT_PADDING/2,
      y: offsetY + ORBIT_PADDING/2,
      w: totalW - ORBIT_PADDING,
      h: totalH - ORBIT_PADDING
    };

    const perimeter = getPerimeter(orbitRect, mapType);
    
    const gridOriginX = offsetX + ORBIT_PADDING;
    const gridOriginY = offsetY + ORBIT_PADDING;

    let crashed = false;
    let allOrbiting = true;
    let parkingCount = 0;

    // 匯入成功的金幣、Combo、得分輔助回調
    const handleMergeSuccess = (car: Car, bestDist: number) => {
      console.log(`✅ [Physics] 車輛成功匯入環島軌道: ${car.id}，類型: ${car.type}`);
      car.state = CarState.ORBITING;
      car.orbitDistance = bestDist;
      car.speed = (ORBIT_SPEED_BASE + (level * ORBIT_SPEED_INC));
      
      const now = Date.now();
      const timeSinceLastMerge = now - lastMergeTimeRef.current;
      let currentCombo = 1;
      
      if (timeSinceLastMerge < 1500) { 
          let newCombo = comboRef.current + 1;
          console.log(`🔥 [Physics] 連擊 Combo 達成! 次數: ${newCombo}`);
          setCombo(newCombo);
          comboRef.current = newCombo;
          playSound('COMBO', newCombo);
          triggerHaptic('medium');
          
          if (newCombo >= 2) {
              let text = "Good!";
              let color = "#ffffff";
              if (newCombo === 2) { text = t('game.great'); color = "#facc15"; } 
              if (newCombo === 3) { text = t('game.excellent'); color = "#fb923c"; } 
              if (newCombo === 4) { text = t('game.amazing'); color = "#f87171"; } 
              if (newCombo >= 5) { text = t('game.unstoppable'); color = "#c084fc"; } 
              spawnFloatingText(text, car.x, car.y - 20, color);
              setShowCombo(true);
              if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
              comboTimerRef.current = setTimeout(() => {
                  resetCombo();
                  setShowCombo(false);
              }, 2000);
          }
          currentCombo = newCombo;
      } else {
          console.log('✨ [Physics] 車輛匯入成功 (普通得分)');
          setCombo(1);
          comboRef.current = 1;
          playSound('SCORE');
          triggerHaptic('light');
      }
      lastMergeTimeRef.current = now;
      
      // 大巴士 300 分，其餘 100 分；combo 每多 1 次額外 +50
      const baseScore = car.type === CarType.BUS ? 300 : 100;
      const comboBonus = (currentCombo - 1) * 50;
      const scoreGain = baseScore + comboBonus;
      setScore(s => s + scoreGain);
      spawnFloatingText(`+${scoreGain}`, car.x, car.y - 20, '#ffffff');

      // 金幣收益：大巴士 30 底，其餘 10 底，乘以 combo
      const baseGold = car.type === CarType.BUS ? 30 : 10;
      const goldReward = baseGold * currentCombo;
      setGold(g => g + goldReward);
      spawnFloatingText(`+🪙${goldReward}`, car.x, car.y - 44, '#facc15');
    };

    carsRef.current.forEach(car => {
      if (car.state === CarState.CRASHED) {
          allOrbiting = false; 
          return;
      }
      
      if (!shouldUpdatePhysics && car.state !== CarState.PARKED) {
          return; 
      }

      const carW = (car.length * CELL_SIZE) - GAP;
      const carH = CELL_SIZE - GAP;
      // 警車啟動前進速度增強為 1.5 倍
      const currentExitSpeed = EXIT_SPEED * gameSpeed * (car.type === CarType.POLICE ? 1.5 : 1.0);
      
      // 噴灰塵粒子
      if ((car.state === CarState.EXITING || car.state === CarState.MERGING || car.state === CarState.ORBITING)) {
         if (Math.random() > 0.6) { 
            const rearDist = (car.length * CELL_SIZE) / 2;
            const rot = car.rotation || 0;
            const dustX = car.x - Math.cos(rot) * rearDist;
            const dustY = car.y - Math.sin(rot) * rearDist;
            createDust(dustX, dustY);
         }
      }
      
      if (car.state === CarState.PARKED) {
        allOrbiting = false;
        parkingCount++;
        
        const gx = gridOriginX + car.gridX * CELL_SIZE + GAP/2;
        const gy = gridOriginY + car.gridY * CELL_SIZE + GAP/2;
        
        if (car.direction === 'RIGHT') {
           car.x = gx; car.y = gy; car.width = carW; car.height = carH; car.rotation = 0;
        } else if (car.direction === 'LEFT') {
           car.x = gx - (car.length - 1) * CELL_SIZE; car.y = gy; car.width = carW; car.height = carH; car.rotation = Math.PI;
        } else if (car.direction === 'DOWN') {
           car.x = gx; car.y = gy; car.width = carH; car.height = carW; car.rotation = Math.PI/2;
        } else if (car.direction === 'UP') {
           car.x = gx; car.y = gy - (car.length - 1) * CELL_SIZE; car.width = carH; car.height = carW; car.rotation = -Math.PI/2;
        }

      } else if (car.state === CarState.EXITING) {
        allOrbiting = false;
        
        if (car.direction === 'RIGHT') { car.x += currentExitSpeed; car.rotation = 0; }
        if (car.direction === 'LEFT') { car.x -= currentExitSpeed; car.rotation = Math.PI; }
        if (car.direction === 'DOWN') { car.y += currentExitSpeed; car.rotation = Math.PI/2; }
        if (car.direction === 'UP') { car.y -= currentExitSpeed; car.rotation = -Math.PI/2; }

        let cx = car.x + car.width / 2;
        let cy = car.y + car.height / 2;

        // 通用軌道吸附式匯入檢測 (距離法，支援任意地圖軌道)
        let minD = Infinity;
        let bestDist = 0;
        const samples = 120;
        for (let s = 0; s < samples; s++) {
          const testDist = (s / samples) * perimeter;
          const pos = getOrbitCoords(testDist, orbitRect, MERGE_RADIUS, mapType);
          const dx = pos.x - cx;
          const dy = pos.y - cy;
          const dSq = dx*dx + dy*dy;
          if (dSq < minD) {
            minD = dSq;
            bestDist = testDist;
          }
        }
        
        const startX = gridOriginX + car.gridX * CELL_SIZE + GAP/2;
        const startY = gridOriginY + car.gridY * CELL_SIZE + GAP/2;
        let startCX = startX + carW/2;
        let startCY = startY + carH/2;
        if (car.direction === 'DOWN' || car.direction === 'UP') {
          startCX = startX + carH/2;
          startCY = startY + carW/2;
        }
        
        const distTraveled = Math.sqrt((cx - startCX)**2 + (cy - startCY)**2);
        
        // 確保至少移動了 1 格，且與軌道最近點小於 14 像素
        if (distTraveled > CELL_SIZE * 1.0 && minD < 196) {
          handleMergeSuccess(car, bestDist);
        }

      } else if (car.state === CarState.MERGING) {
        // 因通用吸附演算法已將 EXITING 直接切換至 ORBITING，保留此區塊僅為相容舊狀態
        allOrbiting = false;
        car.state = CarState.ORBITING;

      } else if (car.state === CarState.ORBITING) {
        let baseSpd = ORBIT_SPEED_BASE + (level * ORBIT_SPEED_INC);

        car.speed = baseSpd;
        car.orbitDistance += car.speed * gameSpeed;
        if (car.orbitDistance > perimeter) car.orbitDistance -= perimeter;

        const pos = getOrbitCoords(car.orbitDistance, orbitRect, MERGE_RADIUS, mapType);
        car.x = pos.x;
        car.y = pos.y;
        car.rotation = pos.angle;

        // 救護車在環島時噴出警用紅藍粒子
        if (car.type === CarType.AMBULANCE && Math.random() > 0.6) {
          particlesRef.current.push({
            type: 'SMOKE',
            x: car.x + (Math.random() - 0.5) * 12,
            y: car.y + (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            life: 0.8,
            color: Math.random() > 0.5 ? '#3b82f6' : '#ef4444',
            size: Math.random() * 4 + 2
          });
        }
      }

      // --- 運動拖尾歷史記錄更新 ---
      if (car.state !== CarState.PARKED && car.state !== CarState.CRASHED) {
        if (!car.trailHistory) {
          car.trailHistory = [];
        }
        
        let cx = car.x;
        let cy = car.y;
        if (car.state === CarState.EXITING) {
          const carW = (car.length * CELL_SIZE) - GAP;
          const carH = CELL_SIZE - GAP;
          if (car.direction === 'LEFT' || car.direction === 'RIGHT') {
            cx = car.x + carW / 2;
            cy = car.y + carH / 2;
          } else {
            cx = car.x + carH / 2;
            cy = car.y + carW / 2;
          }
        }
        
        car.trailHistory.push({ x: cx, y: cy });
        if (car.trailHistory.length > 8) {
          car.trailHistory.shift();
        }
      } else {
        car.trailHistory = [];
      }
    });

    if (shouldUpdatePhysics) {
      const activeCars = carsRef.current.filter(c => c.state !== CarState.CRASHED);
      const activeColliders = new Map<string, CircleCollider[]>();

      activeCars.forEach(c => {
        activeColliders.set(c.id, getCarColliders(c));
      });
      
      for (let i = 0; i < activeCars.length; i++) {
        for (let j = i + 1; j < activeCars.length; j++) {
          const c1 = activeCars[i];
          const c2 = activeCars[j];

          if ((c1.state === CarState.PARKED && c2.state === CarState.ORBITING) ||
              (c1.state === CarState.ORBITING && c2.state === CarState.PARKED)) {
                continue;
          }
          if (c1.state === CarState.PARKED && c2.state === CarState.PARKED) continue;
          if (c1.state === CarState.ORBITING && c2.state === CarState.ORBITING) continue;
          
          if (c1.state === CarState.EXITING && (c2.state === CarState.PARKED || c2.state === CarState.EXITING)) {
            if (!areCarsInSameLane(c1, c2)) continue;
          }
          else if (c2.state === CarState.EXITING && (c1.state === CarState.PARKED || c1.state === CarState.EXITING)) {
            if (!areCarsInSameLane(c2, c1)) continue;
          }

          // 救護車在軌道上時免疫碰撞 (優先通行保護)
          if ((c1.type === CarType.AMBULANCE && c1.state === CarState.ORBITING && c2.state === CarState.ORBITING) ||
              (c2.type === CarType.AMBULANCE && c2.state === CarState.ORBITING && c1.state === CarState.ORBITING)) {
            continue;
          }

          const colliders1 = activeColliders.get(c1.id)!;
          const colliders2 = activeColliders.get(c2.id)!;

          if (checkCirclesCollision(colliders1, colliders2)) {
            crashed = true;
            c1.state = CarState.CRASHED;
            c2.state = CarState.CRASHED;
            
            resetCombo();
            
            createDebris(colliders1, c1.color);
            createDebris(colliders2, c2.color);
            createExplosion(c1.x, c1.y);
            createExplosion(c2.x, c2.y);
            
            console.error(`💥 [Physics] 偵測到車體碰撞! 碰撞車輛: ${c1.id} 🚗與 ${c2.id} 🚗`);
            playSound('CRASH');
            triggerHaptic('heavy');
          }
        }
      }
    }

    if (crashed && status === 'PLAYING') {
      console.log('💀 [Physics] 遊戲判定失敗，準備呼叫 triggerLoss()');
      shakeRef.current = 25;
      shakeTimeRef.current = 0.5;
      triggerLoss();
    }

    if (allOrbiting && carsRef.current.length > 0 && status === 'PLAYING') {
      triggerWin();
    }

    setCarsLeft(parkingCount);
    
    // Shake Update
    if (shakeTimeRef.current > 0) {
      shakeTimeRef.current -= 0.016; 
      if (shakeTimeRef.current <= 0) {
        shakeTimeRef.current = 0;
        shakeRef.current = 0;
      }
    }
    if (shakeTimeRef.current > 0 && shakeRef.current > 0) {
        shakeRef.current *= 0.9;
    }

  }, [status, level, scale, gameSpeed]); 


  // --- Render Loop ---

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridW = GRID_COLS * CELL_SIZE;
    const gridH = GRID_ROWS * CELL_SIZE;
    const totalW = gridW + ORBIT_PADDING * 2;
    const totalH = gridH + ORBIT_PADDING * 2;
    
    const offsetX = (canvas.width / scale - totalW) / 2;
    const offsetY = (canvas.height / scale - totalH) / 2;
    
    const shakeX = (Math.random() - 0.5) * shakeRef.current;
    const shakeY = (Math.random() - 0.5) * shakeRef.current;
    
    ctx.scale(scale, scale);
    ctx.translate(shakeX, shakeY);

    const roadX = offsetX;
    const roadY = offsetY;
    const roadW = totalW;
    const roadH = totalH;
    const roadRadius = ORBIT_RADIUS + 20;

    const orbitRect = {
      x: offsetX + ORBIT_PADDING/2,
      y: offsetY + ORBIT_PADDING/2,
      w: totalW - ORBIT_PADDING,
      h: totalH - ORBIT_PADDING
    };
    
    // --- 繪製道路 (Roads) 與安全島 (Islands) ---
    if (mapType === 'STANDARD') {
      ctx.fillStyle = COLORS.OUTER_BORDER;
      ctx.beginPath();
      ctx.roundRect(roadX - 4, roadY - 4, roadW + 8, roadH + 8, roadRadius + 2);
      ctx.fill();

      ctx.fillStyle = COLORS.ROAD;
      ctx.beginPath();
      ctx.roundRect(roadX, roadY, roadW, roadH, roadRadius);
      ctx.fill();

      // 繪製單一安全島
      const islandX = offsetX + ORBIT_PADDING;
      const islandY = offsetY + ORBIT_PADDING;
      
      ctx.fillStyle = COLORS.ISLAND;
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(islandX, islandY, gridW, gridH, ISLAND_RADIUS);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // 細部格線
      ctx.strokeStyle = 'rgba(0,0,0,0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 0; c <= GRID_COLS; c++) {
        ctx.moveTo(islandX + c * CELL_SIZE, islandY);
        ctx.lineTo(islandX + c * CELL_SIZE, islandY + gridH);
      }
      for (let r = 0; r <= GRID_ROWS; r++) {
        ctx.moveTo(islandX, islandY + r * CELL_SIZE);
        ctx.lineTo(islandX + gridW, islandY + r * CELL_SIZE);
      }
      ctx.stroke();
      
      ctx.strokeStyle = COLORS.ISLAND_BORDER;
      ctx.lineWidth = 3;
      ctx.strokeRect(islandX, islandY, gridW, gridH); 
    } else {
      // EIGHT_SHAPE 或 INTERSECTION：沿路徑繪製
      const perimeter = getPerimeter(orbitRect, mapType);
      ctx.beginPath();
      
      const startPos = getOrbitCoords(0, orbitRect, MERGE_RADIUS, mapType);
      ctx.moveTo(startPos.x, startPos.y);
      
      for (let dist = 4; dist <= perimeter; dist += 4) {
        const pos = getOrbitCoords(dist, orbitRect, MERGE_RADIUS, mapType);
        ctx.lineTo(pos.x, pos.y);
      }
      ctx.closePath();

      // 1. 外邊框
      ctx.strokeStyle = COLORS.OUTER_BORDER;
      ctx.lineWidth = TRACK_WIDTH + 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // 2. 道路主體
      ctx.strokeStyle = COLORS.ROAD;
      ctx.lineWidth = TRACK_WIDTH;
      ctx.stroke();

      // 3. 車道白虛線
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]); // 恢復實線

      // 繪製對應的多重安全島
      const islandX = offsetX + ORBIT_PADDING;
      const islandY = offsetY + ORBIT_PADDING;
      ctx.fillStyle = COLORS.ISLAND;
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 10;

      const islands: { x: number; y: number; w: number; h: number }[] = [];

      if (mapType === 'EIGHT_SHAPE') {
        // 上安全島
        islands.push({ x: islandX, y: islandY, w: gridW, h: 7 * CELL_SIZE });
        // 下安全島
        islands.push({ x: islandX, y: islandY + 9 * CELL_SIZE, w: gridW, h: 7 * CELL_SIZE });
      } else {
        // INTERSECTION: 四個角落安全島
        islands.push({ x: islandX, y: islandY, w: 4 * CELL_SIZE, h: 7 * CELL_SIZE }); // 左上
        islands.push({ x: islandX + 5 * CELL_SIZE, y: islandY, w: 3 * CELL_SIZE, h: 7 * CELL_SIZE }); // 右上
        islands.push({ x: islandX, y: islandY + 9 * CELL_SIZE, w: 4 * CELL_SIZE, h: 7 * CELL_SIZE }); // 左下
        islands.push({ x: islandX + 5 * CELL_SIZE, y: islandY + 9 * CELL_SIZE, w: 3 * CELL_SIZE, h: 7 * CELL_SIZE }); // 右下
      }

      islands.forEach(isl => {
        ctx.beginPath();
        ctx.roundRect(isl.x, isl.y, isl.w, isl.h, ISLAND_RADIUS);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // 每個島各自繪製微妙格線與白色邊界
      islands.forEach(isl => {
        ctx.strokeStyle = 'rgba(0,0,0,0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const colsCount = isl.w / CELL_SIZE;
        for (let c = 0; c <= colsCount; c++) {
          ctx.moveTo(isl.x + c * CELL_SIZE, isl.y);
          ctx.lineTo(isl.x + c * CELL_SIZE, isl.y + isl.h);
        }
        const rowsCount = isl.h / CELL_SIZE;
        for (let r = 0; r <= rowsCount; r++) {
          ctx.moveTo(isl.x, isl.y + r * CELL_SIZE);
          ctx.lineTo(isl.x + isl.w, isl.y + r * CELL_SIZE);
        }
        ctx.stroke();

        ctx.strokeStyle = COLORS.ISLAND_BORDER;
        ctx.lineWidth = 3;
        ctx.strokeRect(isl.x, isl.y, isl.w, isl.h);
      });
    } 

    carsRef.current.forEach(car => {
      // Don't draw crashed cars if they are obstructing view too much? 
      // Actually we want to see the crash.
      // if (car.state === CarState.CRASHED) return;

      ctx.save();
      
      const visualLen = (car.length * CELL_SIZE) - GAP;
      const visualWid = CELL_SIZE - GAP;

      // --- 繪製流光拖尾 (Motion Trail) ---
      if (car.trailHistory && car.trailHistory.length > 1 && car.state !== CarState.PARKED && car.state !== CarState.CRASHED) {
        ctx.save();
        car.trailHistory.forEach((point, idx) => {
          const alpha = (idx / car.trailHistory!.length) * 0.22; // 稍微提高拖尾的發光亮度
          ctx.globalAlpha = alpha;
          
          // 計算拖尾顏色 (如果是 Sedan 且裝備非 default 皮膚，套用皮膚流光)
          let trailColorVal = car.color;
          if (car.type === CarType.SEDAN && activeSkinId !== 'default') {
            const matchingSkin = SKIN_CONFIG.find(s => s.id === activeSkinId);
            if (matchingSkin) {
              if (matchingSkin.id === 'rainbow') {
                trailColorVal = `hsl(${(idx * 25 + Date.now() / 6) % 360}, 100%, 60%)`;
              } else if (matchingSkin.trailColor) {
                trailColorVal = matchingSkin.trailColor;
              } else if (matchingSkin.color) {
                trailColorVal = matchingSkin.color;
              }
            }
          }
          ctx.fillStyle = trailColorVal;
          
          ctx.save();
          ctx.translate(point.x, point.y);
          ctx.rotate(car.rotation || 0);
          
          const tw = visualLen * 0.92;
          const th = visualWid * 0.92;
          ctx.beginPath();
          ctx.roundRect(-tw / 2, -th / 2, tw, th, 6);
          ctx.fill();
          ctx.restore();
        });
        ctx.restore();
      }

      let centerX = 0, centerY = 0;

      if (car.state === CarState.ORBITING || car.state === CarState.MERGING) {
         centerX = car.x;
         centerY = car.y;
      } else {
         if (car.direction === 'LEFT' || car.direction === 'RIGHT') {
           centerX = car.x + visualLen/2;
           centerY = car.y + visualWid/2;
         } else {
           centerX = car.x + car.width/2;
           centerY = car.y + car.height/2;
         }
      }

      ctx.translate(centerX, centerY);
      ctx.rotate(car.rotation || 0);

      const w = visualLen;
      const h = visualWid;
      
      // 繪製微軟陰影
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.roundRect(-w/2 + 2, -h/2 + 2, w, h, 8);
      ctx.fill();
      
      if (car.flash) {
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 15;
      }

      // 動態判定當前車身的基礎主色
      let baseColor = car.flash ? '#ffffff' : car.color;
      let isRainbowSkin = false;
      
      if (car.type === CarType.SEDAN && activeSkinId !== 'default') {
        const matchingSkin = SKIN_CONFIG.find(s => s.id === activeSkinId);
        if (matchingSkin) {
          if (matchingSkin.id === 'rainbow') {
            isRainbowSkin = true;
            baseColor = car.flash ? '#ffffff' : `hsl(${(Date.now() / 8) % 360}, 100%, 60%)`;
          } else if (matchingSkin.color) {
            baseColor = car.flash ? '#ffffff' : matchingSkin.color;
          }
        }
      }

      // --- 根據車輛類型繪製不同的精美外觀 ---
      if (car.type === CarType.TRUCK) {
        // [1] 卡車 (TRUCK) - 長度 3：灰色後貨櫃 + 彩色前駕駛室 + 側輪
        // 後方貨櫃
        const cargoW = w * 0.7;
        const cargoH = h * 0.9;
        ctx.fillStyle = '#d1d5db';
        ctx.beginPath();
        ctx.roundRect(-w/2, -cargoH/2, cargoW, cargoH, 4);
        ctx.fill();

        // 貨櫃金屬加強條紋
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1.5;
        const stripeStep = cargoW / 4;
        for (let i = 1; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(-w/2 + i * stripeStep, -cargoH/2);
          ctx.lineTo(-w/2 + i * stripeStep, cargoH/2);
          ctx.stroke();
        }

        // 前方駕駛室
        const cabW = w * 0.3;
        const cabH = h * 0.8;
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.roundRect(-w/2 + cargoW, -cabH/2, cabW, cabH, 6);
        ctx.fill();

        // 擋風玻璃
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.roundRect(-w/2 + cargoW + cabW * 0.3, -cabH * 0.4, cabW * 0.4, cabH * 0.8, 2);
        ctx.fill();

        // 車輪
        ctx.fillStyle = '#111827';
        ctx.fillRect(-w/3 - 4, -h/2 - 1, 8, 2);
        ctx.fillRect(-w/3 - 4, h/2 - 1, 8, 2);
        ctx.fillRect(w/6 - 4, -h/2 - 1, 8, 2);
        ctx.fillRect(w/6 - 4, h/2 - 1, 8, 2);

        // 卡車車頭大燈
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(w/2 - 3, -cabH * 0.3, 3, 4);
        ctx.fillRect(w/2 - 3, cabH * 0.3 - 4, 3, 4);
      } 
      else if (car.type === CarType.BUS) {
        // [2] 巴士 (BUS) - 長度 4：超長圓角車身 + 前後擋風玻璃 + 側面觀光排窗
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.roundRect(-w/2, -h * 0.45, w, h * 0.9, 8);
        ctx.fill();

        // 前擋風玻璃
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.roundRect(w/2 - 8, -h * 0.35, 6, h * 0.7, 2);
        ctx.fill();

        // 側邊小車窗
        ctx.fillStyle = '#111827';
        const winW = w * 0.09;
        const winH = h * 0.2;
        const winStartX = -w/2 + 8;
        const winGap = w * 0.12;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.roundRect(winStartX + i * winGap, -h * 0.35, winW, winH, 1.5);
          ctx.roundRect(winStartX + i * winGap, h * 0.15, winW, winH, 1.5);
          ctx.fill();
        }

        // 後窗玻璃
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.roundRect(-w/2 + 2, -h * 0.3, 4, h * 0.6, 1.5);
        ctx.fill();

        // 巴士大燈
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(w/2 - 2, -h * 0.25, 2.5, 0, Math.PI * 2);
        ctx.arc(w/2 - 2, h * 0.25, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } 
      else if (car.type === CarType.POLICE) {
        // [3] 警車 (POLICE) - 前後明顯不同：深藍車身 + 前白條 + 黃色大燈 + 紅色尾燈 + 頂部警燈
        // 後半段（左/-x）：深灰
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.roundRect(-w/2, -h/2 + 1, w/2 + 4, h - 2, 6);
        ctx.fill();

        // 前半段（右/+x）：深藍
        ctx.fillStyle = '#1e3a5f';
        ctx.beginPath();
        ctx.roundRect(-w/8, -h/2 + 1, w/2 + w/8, h - 2, 4);
        ctx.fill();

        // 白色橫條（只在前半，給方向感）
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, -h * 0.22, w/2 - 2, h * 0.44);

        // 前擋風玻璃（藍色玻璃，緊貼車頭）
        ctx.fillStyle = '#2563eb';
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.roundRect(w/4, -h * 0.34, w/5, h * 0.68, 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // 後窗（小、深）
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.roundRect(-w/3, -h * 0.28, w/7, h * 0.56, 2);
        ctx.fill();

        // 前大燈：明亮黃白（車頭右側）
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(w/2 - 3, -h * 0.32, 4, 5);
        ctx.fillRect(w/2 - 3,  h * 0.32 - 5, 4, 5);
        // 大燈光暈
        ctx.save();
        ctx.globalAlpha = 0.3;
        const headGrad = ctx.createRadialGradient(w/2, 0, 1, w/2, 0, 12);
        headGrad.addColorStop(0, 'rgba(254,243,199,0.9)');
        headGrad.addColorStop(1, 'rgba(254,243,199,0)');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(w/2, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 後尾燈：紅色（車尾左側）
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-w/2 - 1, -h * 0.3, 4, 5);
        ctx.fillRect(-w/2 - 1,  h * 0.3 - 5, 4, 5);

        // 頂部警燈條（前半位置）
        const flashTick = Math.floor(Date.now() / 150) % 2;
        ctx.fillStyle = flashTick === 0 ? '#ef4444' : '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(w/8, -h/2 + 1, w/4, 3, 1);
        ctx.fill();

        // 警燈光暈
        ctx.save();
        ctx.globalAlpha = 0.22;
        const sirenGrad = ctx.createRadialGradient(w/4, 0, 1, w/4, 0, 18);
        sirenGrad.addColorStop(0, flashTick === 0 ? 'rgba(239,68,68,0.9)' : 'rgba(59,130,246,0.9)');
        sirenGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sirenGrad;
        ctx.beginPath();
        ctx.arc(w/4, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } 
      else if (car.type === CarType.AMBULANCE) {
        // [4] 救護車 (AMBULANCE) - 長度 2：純白外觀 + 紅十字徽章 + 紅色腰線 + 藍色爆閃燈
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(-w/2, -h/2 + 1, w, h - 2, 6);
        ctx.fill();

        // 紅色條紋
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-w/2, -h/2 + 1, w, 2.5);
        ctx.fillRect(-w/2, h/2 - 3.5, w, 2.5);

        // 紅十字標誌
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-1.5, -5, 3, 10);
        ctx.fillRect(-5, -1.5, 10, 3);

        // 擋風玻璃
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.roundRect(w/6, -h * 0.35, 6, h * 0.7, 2);
        ctx.fill();

        // 頂部藍色爆閃
        const flashTick = Math.floor(Date.now() / 120) % 2;
        ctx.fillStyle = flashTick === 0 ? '#3b82f6' : '#60a5fa';
        ctx.beginPath();
        ctx.roundRect(w/3, -3, 4, 6, 1.5);
        ctx.fill();

        ctx.save();
        ctx.globalAlpha = 0.25;
        const sirenGrad = ctx.createRadialGradient(w/3, 0, 1, w/3, 0, 15);
        sirenGrad.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
        sirenGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sirenGrad;
        ctx.beginPath();
        ctx.arc(w/3, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } 
      else {
        // [5] 跑車/轎車 (SEDAN) - 長度 2：保留精美流線型體視鏡、Spoiler、Vents 與氣勢非凡的大燈束
        ctx.fillStyle = baseColor;
        // Mirrors
        ctx.beginPath();
        ctx.moveTo(w/4, -h/2 + 2); ctx.lineTo(w/4 + 4, -h/2 - 3); ctx.lineTo(w/4 - 2, -h/2 - 3); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(w/4, h/2 - 2); ctx.lineTo(w/4 + 4, h/2 + 3); ctx.lineTo(w/4 - 2, h/2 + 3); ctx.fill();

        // Main Chassis
        ctx.beginPath();
        ctx.moveTo(-w/2, 0);
        ctx.lineTo(-w/2, -h/2 + 3);
        ctx.quadraticCurveTo(-w/2, -h/2, -w/2 + 5, -h/2);
        ctx.quadraticCurveTo(-w/6, -h/2 + 2, w/4, -h/2);
        ctx.quadraticCurveTo(w/2 - 5, -h/2, w/2, -h/3);
        ctx.quadraticCurveTo(w/2 + 3, 0, w/2, h/3);
        ctx.quadraticCurveTo(w/2 - 5, h/2, w/4, h/2);
        ctx.quadraticCurveTo(-w/6, h/2 - 2, -w/2 + 5, h/2);
        ctx.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - 3);
        ctx.closePath();
        ctx.fill();

        // Cabin
        const cabinColor = '#1f2937';
        ctx.fillStyle = cabinColor;
        ctx.beginPath();
        ctx.moveTo(w/4, -h/3);
        ctx.quadraticCurveTo(w/3, 0, w/4, h/3);
        ctx.lineTo(-w/3, h/4);
        ctx.quadraticCurveTo(-w/2 + 2, 0, -w/3, -h/4);
        ctx.closePath();
        ctx.fill();

        // Roof
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.ellipse(-w/10, 0, w/6, h/5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vents
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(w/3 + 2, -h/4); ctx.quadraticCurveTo(w/2 - 2, -h/6, w/2 - 2, -h/8);
        ctx.moveTo(w/3 + 2, h/4); ctx.quadraticCurveTo(w/2 - 2, h/6, w/2 - 2, h/8);
        ctx.stroke();

        ctx.fillStyle = '#111827';
        ctx.beginPath(); ctx.moveTo(0, -h/2 + 1); ctx.lineTo(-w/6, -h/2 + 3); ctx.lineTo(0, -h/2 + 4); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, h/2 - 1); ctx.lineTo(-w/6, h/2 - 3); ctx.lineTo(0, h/2 - 4); ctx.fill();

        // Spoiler
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.roundRect(-w/2 - 2, -h/2 + 2, 4, h - 4, 2);
        ctx.fill();

        // Headlights
        const beamLen = w * 1.5;
        const beamWid = h;
        const beamGrad = ctx.createRadialGradient(w/2, 0, 2, w/2 + beamLen, 0, beamWid);
        beamGrad.addColorStop(0, 'rgba(253, 224, 71, 0.5)');
        beamGrad.addColorStop(0.3, 'rgba(250, 204, 21, 0.2)');
        beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(w/2, -h/3);
        ctx.lineTo(w/2 + beamLen, -beamWid);
        ctx.quadraticCurveTo(w/2 + beamLen + 10, 0, w/2 + beamLen, beamWid);
        ctx.lineTo(w/2, h/3);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(w/2 - 2, -h/3, 3, 5, 0.2, 0, Math.PI*2);
        ctx.ellipse(w/2 - 2, h/3, 3, 5, -0.2, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = '#dc2626'; 
        ctx.beginPath();
        ctx.roundRect(-w/2 + 1, -h/3, 2, 6, 1);
        ctx.roundRect(-w/2 + 1, h/3 - 6, 2, 6, 1);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      
      // DEBUG HITBOX
      if (debugMode) {
         ctx.restore(); 
         ctx.save(); 
         const colliders = getCarColliders(car);
         ctx.strokeStyle = '#22c55e';
         ctx.lineWidth = 2;
         ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
         colliders.forEach(c => {
             ctx.beginPath();
             ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
             ctx.fill();
             ctx.stroke();
         });
         ctx.save(); 
      }

      ctx.restore();
    });

    // Draw Particles
    particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.type === 'CONFETTI') {
             p.vy += 0.1; 
             p.vx *= 0.99;
        } else {
             p.life -= 0.05;
        }

        if (p.rotation !== undefined && p.vRot !== undefined) {
             p.rotation += p.vRot;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.rotation) ctx.rotate(p.rotation);
        
        if (p.type !== 'CONFETTI') {
             ctx.globalAlpha = Math.max(0, p.life);
        }
        
        ctx.fillStyle = p.color;
        
        if (p.rotation !== undefined) {
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI*2);
            ctx.fill();
        }
        
        ctx.restore();
        ctx.globalAlpha = 1;
        
        if (p.type === 'CONFETTI') {
             if (p.y > canvas.height + 100) particlesRef.current.splice(i, 1);
        } else {
             if (p.life <= 0) particlesRef.current.splice(i, 1);
        }
    });

    // Draw Floating Texts
    floatTextsRef.current.forEach((ft, i) => {
        ft.life -= 0.02;
        ft.y += ft.vy;
        ft.scale += 0.02; 
        
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.translate(ft.x, ft.y);
        ctx.scale(ft.scale, ft.scale);
        
        ctx.font = "900 24px 'Courier New', monospace";
        ctx.fillStyle = ft.color;
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'black';
        ctx.strokeText(ft.text, 0, 0);
        ctx.fillText(ft.text, 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
        
        if (ft.life <= 0) floatTextsRef.current.splice(i, 1);
    });

    // Draw Clicks
    clicksRef.current.forEach((c, i) => {
        c.life -= 0.05;
        const radius = (1 - c.life) * 30;
        ctx.globalAlpha = c.life;
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (c.life <= 0) clicksRef.current.splice(i, 1);
    });

  }, [scale, debugMode, mapType, activeSkinId]);

  useEffect(() => {
    const loop = () => {
      update();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [update, draw]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasWrapperRef.current && canvasRef.current) {
         const { width, height } = canvasWrapperRef.current.getBoundingClientRect();
         canvasRef.current.width = width;
         canvasRef.current.height = height;
         
         const gridW = GRID_COLS * CELL_SIZE;
         const gridH = GRID_ROWS * CELL_SIZE;
         const totalW = gridW + ORBIT_PADDING * 2;
         const totalH = gridH + ORBIT_PADDING * 2;
         const s = Math.min(width / (totalW + 20), height / (totalH + 20)); 
         setScale(s);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (status !== 'PLAYING') return;
    
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx_raw = e.clientX - rect.left;
    const my_raw = e.clientY - rect.top;
    const mx_game = mx_raw / scale;
    const my_game = my_raw / scale;
    const clickX = mx_game;
    const clickY = my_game;
    
    clicksRef.current.push({ x: clickX, y: clickY, life: 1.0 });

    const HIT_PADDING = 8; 
    let bestCar: Car | null = null;
    let minDist = Infinity;

    for (const car of carsRef.current) {
      if (car.state !== CarState.PARKED) continue;
      
      const visualLen = (car.length * CELL_SIZE) - GAP;
      const visualWid = CELL_SIZE - GAP;
      let centerX = 0, centerY = 0;
      if (car.direction === 'LEFT' || car.direction === 'RIGHT') {
        centerX = car.x + visualLen/2; centerY = car.y + visualWid/2;
      } else {
        centerX = car.x + car.width/2; centerY = car.y + car.height/2;
      }
      
      const isHorizontal = car.direction === 'LEFT' || car.direction === 'RIGHT';
      const boxW = isHorizontal ? visualLen : visualWid;
      const boxH = isHorizontal ? visualWid : visualLen;

      const dx = Math.abs(clickX - centerX);
      const dy = Math.abs(clickY - centerY);
      
      const hitW = boxW / 2 + HIT_PADDING;
      const hitH = boxH / 2 + HIT_PADDING;
      
      if (dx <= hitW && dy <= hitH) {
          const dist = dx*dx + dy*dy;
          if (dist < minDist) {
            minDist = dist;
            bestCar = car;
          }
      }
    }
    
    if (bestCar) {
          console.log(`🚀 [Game] 玩家成功點擊車輛，準備出車: ${bestCar.id}`);
          triggerHaptic('light'); // 觸發輕微點擊震動
          bestCar.flash = true;
          
          setTimeout(() => {
              if (bestCar) {
                console.log(`🚀 [Game] 車輛正式啟動出發: ${bestCar.id}`);
                bestCar.flash = false;
                bestCar.state = CarState.EXITING;
                let smokeX = bestCar.x; let smokeY = bestCar.y;
                if (bestCar.direction === 'RIGHT') { smokeX = bestCar.x; smokeY = bestCar.y + CELL_SIZE/2; }
                else if (bestCar.direction === 'LEFT') { smokeX = bestCar.x + bestCar.width; smokeY = bestCar.y + CELL_SIZE/2; }
                else if (bestCar.direction === 'DOWN') { smokeX = bestCar.x + CELL_SIZE/2; smokeY = bestCar.y; }
                else if (bestCar.direction === 'UP') { smokeX = bestCar.x + CELL_SIZE/2; smokeY = bestCar.y + bestCar.height; }
                createSmoke(smokeX, smokeY, bestCar.direction);
              }
          }, 50);
    }
  };

  useEffect(() => {
     if (status === 'MENU') {
         initGame();
     }
  }, []);

  // 遊戲結束時，將最高分與最高關卡寫入 localStorage
  useEffect(() => {
    if (status === 'GAME_OVER_RANK') {
      console.log('🏆 [TrafficGame] 遊戲結束，進行最高分結算並儲存');
      const savedScore = localStorage.getItem('traffic_orbit_high_score');
      const savedLevel = localStorage.getItem('traffic_orbit_max_level');
      
      const currentHighScore = savedScore ? parseInt(savedScore, 10) : 0;
      const currentMaxLevel = savedLevel ? parseInt(savedLevel, 10) : 1;
      
      if (score > currentHighScore) {
        console.log(`🎉 [TrafficGame] 突破最高分紀錄！新紀錄: ${score}`);
        localStorage.setItem('traffic_orbit_high_score', score.toString());
      }
      if (level > currentMaxLevel) {
        console.log(`🎉 [TrafficGame] 突破最高關卡紀錄！新紀錄: ${level}`);
        localStorage.setItem('traffic_orbit_max_level', level.toString());
      }
      
      window.dispatchEvent(new Event('storage_score_updated'));
    }
  }, [status, score, level]);

  return (
    <div className="relative w-full h-full font-sans select-none" ref={containerRef} style={{ backgroundColor: COLORS.BACKGROUND }}>
      <HeaderBar 
        level={level}
        score={score}
        combo={combo}
        gold={gold}
        onOpenSettings={() => {
          console.log('🚀 [TrafficGame] 開啟設定彈窗');
          setShowSettings(true);
        }}
        onRetryLevel={() => {
          console.log('🚀 [TrafficGame] 重新挑戰此關卡');
          retryLevel();
        }}
        onOpenShop={() => {
          console.log('🚀 [TrafficGame] 打開皮膚商店');
          setShowShop(true);
        }}
        textColor={COLORS.TEXT}
        backgroundColor={COLORS.BACKGROUND}
      />

      {showCombo && (
        <div className="absolute top-36 left-0 right-0 flex justify-center z-20 pointer-events-none opacity-80">
           <div 
             className={`
                font-black drop-shadow-[0_0_15px_rgba(253,224,71,0.8)] italic transform -skew-x-12 animate-[bounce_0.2s_infinite]
                whitespace-nowrap
                ${combo >= 3 ? 'bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500' : 'text-yellow-600'}
             `}
             style={{ fontSize: `${Math.min(2 + combo * 0.3, 5)}rem` }}
           >
             {combo} COMBO!
           </div>
        </div>
      )}

      <GameCanvas 
        canvasRef={canvasRef}
        canvasWrapperRef={canvasWrapperRef}
        onPointerDown={handlePointerDown}
        backgroundColor={COLORS.BACKGROUND}
      />

      {status === 'ENDING_WON' && !showSettings && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
           <h2 className="text-6xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] animate-bounce select-none">
             {t('game.clear')}
           </h2>
        </div>
      )}

      <SettingsModal 
        show={showSettings}
        onClose={() => {
          console.log('🚀 [TrafficGame] 關閉設定彈窗');
          setShowSettings(false);
        }}
        gameSpeed={gameSpeed}
        setGameSpeed={(speed) => {
          console.log(`🚀 [TrafficGame] 更新遊戲速度為: ${speed}`);
          setGameSpeed(speed);
        }}
        debugMode={debugMode}
        setDebugMode={(debug) => {
          console.log(`🚀 [TrafficGame] 更新除錯碰撞箱顯示為: ${debug}`);
          setDebugMode(debug);
        }}
      />

      <ContinuePopup 
        show={status === 'LOST_CONTINUE' && !showSettings}
        onConfirmContinue={() => {
          console.log('🚀 [TrafficGame] 點擊確認復活');
          retryLevel();
        }}
        onCancelContinue={() => {
          console.log('🚀 [TrafficGame] 點擊拒絕復活，進行遊戲結算');
          setStatus('GAME_OVER_SUMMARY');
        }}
      />

      <GameOverSummaryPopup 
        show={status === 'GAME_OVER_SUMMARY' && !showSettings}
        onClick={() => {
          console.log('🚀 [TrafficGame] 點擊進入排名畫面');
          setStatus('GAME_OVER_RANK');
        }}
      />

      <RankingScreen 
        show={status === 'GAME_OVER_RANK' && !showSettings}
        score={score}
        level={level}
        onRestart={() => {
          console.log('🚀 [TrafficGame] 點擊一鍵重新開始遊戲');
          restartGameFull();
        }}
      />

      {showShop && (
        <ShopModal
          gold={gold}
          activeSkinId={activeSkinId}
          unlockedSkins={unlockedSkins}
          onClose={() => {
            console.log('🚀 [TrafficGame] 關閉皮膚商店');
            setShowShop(false);
          }}
          onUnlockSkin={handleUnlockSkin}
          onEquipSkin={handleEquipSkin}
        />
      )}
    </div>
  );
};