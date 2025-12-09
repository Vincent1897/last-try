import React from 'react';
import { HistoricalData, HistoricalRegime } from '../types';

interface InfoPanelProps {
  data: HistoricalData | null;
  loading: boolean;
  selectedRegime: HistoricalRegime | null;
  selectedAreaName: string | null;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ data, loading, selectedRegime, selectedAreaName }) => {
  const formatYear = (year: number) => {
    return year < 0 ? `公元前 ${Math.abs(year)}` : `公元 ${year}`;
  };

  if (loading) {
    return (
      <div className="absolute top-4 right-4 w-80 bg-white/90 backdrop-blur p-6 rounded-xl shadow-lg border border-gray-100 animate-pulse z-40">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 w-80 max-h-[75vh] flex flex-col gap-4 z-40 pointer-events-none">
      
      {/* 1. Selected Regime Detail Box (Top priority if selected) */}
      {(selectedRegime || selectedAreaName) && selectedAreaName !== "Ocean" && (
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-xl shadow-xl border border-blue-100 pointer-events-auto transition-all duration-300">
           <div className="flex items-center gap-3 mb-3 border-b border-gray-100 pb-2">
              {selectedRegime && (
                <div 
                  className="w-5 h-5 rounded-full shadow-sm shrink-0 border border-gray-200" 
                  style={{ backgroundColor: selectedRegime.color }}
                />
              )}
              <h3 className="text-lg font-bold text-gray-800">
                {selectedRegime ? selectedRegime.name : selectedAreaName}
              </h3>
           </div>
           
           <div className="text-sm text-gray-600">
             {selectedRegime ? (
               <div>
                  <h4 className="font-semibold text-gray-500 text-xs uppercase mb-2">
                    {formatYear(data.year)} 重大事件
                  </h4>
                  {selectedRegime.events && selectedRegime.events.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {selectedRegime.events.map((evt, i) => (
                        <li key={i}>{evt}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="italic text-gray-400">该时期暂无收录重大历史事件。</p>
                  )}
               </div>
             ) : (
               <p>该地区在此年份未被归类为主要统一政权，或属于独立/过渡状态。</p>
             )}
           </div>
        </div>
      )}

      {/* 2. General Overview Box */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-lg border border-gray-100 overflow-y-auto pointer-events-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{formatYear(data.year)}</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          {data.summary}
        </p>

        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">政权列表</h3>
        <div className="space-y-2">
          {data.regimes.map((regime, idx) => (
            <div key={`${regime.name}-${idx}`} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-default">
              <div 
                className="w-4 h-4 rounded-full shadow-sm shrink-0" 
                style={{ backgroundColor: regime.color }}
              />
              <span className="text-sm font-medium text-gray-700 truncate" title={regime.name}>
                {regime.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;