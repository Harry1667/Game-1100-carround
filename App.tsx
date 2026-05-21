import React from 'react';
import { TrafficGame } from './components/TrafficGame';
import { COLORS } from './constants';
import './index.css';

const App: React.FC = () => {
  React.useEffect(() => {
    console.log('🚀 [App] React 應用啟動，已套用 iOS 螢幕安全區域與鎖定樣式');
  }, []);

  return (
    <div className="w-screen h-[100dvh] flex items-center justify-center overflow-hidden" style={{ backgroundColor: COLORS.BACKGROUND }}>
      <div className="w-full h-full md:max-w-md md:max-h-[850px] md:rounded-3xl overflow-hidden shadow-2xl relative border-0 md:border-4 border-gray-800 bg-white">
        <TrafficGame />
      </div>
    </div>
  );
};

export default App;