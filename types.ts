export interface HistoricalRegime {
  name: string;
  color: string;
  isoCodes: string[]; // List of ISO Alpha-3 codes belonging to this regime approx.
  events: string[]; // List of key historical events for this regime in this year
}

export interface HistoricalData {
  year: number;
  summary: string;
  regimes: HistoricalRegime[];
}

export interface GeoJsonFeature {
  type: string;
  id: string; // ISO 3 code usually
  properties: {
    name: string;
    [key: string]: any;
  };
  geometry: any;
}

export interface TopologyData {
  type: string;
  objects: {
    countries: {
      type: string;
      geometries: GeoJsonFeature[];
    };
  };
}