import React from 'react';
import { useTranslation } from '../utils/i18n';

interface SettingsModalProps {
  show: boolean;
  onClose: () => void;
  gameSpeed: number;
  setGameSpeed: (speed: number) => void;
  debugMode: boolean;
  setDebugMode: (debug: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  show,
  onClose,
  gameSpeed,
  setGameSpeed,
  debugMode,
  setDebugMode,
}) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    if (show) {
      console.log('🚀 [SettingsModal] 開啟設定選單');
    }
  }, [show]);

  if (!show) return null;

  const handleSpeedChange = (speed: number) => {
    console.log(`🔧 [SettingsModal] 調整遊戲速度為: ${speed}x`);
    setGameSpeed(speed);
  };

  const handleToggleDebug = () => {
    const nextDebug = !debugMode;
    console.log(`🔧 [SettingsModal] 切換除錯碰撞箱顯示: ${nextDebug ? '開啟' : '關閉'}`);
    setDebugMode(nextDebug);
  };

  return (
    <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-lg p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-white/20 animate-[fadeIn_0.2s_ease-out]">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex justify-between items-center">
          <span>{t('settings.title')}</span>
          <button 
            onClick={() => {
              console.log('🚀 [SettingsModal] 點擊關閉按鈕');
              onClose();
            }} 
            className="text-gray-500 hover:text-gray-850 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
          >
            ✕
          </button>
        </h3>
        
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-gray-700 mb-3 font-bold text-sm">{t('settings.speedLabel')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[0.5, 1, 1.5, 2].map(s => (
                <button 
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`py-2 rounded-lg font-bold text-xs transition-all border-2 ${
                    gameSpeed === s 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' 
                      : 'bg-gray-150 text-gray-600 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {s === 0.5 ? t('settings.speedSlow') : s === 1 ? t('settings.speedNormal') : s === 1.5 ? t('settings.speedFast') : t('settings.speedMax')}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-gray-700 font-bold text-sm">{t('settings.debugLabel')}</span>
            <button 
              onClick={handleToggleDebug}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${debugMode ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${debugMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => {
            console.log('🚀 [SettingsModal] 點擊確定關閉');
            onClose();
          }} 
          className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-md mt-2"
        >
          {t('settings.confirmBtn')}
        </button>
      </div>
    </div>
  );
};
