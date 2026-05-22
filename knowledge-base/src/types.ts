export interface CoffeeBean {
  id: string;
  name: string;
  englishName: string;
  roastLevel: "淺焙" | "中淺焙" | "中焙" | "中深焙" | "深焙";
  process: "水洗" | "日曬" | "蜜處理" | "半水洗";
  origin: string;
  altitude: string;
  flavorNotes: string[];
  description: string;
  acidity: number; // 1-5
  body: number; // 1-5
  sweetness: number; // 1-5
  imageType: "yirgacheffe" | "mandheling" | "bluemountain" | "costarica" | "kenya";
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

export interface BrewingProfile {
  beanWeight: number; // grams
  ratio: number; // e.g. 15 for 1:15
  waterTemp: number; // °C
  grindSize: "細" | "中細" | "中" | "中粗" | "粗";
  roastType: "極淺 / 淺" | "中淺 / 中" | "中深 / 深";
}
