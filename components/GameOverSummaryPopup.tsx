import React from 'react';
import { useTranslation } from '../utils/i18n';

interface GameOverSummaryPopupProps {
  show: boolean;
  onClick: () => void;
}

export const GameOverSummaryPopup: React.FC<GameOverSummaryPopupProps> = ({
  show,
  onClick,
}) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    if (show) {
      console.log('🚀 [GameOverSummaryPopup] 顯示遊戲結束提示');
    }
  }, [show]);

  if (!show) return null;

  return (
    <div 
      onClick={() => {
        console.log('🚀 [GameOverSummaryPopup] 點擊轉場至結算排名畫面');
        onClick();
      }}
      className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-30 animate-[fadeIn_0.5s_ease-out] cursor-pointer select-none"
    >
      <div className="text-center">
        <h2 className="text-5xl font-bold text-white mb-8 tracking-widest">{t('gameOver.title')}</h2>
        <p className="text-xl text-gray-300 font-light tracking-widest animate-pulse">{t('gameOver.clickToContinue')}</p>
      </div>
    </div>
  );
};
