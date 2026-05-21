import React, { useEffect } from 'react';
import { SKIN_CONFIG, SkinInfo } from '../constants';
import { useTranslation } from '../utils/i18n';
import { triggerHaptic } from '../utils/haptic';

console.log('🚀 [Shop] 載入 ShopModal 模組');

interface ShopModalProps {
  gold: number;
  activeSkinId: string;
  unlockedSkins: string[];
  onClose: () => void;
  onUnlockSkin: (skinId: string, price: number) => void;
  onEquipSkin: (skinId: string) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  gold,
  activeSkinId,
  unlockedSkins,
  onClose,
  onUnlockSkin,
  onEquipSkin,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    console.log('🚀 [Shop] 商店介面已開啟，目前狀態:', {
      gold,
      activeSkinId,
      unlockedSkins,
    });
  }, [gold, activeSkinId, unlockedSkins]);

  const handleAction = (skin: SkinInfo) => {
    const isUnlocked = unlockedSkins.includes(skin.id) || skin.price === 0;

    if (isUnlocked) {
      console.log(`🛒 [Shop] 玩家裝備皮膚: ${skin.id}`);
      onEquipSkin(skin.id);
    } else {
      if (gold >= skin.price) {
        console.log(`🛒 [Shop] 玩家解鎖皮膚: ${skin.id}，花費金幣: ${skin.price}`);
        onUnlockSkin(skin.id, skin.price);
      } else {
        console.warn(`⚠️ [Shop] 金幣餘額不足！需要: ${skin.price}, 目前只有: ${gold}`);
        // 觸發一個輕微警告震動
        triggerHaptic('warning');
      }
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col pt-[calc(20px+var(--safe-top,0px))] pb-[calc(20px+var(--safe-bottom,0px))] px-6 select-none animate-[fadeIn_0.2s_ease-out]">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white tracking-wide">{t('shop.title')}</h2>
        <button
          onClick={() => {
            console.log('🛒 [Shop] 點擊關閉皮膚商店');
            onClose();
          }}
          className="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Gold Display */}
      <div className="my-4 flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-5 py-3 shadow-inner">
        <span className="text-sm font-semibold text-white/60">{t('shop.gold')}</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-yellow-400 font-mono">🪙 {gold.toLocaleString()}</span>
        </div>
      </div>

      {/* Skin Cards List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {SKIN_CONFIG.map((skin) => {
          const isUnlocked = unlockedSkins.includes(skin.id) || skin.price === 0;
          const isActive = activeSkinId === skin.id;

          return (
            <div
              key={skin.id}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                isActive
                  ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.15)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              {/* Left Side Info */}
              <div className="flex items-center gap-4">
                {/* Visual Preview Shape */}
                <div
                  className="w-14 h-9 rounded-lg flex items-center justify-center relative overflow-hidden shadow-md"
                  style={{
                    background: skin.isSpecial
                      ? 'linear-gradient(45deg, #ef4444, #f59e0b, #10b981, #3b82f6, #8b5cf6)'
                      : skin.color || '#9ca3af',
                  }}
                >
                  <div className="w-6 h-4 bg-gray-900/60 rounded flex items-center justify-center">
                    <div className="w-3 h-2 bg-white/20 rounded-sm" />
                  </div>
                </div>

                {/* Skin Info */}
                <div>
                  <div className="font-bold text-white text-base leading-snug">
                    {t(skin.nameKey)}
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">
                    {skin.price === 0
                      ? '預設外觀'
                      : skin.isSpecial
                      ? '✨ 專屬炫光拖尾'
                      : '⚡ 專屬流光拖尾'}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleAction(skin)}
                className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ${
                  isActive
                    ? 'bg-yellow-400 text-black hover:bg-yellow-500 cursor-default'
                    : isUnlocked
                    ? 'bg-white/20 text-white hover:bg-white/30 border border-white/10'
                    : gold >= skin.price
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-black border border-yellow-500'
                    : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                }`}
                disabled={isActive}
              >
                {isActive
                  ? t('shop.used')
                  : isUnlocked
                  ? t('shop.use')
                  : t('shop.buy', { price: skin.price })}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Tip */}
      <div className="mt-4 text-center">
        <button
          onClick={() => onClose()}
          className="w-full bg-white text-black hover:bg-gray-200 py-3.5 rounded-2xl font-bold text-base transition-all shadow-md active:scale-[0.98]"
        >
          {t('shop.close')}
        </button>
      </div>
    </div>
  );
};
