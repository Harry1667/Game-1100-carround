import React from 'react';
import { useTranslation } from '../utils/i18n';

interface RankingScreenProps {
  show: boolean;
  score: number;
  level: number;
  onRestart: () => void;
}

export const RankingScreen: React.FC<RankingScreenProps> = ({
  show,
  score,
  level,
  onRestart,
}) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    if (show) {
      console.log(`🚀 [RankingScreen] 顯示結算畫面, 關卡: ${level}, 分數: ${score}`);
    }
  }, [show, score, level]);

  if (!show) return null;

  // Calculate percentage of players beaten (formula matches original, capped at 99%)
  const beatenPercent = Math.min(99, Math.floor((score / 5000) * 100) + 1);

  return (
    <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center z-40 animate-[fadeIn_0.5s_ease-out] p-6 text-center select-none">
      <div className="relative mb-6">
        <div className="text-8xl md:text-[10rem] font-black text-amber-500 leading-none drop-shadow-2xl" style={{ textShadow: '4px 4px 0px #78350f' }}>
          {level}
        </div>
        <div className="text-xl font-bold text-gray-300 uppercase tracking-widest mt-2">
          {t('ranking.finalLevel')}
        </div>
      </div>
      
      <div className="mb-4 bg-slate-900/60 border border-slate-700/50 py-3 px-8 rounded-2xl shadow-inner">
        <div className="text-sm font-bold text-slate-400">{t('ranking.totalScore')}</div>
        <div className="text-3xl font-mono font-black text-white">{score.toLocaleString()}</div>
      </div>

      <div className="text-yellow-400 text-lg font-black mb-12 tracking-wide animate-[pulse_2s_infinite]">
        {t('ranking.congrats', { percent: beatenPercent })}
      </div>

      <button 
        onClick={() => {
          console.log('🚀 [RankingScreen] 點擊一鍵重新開始遊戲');
          onRestart();
        }}
        className="bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-full p-6 shadow-2xl transform hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-4 border-white/30"
        title={t('ranking.restartTooltip')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
      </button>
      <div className="text-xs text-slate-450 mt-4">{t('ranking.restartText')}</div>
    </div>
  );
};
