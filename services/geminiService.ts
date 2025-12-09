import { GoogleGenAI, Type } from "@google/genai";
import { HistoricalData } from "../types";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// Cache to prevent re-fetching the same year rapidly
const cache = new Map<number, HistoricalData>();

export const fetchHistoricalContext = async (year: number): Promise<HistoricalData> => {
  if (cache.has(year)) {
    return cache.get(year)!;
  }

  const yearString = year < 0 ? `公元前 ${Math.abs(year)}` : `公元 ${year}`;

  const prompt = `
    请分析 ${yearString} 年的欧洲政治地图。
    
    任务：
    1. 识别这一特定时期存在于欧洲的主要政治力量、帝国、王国或部落。
    2. 根据其领土大致覆盖的现代国家，将这些政权映射到现代国家的 ISO Alpha-3 代码。
    3. 为每个政权分配一个独特的、具有历史感的十六进制颜色。
    4. 用**简体中文**提供一段关于该年份欧洲地缘政治局势的简短摘要（1句话）。
    5. 政权名称 (name) 必须使用**简体中文**。
    6. 为每个政权列出该年份或该时期发生的1-2个重大历史事件 (events)，事件描述要简练。
    
    约束条件：
    - 使用现代边界作为代理。如果一个帝国覆盖了现代国家的一部分，请包含该国家代码。
    - "isoCodes" 必须是字符串 ISO Alpha-3 代码的数组（例如 "FRA", "DEU", "ITA"）。
    - 覆盖所有主要的欧洲陆地。如果区域分散，可归类为 "独立/其他" (Independent/Other)。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            year: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            regimes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  color: { type: Type.STRING },
                  isoCodes: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  },
                  events: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "1-2 historical events for this regime around this year"
                  }
                },
                required: ["name", "color", "isoCodes", "events"]
              },
            },
          },
          required: ["year", "summary", "regimes"],
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as HistoricalData;
      // Ensure the returned year matches input logic (just in case AI normalizes it differently)
      data.year = year; 
      cache.set(year, data);
      return data;
    }
    
    throw new Error("No data returned");
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback data structure in case of error
    return {
      year,
      summary: "该时期数据暂不可用，请尝试其他年份。",
      regimes: []
    };
  }
};