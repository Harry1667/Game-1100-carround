import { useState, useEffect } from 'react';

export type Language = 'zh-TW' | 'zh-CN' | 'en';

const TRANSLATIONS = {
  'zh-TW': {
    header: {
      level: '關卡',
      score: '目前得分',
      combo: 'COMBO 連擊',
      settingsTitle: '遊戲設定',
      retryTitle: '重新挑戰',
    },
    continue: {
      title: '🚘 繼續挑戰？',
      no: '否',
      yes: '是',
    },
    gameOver: {
      title: '💥 遊戲結束',
      clickToContinue: '點擊任意處查看排名成績',
    },
    ranking: {
      finalLevel: '最終突破關卡',
      totalScore: '總得分',
      congrats: '🎉 恭喜！您擊敗了全球 {percent}% 的玩家！',
      restartTooltip: '重新開始遊戲',
      restartText: '點擊按鈕重啟挑戰',
    },
    settings: {
      title: '🎮 遊戲設定',
      speedLabel: '🏎️ 遊戲運行速度',
      speedSlow: '慢速',
      speedNormal: '正常',
      speedFast: '快速',
      speedMax: '極速',
      debugLabel: '🔍 顯示除錯碰撞箱',
      confirmBtn: '確認並返回',
    },
    game: {
      great: '好極了！',
      excellent: '卓越！',
      amazing: '不可思議！',
      unstoppable: '勢不可擋！',
      clear: '過關成功！',
    },
    shop: {
      title: '🛒 酷炫車輛皮膚商店',
      gold: '我的金幣',
      use: '裝備',
      used: '已裝備',
      buy: '解鎖 ({price} 金幣)',
      close: '返回遊戲',
      skin: {
        default: '經典跑車',
        taxi: '黃色計程車',
        cyberpunk: '科技青藍跑車',
        neon_pink: '霓虹粉紫賽車',
        rainbow: '炫光彩虹車 🌈',
      }
    }
  },
  'zh-CN': {
    header: {
      level: '关卡',
      score: '当前得分',
      combo: 'COMBO 连击',
      settingsTitle: '游戏设置',
      retryTitle: '重新挑战',
    },
    continue: {
      title: '🚘 继续挑战？',
      no: '否',
      yes: '是',
    },
    gameOver: {
      title: '💥 游戏结束',
      clickToContinue: '点击任意处查看排名成绩',
    },
    ranking: {
      finalLevel: '最终突破关卡',
      totalScore: '总得分',
      congrats: '🎉 恭喜！您击败了全球 {percent}% 的玩家！',
      restartTooltip: '重新开始游戏',
      restartText: '点击按钮重启挑战',
    },
    settings: {
      title: '🎮 游戏设置',
      speedLabel: '🏎️ 游戏运行速度',
      speedSlow: '慢速',
      speedNormal: '正常',
      speedFast: '快速',
      speedMax: '极速',
      debugLabel: '🔍 显示除错碰撞箱',
      confirmBtn: '确认并返回',
    },
    game: {
      great: '棒极了！',
      excellent: '卓越！',
      amazing: '不可思议！',
      unstoppable: '势不可挡！',
      clear: '过关成功！',
    },
    shop: {
      title: '🛒 酷炫车辆皮肤商店',
      gold: '我的金币',
      use: '装备',
      used: '已装备',
      buy: '解锁 ({price} 金币)',
      close: '返回游戏',
      skin: {
        default: '经典跑车',
        taxi: '黄色出租车',
        cyberpunk: '科技青蓝跑车',
        neon_pink: '霓虹粉紫赛车',
        rainbow: '炫光彩虹车 🌈',
      }
    }
  },
  'en': {
    header: {
      level: 'STAGE',
      score: 'SCORE',
      combo: 'COMBO',
      settingsTitle: 'Game Settings',
      retryTitle: 'Retry Stage',
    },
    continue: {
      title: '🚘 CONTINUE?',
      no: 'NO',
      yes: 'YES',
    },
    gameOver: {
      title: '💥 GAME OVER',
      clickToContinue: 'Click anywhere to view results',
    },
    ranking: {
      finalLevel: 'FINAL STAGE REACHED',
      totalScore: 'TOTAL SCORE',
      congrats: '🎉 Congrats! You beat {percent}% of players globally!',
      restartTooltip: 'Restart Game',
      restartText: 'Tap to restart challenge',
    },
    settings: {
      title: '🎮 SETTINGS',
      speedLabel: '🏎️ GAME SPEED',
      speedSlow: 'Slow',
      speedNormal: 'Normal',
      speedFast: 'Fast',
      speedMax: 'Max',
      debugLabel: '🔍 Show Debug Colliders',
      confirmBtn: 'Confirm & Close',
    },
    game: {
      great: 'Great!',
      excellent: 'Excellent!',
      amazing: 'Amazing!',
      unstoppable: 'Unstoppable!',
      clear: 'STAGE CLEAR!',
    },
    shop: {
      title: '🛒 Cool Vehicle Skin Shop',
      gold: 'My Gold',
      use: 'Equip',
      used: 'Equipped',
      buy: 'Unlock ({price} Gold)',
      close: 'Back to Game',
      skin: {
        default: 'Classic Sedan',
        taxi: 'Yellow Taxi',
        cyberpunk: 'Cyber Cyberpunk',
        neon_pink: 'Neon Pink Racer',
        rainbow: 'Rainbow Prism 🌈',
      }
    }
  }
};

export const getBrowserLanguage = (): Language => {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language || (navigator as any).userLanguage || 'en';
  const lower = lang.toLowerCase();
  
  if (lower.startsWith('zh-tw') || lower.startsWith('zh-hk') || lower.startsWith('zh-mo')) {
    return 'zh-TW';
  }
  if (lower.startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en';
};

export const useTranslation = () => {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    setLang(getBrowserLanguage());
  }, []);

  const t = (path: string, variables?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let fallback: any = TRANSLATIONS['en'];
        for (const fKey of keys) {
          if (fallback && typeof fallback === 'object' && fKey in fallback) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    let result = current;
    if (variables) {
      Object.entries(variables).forEach(([key, val]) => {
        result = result.replace(new RegExp(`{${key}}`, 'g'), String(val));
      });
    }

    return result;
  };

  return { t, lang, setLang };
};
