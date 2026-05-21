// 🔧 [Haptic] 獨立的觸覺反饋模組，相容標準 PWA Vibrate 與 iOS Native Bridge 通訊

console.log('🚀 [Haptic] 載入觸覺反饋模組');

/**
 * 觸發手機震動反饋
 * @param type 震動強度類型
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning') => {
  console.log(`🔧 [Haptic] 觸發震動反饋: ${type}`);

  // 1. 優先嘗試呼叫 iOS WKWebView Bridge 原生震動 (包裝 iOS App 時使用)
  const anyWindow = window as any;
  if (
    anyWindow.webkit &&
    anyWindow.webkit.messageHandlers &&
    anyWindow.webkit.messageHandlers.hapticHandler
  ) {
    try {
      anyWindow.webkit.messageHandlers.hapticHandler.postMessage({ type });
      console.log('✅ [Haptic] 成功發送觸覺回饋請求至 iOS Native 橋接');
      return;
    } catch (e) {
      console.error('❌ [Haptic] 發送 iOS Native 觸覺橋接錯誤:', e);
    }
  }

  // 2. 退回到 H5 標準 Vibrate API
  if ('vibrate' in navigator) {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(30);
          break;
        case 'heavy':
          navigator.vibrate(80);
          break;
        case 'success':
          navigator.vibrate([20, 50, 20]);
          break;
        case 'warning':
          navigator.vibrate([50, 100, 50]);
          break;
      }
      console.log('✅ [Haptic] 標準 HTML5 Vibrate API 觸發成功');
    } catch (err) {
      console.warn('⚠️ [Haptic] 瀏覽器 navigator.vibrate 調用被拒絕或錯誤', err);
    }
  } else {
    console.log('ℹ️ [Haptic] 當前瀏覽器環境不支援 navigator.vibrate (多見於 iOS Safari，需打包 App 才能完整支援)');
  }
};
