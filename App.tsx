import React, { useState, useEffect, useCallback } from 'react';
import InteractiveMap from './components/Map';
import Timeline from './components/Timeline';
import InfoPanel from './components/InfoPanel';
import VideoGenerator from './components/VideoGenerator';
import OfflineManager from './components/OfflineManager';
import { fetchHistoricalContext } from './services/geminiService';
import { HistoricalData, HistoricalRegime } from './types';

const App: React.FC = () => {
  const [currentYear, setCurrentYear] = useState<number>(1000); // Start at year 1000 AD
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedRegime, setSelectedRegime] = useState<HistoricalRegime | null>(null);
  const [selectedAreaName, setSelectedAreaName] = useState<string | null>(null);

  const formatYear = (year: number) => {
    return year < 0 ? `公元前 ${Math.abs(year)}` : `公元 ${year}`;
  };

  const loadData = useCallback(async (year: number) => {
    setLoading(true);
    setError(null);
    setCurrentYear(year); // Ensure UI syncs
    // Reset selection when year changes because the regime might not exist anymore
    setSelectedRegime(null);
    setSelectedAreaName(null);
    
    try {
      const data = await fetchHistoricalContext(year);
      setHistoricalData(data);
    } catch (err) {
      console.error(err);
      setError("生成历史数据失败，请检查 API 密钥或网络连接。");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData(currentYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTimelineCommit = (year: number) => {
    setCurrentYear(year);
    loadData(year);
  };

  const handleTimelineChange = (year: number) => {
    setCurrentYear(year);
  };

  const handleRegimeClick = (regime: HistoricalRegime | null, areaName: string) => {
    setSelectedRegime(regime);
    setSelectedAreaName(areaName);
  };

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden bg-[#f8fafc]">
      <header className="absolute top-0 left-0 z-40 p-6 pointer-events-none flex flex-col items-start gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tighter drop-shadow-sm filter">
            欧洲<span className="text-blue-600">时空图</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1 bg-white/80 backdrop-blur inline-block px-2 py-1 rounded-md shadow-sm border border-gray-100">
            {formatYear(currentYear)} 历史地图册
          </p>
        </div>
        
        <div className="pointer-events-auto">
          <OfflineManager />
        </div>
      </header>
      
      <div className="absolute top-0 left-0 w-full z-40 pointer-events-none flex justify-center pt-2">
         {/* Center top area reserved for potential widgets if needed */}
      </div>

      <div className="absolute top-0 right-0 z-40 pointer-events-auto">
        <VideoGenerator currentYear={currentYear} onYearChange={loadData} />
      </div>

      <main className="flex-grow relative z-0">
        <InteractiveMap 
          historicalData={historicalData} 
          onRegimeClick={handleRegimeClick}
        />
      </main>

      <InfoPanel 
        data={historicalData} 
        loading={loading}
        selectedRegime={selectedRegime}
        selectedAreaName={selectedAreaName}
      />

      {error && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-50 text-red-600 p-6 rounded-xl shadow-2xl border border-red-200 z-50 text-center">
          <p className="font-bold text-lg mb-2">数据加载中断</p>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => loadData(currentYear)}
            className="text-sm bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2 rounded-lg transition-colors font-semibold"
          >
            重试加载
          </button>
        </div>
      )}

      <Timeline 
        year={currentYear} 
        onChange={handleTimelineChange} 
        onCommit={handleTimelineCommit}
        min={-2000}
        max={2000}
      />
    </div>
  );
};

export default App;