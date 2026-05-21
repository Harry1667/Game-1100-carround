import React, { useEffect } from 'react';

interface GameCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasWrapperRef: React.RefObject<HTMLDivElement | null>;
  onPointerDown: (e: React.PointerEvent) => void;
  backgroundColor: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  canvasRef,
  canvasWrapperRef,
  onPointerDown,
  backgroundColor,
}) => {
  useEffect(() => {
    console.log('🚀 [GameCanvas] 掛載 Canvas 原生事件監聽，防止 iOS 系統手勢與下拉回彈衝突');
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefault = (e: TouchEvent) => {
      // 確保取消預設行為以防雙指放大與滾動
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    // passive: false 是必須的，否則 preventDefault 會被瀏覽器忽略
    canvas.addEventListener('touchstart', preventDefault as any, { passive: false });
    canvas.addEventListener('touchmove', preventDefault as any, { passive: false });

    return () => {
      console.log('🧹 [GameCanvas] 解除 Canvas 原生事件監聽');
      canvas.removeEventListener('touchstart', preventDefault as any);
      canvas.removeEventListener('touchmove', preventDefault as any);
    };
  }, [canvasRef]);

  return (
    <div 
      ref={canvasWrapperRef} 
      className="absolute top-[calc(112px+var(--safe-top,0px))] left-0 w-full bottom-0 select-none" 
      style={{ backgroundColor }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          console.log('🎮 [GameCanvas] Canvas 點擊觸發，位置: ', { clientX: e.clientX, clientY: e.clientY });
          onPointerDown(e);
        }}
        className="block w-full h-full touch-none cursor-pointer"
      />
    </div>
  );
};

