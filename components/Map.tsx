import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { HistoricalData, GeoJsonFeature, HistoricalRegime } from '../types';

interface MapProps {
  historicalData: HistoricalData | null;
  onRegimeClick: (regime: HistoricalRegime | null, countryName: string) => void;
}

const oceanLabels = [
  { name: "大西洋", coordinates: [-15, 48] },
  { name: "地中海", coordinates: [18, 35] },
  { name: "北海", coordinates: [3, 56] },
  { name: "波罗的海", coordinates: [19, 57] },
  { name: "黑海", coordinates: [34, 43] },
  { name: "挪威海", coordinates: [5, 65] }
];

const InteractiveMap: React.FC<MapProps> = ({ historicalData, onRegimeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<any | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: React.ReactNode } | null>(null);
  
  // Keep track of the zoom behavior to call it from buttons
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const selectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);

  // Load Map Data once on mount
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
      })
      .catch(err => console.error("Failed to load map data", err));
  }, []);

  // Map regimes to ISO codes for O(1) lookup
  const countryColorMap = useMemo(() => {
    const map = new Map<string, { regime: HistoricalRegime }>();
    if (!historicalData) return map;

    historicalData.regimes.forEach(regime => {
      regime.isoCodes.forEach(iso => {
        map.set(iso, { regime });
      });
    });
    return map;
  }, [historicalData]);

  // Render Map
  useEffect(() => {
    if (!geoData || !svgRef.current || !containerRef.current) return;
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const svg = d3.select(svgRef.current);
    selectionRef.current = svg;
    
    // Clear everything but ensure we re-create groups in order
    svg.selectAll("*").remove(); 

    const g = svg.append("g");

    // Center the map on Europe
    const projection = d3.geoMercator()
      .center([15, 54]) 
      .scale(width / 1.5) 
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // 1. Draw Ocean Labels (Fixed text on the map layer)
    g.selectAll(".ocean-label")
      .data(oceanLabels)
      .enter()
      .append("text")
      .attr("class", "ocean-label select-none pointer-events-none")
      .attr("x", d => projection(d.coordinates as [number, number])?.[0] || 0)
      .attr("y", d => projection(d.coordinates as [number, number])?.[1] || 0)
      .attr("text-anchor", "middle")
      .attr("fill", "#93c5fd") // lighter blue text
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("font-style", "italic")
      .attr("opacity", "0.6")
      .text(d => d.name);

    const features = geoData.features as GeoJsonFeature[];

    // 2. Draw countries
    const paths = g.selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("d", path as any)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.5)
      .attr("class", "transition-all duration-200 ease-out cursor-pointer")
      .attr("fill", (d: GeoJsonFeature) => {
        const iso = d.id;
        const entry = countryColorMap.get(iso);
        return entry ? entry.regime.color : "#cbd5e1"; // Slate-300 for no data
      });

    // Tooltip & Click interactions
    paths
      .on("mouseover", (event, d: GeoJsonFeature) => {
        const iso = d.id;
        const entry = countryColorMap.get(iso);
        const countryName = d.properties.name;
        
        let content: React.ReactNode = <span className="font-bold">{countryName}</span>;
        
        if (entry) {
          content = (
            <div className="flex flex-col gap-2">
               <div className="font-bold text-lg border-b border-gray-600 pb-1 mb-1">
                 {entry.regime.name}
               </div>
               {entry.regime.events && entry.regime.events.length > 0 ? (
                 <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                   {entry.regime.events.slice(0, 3).map((e, i) => (
                     <li key={i} className="leading-tight">{e}</li>
                   ))}
                 </ul>
               ) : (
                 <span className="text-xs text-gray-400 italic">暂无事件记录</span>
               )}
            </div>
          );
        }
        
        setTooltip({ x: event.clientX, y: event.clientY, content });
        
        // Highlight effect
        d3.select(event.currentTarget)
          .attr("stroke", "#000")
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.8);
      })
      .on("mousemove", (event) => {
        setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
      })
      .on("mouseout", (event) => {
        setTooltip(null);
        d3.select(event.currentTarget)
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 0.5)
          .attr("opacity", 1);
      })
      .on("click", (event, d: GeoJsonFeature) => {
        event.stopPropagation();
        const iso = d.id;
        const entry = countryColorMap.get(iso);
        // Call parent handler
        onRegimeClick(entry ? entry.regime : null, d.properties.name);
      });

    // Deselect on clicking empty space (ocean)
    svg.on("click", () => {
       onRegimeClick(null, "Ocean");
    });

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 8]) // Adjusted zoom range
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      })
      .on("start", () => {
        svg.classed("cursor-grabbing", true);
        svg.classed("cursor-grab", false);
      })
      .on("end", () => {
        svg.classed("cursor-grabbing", false);
        svg.classed("cursor-grab", true);
      });

    svg.call(zoom).classed("cursor-grab", true);
    zoomBehavior.current = zoom;

  }, [geoData, countryColorMap]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!svgRef.current || !zoomBehavior.current || !selectionRef.current) return;
    const scaleFactor = direction === 'in' ? 1.3 : 0.7;
    selectionRef.current.transition().duration(300).call(zoomBehavior.current.scaleBy, scaleFactor);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-[#dbeafe] relative overflow-hidden">
      <svg ref={svgRef} className="w-full h-full block" />
      
      {/* Zoom Controls - Left Side */}
      <div className="absolute top-36 left-4 flex flex-col gap-2 z-30">
        <button 
          onClick={() => handleZoom('in')}
          className="w-10 h-10 bg-white/90 backdrop-blur rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-blue-50 active:bg-blue-100 font-bold text-xl border border-gray-200 transition-colors"
          aria-label="放大"
          title="放大地图"
        >
          +
        </button>
        <button 
          onClick={() => handleZoom('out')}
          className="w-10 h-10 bg-white/90 backdrop-blur rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-blue-50 active:bg-blue-100 font-bold text-xl border border-gray-200 transition-colors"
          aria-label="缩小"
          title="缩小地图"
        >
          -
        </button>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div 
          className="fixed pointer-events-none bg-gray-900/95 backdrop-blur text-white text-sm px-4 py-3 rounded-lg shadow-2xl z-[60] max-w-[280px]"
          style={{ 
            left: tooltip.x, 
            top: tooltip.y - 15,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {tooltip.content}
        </div>
      )}
      
      <div className="absolute bottom-28 left-4 text-[10px] text-gray-500 pointer-events-none bg-white/60 backdrop-blur px-2 py-1 rounded shadow-sm border border-white/50">
        按住左键拖动地图 · 滚轮缩放
      </div>
    </div>
  );
};

export default InteractiveMap;