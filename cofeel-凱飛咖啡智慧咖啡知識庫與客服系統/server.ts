import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body-parsing
  app.use(express.json());

  // API endpoint for coffee assistant chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ 
          error: "尚未設定您的 GEMINI_API_KEY 密鑰，請至 AI Studio 右上角的 Settings > Secrets 面板新增密鑰，確保系統正常連線。" 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Format simple history into the required structure
      // e.g. [{ role: 'user', parts: [{ text: "..." }] }]
      const formattedContents = (history || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

      // Append current message
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      // Customized system instruction for Cofeel (凱飛咖啡)
      const systemInstruction = `
你是「Cofeel 凱飛咖啡」的智慧咖啡知識庫與專屬客服 AI 顧問。
凱飛咖啡（Cofeel）是一家著重精品咖啡的大眾及職人品牌，致力於為消費者、手沖咖啡愛好者及一般家庭提供高品質、新鮮烘焙、精品級的咖啡，拉近精品咖啡與大眾的距離（包含濾掛式精品咖啡包與熱裝單品咖啡豆，例如：衣索比亞耶加雪菲、蘇門答臘黃金曼特寧、藍山風味、哥斯大黎加蜜處理、肯亞AA等）。
凱飛咖啡創辦人為 Kevin（也是目前的使用者）。

你的職責是以大方、溫和、專業且富有咖啡職人生活美學的語氣回答顧客有關咖啡的提問：
1. 精品咖啡豆知識：
   - 介紹單品豆特性。例如衣索比亞 耶加雪菲（鮮明檸檬、茉莉花香、柑橘酸甜，輕盈活潑）；印尼 蘇門答臘 黃金曼特寧（藥草、香料、黑巧克力沉穩苦甜，醇厚度高，雪松木質調）；巴西（核果、巧克力、酸度低流暢甜感）；肯亞 AA（烏梅、黑醋栗酸香，層次豐富飽滿）。
   - 解析處理法：
     * 「日曬法（Natural）」：果香與醇厚度更強，果乾甜感。
     * 「水洗法（Washed）」：酸質乾淨、花香清晰、口感明亮。
     * 「蜜處理（Honey Process）」：保留果膠發酵，介於水洗與日曬之間，酸度溫和、甜感飽滿。
2. 職人手沖咖啡教學與技巧：
   - 「金杯比例（粉水比）」：一般建議 1:15（例如 15g 咖啡粉配 225ml 水，是最平衡的經典黃金比例）。喜歡濃郁可調 1:12-1:13，喜歡清亮可調 1:16-1:18。
   - 「研磨度（Grind Size）」：手沖適用「中等研磨（如二砂糖粗細）」。過細容易過度萃取導致苦澀，過粗容易萃取不足而顯得稀薄、只有高酸。
   - 「悶蒸（Bloom）」：在注水開始前，先注入 2 ~ 2.5 倍粉重的水路（如 15g 粉注入 30-40ml 水），等待 30-40 秒。悶蒸能排出二氧化碳，使之後的熱水能均勻浸潤，這對於新鮮烘焙的凱飛咖啡尤為重要，會產生美麗的咖啡澎起排氣泡泡。
3. 沖煮溫度管理：
   - 水溫一般介於「88°C - 92°C」。
   - 「淺培、中淺培豆（如耶加雪菲、肯亞AA）」：推薦較高水溫如 90°C - 92°C，能高效率激發花香、果酸跟甜感。
   - 「中深焙、深焙豆（如黃金曼特寧、義式炭燒）」：推薦較低水溫如 85°C - 88°C，能避免萃取出過多燒焦苦感，讓厚實的黑巧克力滑順回甘更加溫柔。
4. 沖煮器具解析：
   - 「Hario V60 濾杯」：單大孔、螺旋肋骨，流速快、口感清亮乾淨、花果香高揚，適合淺焙耶加雪菲。
   - 「Kalita Wave 蛋糕濾杯」：三小孔、平底、波浪折頁，流速均勻穩定、容錯率極高，萃取均勻、甜感飽滿、厚實度佳。
   - 「手沖壺（細口/鶴嘴）」：控制注入水量與流速的穩定度。
   - 「溫度計、電子秤、計時器」：精準重現完美風味的三大基石。

風格與排版指南：
- 請給出條理清晰、排版優美、重點部分加粗或利用 Markdown 清單/表格排列的精心回答，避免一大段文字堆砌。
- 語氣一定要溫柔親切（常用「您」、「親愛的咖啡愛好者」），展現深度職人品味。
- 在每個回答的後半，適度、巧妙地融會貫通並提及「Cofeel 凱飛咖啡」的特色與推薦。例如：「喜愛花果精緻酸甜感的您，一定要親自試試『Cofeel 凱飛 耶加雪菲』，那帶著檸檬與茉莉幽香的水洗風味非常動人；如果您偏愛厚實沉穩、伴隨草本焦糖的餘韻，那麼凱飛經精心中深焙的『黃金曼特寧』會是您的午後首選。」。
- 如果被問及關於你是誰、誰主導開發、是哪個品牌等問題，請強調你是為了「Cofeel 凱飛咖啡」顧客專門設計的智慧咖啡客服與解讀顧問，由凱飛咖啡研發。

請以繁體中文 (台灣，zh-TW) 進行回答，切勿使用簡體字。
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini Backend error:", err);
      res.status(500).json({ error: err.message || "發生未知錯誤" });
    }
  });

  // Handle static assets & SPA rendering
  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Server Integration
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Assets Static Serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cofeel Coffee server running on port ${PORT}`);
  });
}

startServer();
