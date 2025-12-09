import React, { useState, useEffect, useRef } from 'react';

interface VideoGeneratorProps {
  currentYear: number;
  onYearChange: (year: number) => Promise<void>;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ currentYear, onYearChange }) => {
  const [startYear, setStartYear] = useState<number>(1);
  const [endYear, setEndYear] = useState<number>(1000);
  const [step, setStep] = useState<number>(50);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);

  // Control refs
  const isPlayingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Stop playback if unmounted
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" } as any, // Type assertion for compatibility
        audio: false
      });

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `europe_history_evolution_${new Date().getTime()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Reset
        recordedChunksRef.current = [];
        setIsRecording(false);
        
        // Stop all tracks to clear the browser "sharing" indicator
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      
      // Hook into the stream ending (e.g. user clicks "Stop sharing" in browser UI)
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      };

    } catch (err) {
      console.error("Error starting recording:", err);
      alert("无法启动录制，请确保您授予了屏幕录制权限。");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handlePlay = async () => {
    // If already playing, stop it
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    // Start playback
    setIsPlaying(true);
    isPlayingRef.current = true; // Set IMMEDIATELY to true for the loop

    // Logic to determine start year
    let yearToLoad = startYear;
    // If current year is within range and we want to continue, we could.
    // But usually "Start" implies starting from the configured start year
    // unless we are already there. 
    // Let's force start from 'startYear' to be consistent with "Generation".
    
    // Safety check
    if (yearToLoad > endYear) {
      alert("起始年份不能大于结束年份");
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    try {
      // Loop
      while (isPlayingRef.current && yearToLoad <= endYear) {
        // 1. Load data
        await onYearChange(yearToLoad);
        
        // 2. Wait for visual stability (User can watch)
        // If recording, maybe wait a bit longer or shorter? 
        // 2 seconds is a good pace.
        if (!isPlayingRef.current) break;
        await new Promise(r => setTimeout(r, 2000));
        
        // 3. Increment
        if (!isPlayingRef.current) break;
        yearToLoad += step;
      }
    } catch (e) {
      console.error("Playback error", e);
    } finally {
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  };

  if (!expanded) {
    return (
      <button 
        onClick={() => setExpanded(true)}
        className="fixed top-6 right-1/2 translate-x-1/2 bg-white/90 backdrop-blur-md px-5 py-2 rounded-full shadow-xl border border-blue-200 text-blue-900 font-bold z-40 hover:bg-blue-50 transition-all flex items-center gap-2 transform hover:scale-105"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
        </svg>
        历史演变模式
      </button>
    );
  }

  return (
    <div className="fixed top-6 right-1/2 translate-x-1/2 bg-white/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white/50 z-40 w-[95%] max-w-lg transition-all ring-1 ring-black/5">
      <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
          <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </span>
          历史演变生成器
        </h3>
        <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">起始年份</label>
          <input 
            type="number" 
            value={startYear} 
            onChange={e => setStartYear(parseInt(e.target.value))}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            disabled={isPlaying}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">结束年份</label>
          <input 
            type="number" 
            value={endYear} 
            onChange={e => setEndYear(parseInt(e.target.value))}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            disabled={isPlaying}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">步长 (年)</label>
          <input 
            type="number" 
            value={step} 
            min={1}
            onChange={e => setStep(parseInt(e.target.value))}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            disabled={isPlaying}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {/* Play Button */}
          <button 
            onClick={handlePlay}
            className={`flex-[2] py-2.5 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
              isPlaying 
                ? 'bg-red-500 hover:bg-red-600 ring-red-200' 
                : 'bg-blue-600 hover:bg-blue-700 ring-blue-200'
            }`}
          >
            {isPlaying ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                </svg>
                停止演变
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                开始演变
              </>
            )}
          </button>

          {/* Record Button */}
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`flex-1 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 border ${
              isRecording
                ? 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            title={isRecording ? "停止录制并下载" : "录制屏幕内容"}
          >
            {isRecording ? (
              <>
                <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"/>
                停止
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                录制
              </>
            )}
          </button>
        </div>
        
        {isPlaying && (
          <div className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-2 rounded-lg flex items-center justify-center gap-2 border border-blue-100">
            <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            正在生成数据: 公元 {currentYear} 年...
          </div>
        )}
        
        {!isPlaying && isRecording && (
          <div className="bg-red-50 text-red-600 text-xs font-medium px-3 py-2 rounded-lg text-center border border-red-100">
            屏幕录制中... 点击“开始演变”以录制历史进程
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGenerator;