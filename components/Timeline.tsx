import React, { useRef, useEffect, useState } from 'react';

interface TimelineProps {
  year: number;
  onChange: (year: number) => void;
  onCommit: (year: number) => void;
  min?: number;
  max?: number;
}

const Timeline: React.FC<TimelineProps> = ({ 
  year, 
  onChange, 
  onCommit,
  min = -2000, 
  max = 2000 
}) => {
  const [localYear, setLocalYear] = useState(year);
  const [inputValue, setInputValue] = useState(year.toString());

  // Sync local state if parent updates year externally
  useEffect(() => {
    setLocalYear(year);
    setInputValue(year.toString());
  }, [year]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setLocalYear(val);
    setInputValue(val.toString());
    onChange(val);
  };

  const handleSliderCommit = () => {
    commitInput(localYear);
  };
  
  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Commit on key up for arrow keys interaction
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          commitInput(localYear);
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed)) {
        commitInput(parsed);
    } else {
        setInputValue(localYear.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        const parsed = parseInt(inputValue, 10);
        if (!isNaN(parsed)) {
            commitInput(parsed);
        }
    }
  };

  const commitInput = (val: number) => {
    let finalVal = val;
    if (isNaN(finalVal)) finalVal = min;
    if (finalVal < min) finalVal = min;
    if (finalVal > max) finalVal = max;
    
    // Skip year 0 roughly
    if (finalVal === 0) finalVal = 1;

    setLocalYear(finalVal);
    setInputValue(finalVal.toString());
    onChange(finalVal);
    onCommit(finalVal);
  };

  const formatYearDisplay = (val: number) => {
    if (val < 0) return `公元前 ${Math.abs(val)}`;
    return `公元 ${val}`;
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-xl border-t border-gray-200/50 p-6 fixed bottom-0 left-0 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
        
        {/* Header Display */}
        <div className="flex flex-col items-center">
             <div className="text-3xl font-black text-gray-800 tracking-tight flex items-baseline gap-2">
               <span className="text-xl text-gray-500 font-medium">当前年份:</span>
               {formatYearDisplay(localYear)} 
               <span className="text-xl text-gray-500 font-medium">年</span>
             </div>
             <div className="flex items-center gap-2 mt-2">
                 <span className="text-xs font-bold text-gray-400 uppercase">快速跳转</span>
                 <input 
                   type="number"
                   min={min}
                   max={max}
                   value={inputValue}
                   onChange={handleInputChange}
                   onBlur={handleInputBlur}
                   onKeyDown={handleInputKeyDown}
                   placeholder="输入年份..."
                   className="text-sm bg-gray-100 border border-gray-200 rounded px-2 py-1 w-24 text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                 />
                 <span className="text-[10px] text-gray-400">(负数为公元前)</span>
             </div>
        </div>
        
        {/* Slider Controls */}
        <div className="w-full flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400 whitespace-nowrap min-w-[3rem] text-right">
                {formatYearDisplay(min)}
            </span>
            
            <input
              type="range"
              min={min}
              max={max}
              value={localYear}
              onChange={handleSliderChange}
              onMouseUp={handleSliderCommit}
              onTouchEnd={handleSliderCommit}
              onKeyUp={handleKeyUp}
              className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all hover:bg-gray-300"
              aria-label="年份选择器"
            />
            
            <span className="text-xs font-bold text-gray-400 whitespace-nowrap min-w-[3rem]">
                {formatYearDisplay(max)}
            </span>
        </div>
      </div>
    </div>
  );
};

export default Timeline;