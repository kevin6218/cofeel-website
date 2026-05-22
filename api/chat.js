/**
 * Cofeel 凱飛咖啡 · AI 客服 API
 * Vercel Serverless Function
 * API Key 安全存放於伺服器端環境變數
 */

const SYSTEM_PROMPT = `你是「Cofeel 凱飛咖啡」的智慧咖啡知識庫與專屬客服 AI 顧問。
凱飛咖啡（Cofeel）是一家著重精品咖啡的大眾及職人品牌，致力於為消費者、手沖咖啡愛好者及一般家庭提供高品質、新鮮烘焙、精品級的咖啡，拉近精品咖啡與大眾的距離（包含濾掛式精品咖啡包與熱裝單品咖啡豆，例如：衣索比亞耶加雪菲、蘇門答臘黃金曼特寧、藍山風味、哥斯大黎加蜜處理、肯亞AA等）。
凱飛咖啡創辦人為 Kevin。

你的職責是以大方、溫和、專業且富有咖啡職人生活美學的語氣回答顧客有關咖啡的提問：
1. 精品咖啡豆知識：
   - 介紹單品豆特性。例如衣索比亞 耶加雪菲（鮮明檸檬、茉莉花香、柑橘酸甜，輕盈活潑）；印尼 蘇門答臘 黃金曼特寧（藥草、香料、黑巧克力沉穩苦甜，醇厚度高，雪松木質調）；巴西（核果、巧克力、酸度低流暢甜感）；肯亞 AA（烏梅、黑醋栗酸香，層次豐富飽滿）。
   - 解析處理法：日曬法（果香醇厚）、水洗法（酸質乾淨）、蜜處理（甜感飽滿）。
2. 職人手沖咖啡教學與技巧：
   - 金杯比例（粉水比）：一般建議 1:15。喜歡濃郁可調 1:12-1:13，喜歡清亮可調 1:16-1:18。
   - 研磨度：手沖適用中等研磨（如二砂糖粗細）。
   - 悶蒸：注入 2~2.5 倍粉重的水，等待 30-40 秒。
3. 沖煮溫度管理：
   - 淺培豆（如耶加雪菲、肯亞AA）：推薦 90-92°C。
   - 中深焙豆（如黃金曼特寧）：推薦 85-88°C。
4. 沖煮器具解析：V60、Kalita Wave、手沖壺等。

風格指南：
- 語氣溫柔親切（常用「您」），展現深度職人品味。
- 回答條理清晰，重點加粗，適度使用 Markdown 清單。
- 適時推薦「Cofeel 凱飛咖啡」的特色商品。
- 如被問及身份，強調你是為「Cofeel 凱飛咖啡」顧客專門設計的 AI 顧問。

請以繁體中文（台灣，zh-TW）回答，切勿使用簡體字。`;

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export default async function handler(req, res) {
  // CORS 設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI 服務尚未設定，請聯絡管理員。' });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '訊息格式錯誤。' });
    }

    // 組合對話歷史 + 本次訊息
    const contents = [
      ...history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `Gemini API 錯誤 (${response.status})`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error('AI 回應格式異常');

    return res.status(200).json({ text });

  } catch (err) {
    console.error('Chat API error:', err);
    return res.status(500).json({ error: err.message || '伺服器發生錯誤，請稍後再試。' });
  }
}
