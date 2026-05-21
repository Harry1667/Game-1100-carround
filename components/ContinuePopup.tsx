import React from 'react';
import { useTranslation } from '../utils/i18n';

interface ContinuePopupProps {
  show: boolean;
  onConfirmContinue: () => void;
  onCancelContinue: () => void;
}

export const ContinuePopup: React.FC<ContinuePopupProps> = ({
  show,
  onConfirmContinue,
  onCancelContinue,
}) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    if (show) {
      console.log('🚀 [ContinuePopup] 顯示繼續遊戲確認彈窗');
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-20 animate-[fadeIn_0.4s_ease-out]">
      <div className="bg-[#f5f0e1]/95 backdrop-blur-lg p-6 rounded-3xl shadow-2xl text-center w-80 border-4 border-white flex flex-col items-center">
        <h2 
          className="text-4xl font-black text-black mb-10 drop-shadow-sm select-none" 
          style={{ WebkitTextStroke: '1px white' }}
        >
          {t('continue.title')}
        </h2>
        
        <div className="flex gap-4 justify-center w-full">
          <button 
            onClick={() => {
              console.log('🚀 [ContinuePopup] 玩家選擇「否」');
              onCancelContinue();
            }} 
            className="w-1/2 bg-[#06b6d4] hover:bg-[#0891b2] text-white text-xl font-black py-4 rounded-2xl border-b-8 border-[#155e75] active:border-b-0 active:translate-y-2 transition-all shadow-lg"
          >
            {t('continue.no')}
          </button>
          <button 
            onClick={() => {
              console.log('🚀 [ContinuePopup] 玩家選擇「是」，使用復活功能');
              onConfirmContinue();
            }} 
            className="w-1/2 bg-[#fbbf24] hover:bg-[#f59e0b] text-white text-xl font-black py-4 rounded-2xl border-b-8 border-[#b45309] active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-1.5 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            {t('continue.yes')}
          </button>
        </div>
      </div>
    </div>
  );
};
