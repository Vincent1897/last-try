import React, { useState } from 'react';
import JSZip from 'jszip';

const OfflineManager: React.FC = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // 1. Fetch map data
      const mapRes = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
      if (!mapRes.ok) throw new Error("Failed to fetch map data");
      const mapBlob = await mapRes.blob();

      // 2. Trigger download directly for the geojson file
      // We download it directly so users can place it in their public folder
      const url = window.URL.createObjectURL(mapBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'world.geojson';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert("下载成功！\n请将下载的 'world.geojson' 文件放置在您项目的 public 文件夹或根目录下，以便离线加载地图。");

    } catch (err) {
      console.error(err);
      alert("下载失败，请检查网络连接。");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
    >
      {downloading ? (
        <>
          <svg className="animate-spin h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          正在下载...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
          下载地图数据 (离线包)
        </>
      )}
    </button>
  );
};

export default OfflineManager;