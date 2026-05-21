import React from 'react';
import { useTranslation } from '../utils/i18n';

interface HeaderBarProps {
  level: number;
  score: number;
  combo: number;
  gold: number; // 🪙 玩家金幣數量
  onOpenSettings: () => void;
  onRetryLevel: () => void;
  onOpenShop: () => void; // 🛒 打開商店的回調
  textColor: string;
  backgroundColor: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  level,
  score,
  combo,
  gold,
  onOpenSettings,
  onRetryLevel,
  onOpenShop,
  textColor,
  backgroundColor,
}) => {
  const { t } = useTranslation();

  return (
    <div 
      className="absolute top-0 left-0 w-full min-h-[112px] h-[calc(112px+var(--safe-top,0px))] pt-[var(--safe-top,0px)] z-10 flex flex-col justify-between shadow-sm" 
      style={{ backgroundColor }}
    >
      <div className="flex items-center justify-between px-6 py-2 flex-1">
        {/* Left Side Actions (Settings & Shop) */}
        <div className="flex items-center gap-2">
          {/* Settings button */}
          <button 
            onClick={() => {
              console.log('🚀 [HeaderBar] 點擊開啟設定按鈕');
              onOpenSettings();
            }} 
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title={t('header.settingsTitle')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color: textColor }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Shop button with Gold Indicator */}
          <button
            onClick={() => {
              console.log('🛒 [HeaderBar] 點擊開啟皮膚商店，目前金幣:', gold);
              onOpenShop();
            }}
            className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 text-black px-3.5 py-1.5 rounded-full font-bold text-sm shadow-sm transition-all border border-yellow-500 active:scale-95"
            title={t('shop.title')}
          >
            <span className="text-base leading-none">🛒</span>
            <span className="font-mono text-sm leading-none">{gold}</span>
          </button>
        </div>
        
        {/* Level Display */}
        <div className="flex flex-col items-center">
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.5)' }}>{t('header.level')}</div>
          <div className="text-5xl font-mono font-bold tracking-wider drop-shadow-sm leading-none" style={{ color: textColor }}>{level}</div>
        </div>

        {/* Retry Button */}
        <button 
          onClick={() => {
            console.log('🚀 [HeaderBar] 點擊重新挑戰此關卡');
            onRetryLevel();
          }} 
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          title={t('header.retryTitle')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color: textColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Score Board */}
      <div className="flex justify-between px-8 pb-2 border-b border-gray-400/30">
        <div className="flex flex-col items-start">
          <span className="text-xs font-bold uppercase" style={{ color: 'rgba(0,0,0,0.5)' }}>{t('header.score')}</span>
          <span className="text-2xl font-mono font-bold" style={{ color: textColor }}>{score.toLocaleString()}</span>
        </div>
        {combo > 1 && (
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-yellow-600 uppercase">{t('header.combo')}</span>
            <span className="text-3xl font-black text-yellow-500 italic">x{combo}</span>
          </div>
        )}
      </div>
    </div>
  );
};
