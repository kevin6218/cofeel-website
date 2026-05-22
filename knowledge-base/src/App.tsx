import { useState } from "react";
import { BeverageCatalog, COFFEE_BEANS } from "./components/BeverageCatalog";
import { BrewCalculator } from "./components/BrewCalculator";
import { KnowledgeBase } from "./components/KnowledgeBase";
import { ChatWindow } from "./components/ChatWindow";
import { CofeelLogo } from "./components/CofeelLogo";
import { CoffeeBean, ChatMessage } from "./types";
import { Coffee, ShieldAlert, Heart, Compass, Flame, Leaf, HelpCircle, GraduationCap } from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  const [selectedBean, setSelectedBean] = useState<CoffeeBean | null>(null);
  
  // Initialize chat history with an elegant master welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-welcome",
      role: "model",
      text: `### ☕ 歡迎來到 Cofeel 凱飛咖啡智慧知識庫！
您好！我是您的專屬「**Cofeel 凱飛精品咖啡 AI 智慧顧問**」。

凱飛咖啡品牌致力於將精工細作的精品咖啡美學融入您的日常。無論您是新手入門，亦或是追求極致萃取的咖啡職人，我都隨時準備為您解答一切咖啡奧秘：

💡 **這裡您可以與我探索：**
1. **風味豆理**（日曬水洗、高海拔蜜處理的風味轉移）
2. **手沖幾何**（粉水比、研磨度、過度與不足萃取的救治）
3. **金杯水溫**（淺焙高溫、深焙低溫的萃取物理特性）
4. **精準器具**（V60 與蛋糕濾杯的繞圈流動引力）

歡迎您在左側目錄挑選經典的 **Cofeel 精品咖啡豆**，或是在下方使用**互動式手沖水溫計算機**生成參數，亦可隨時點按知識專欄直接向我發起客製提問！`,
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Suggested starter prompts
  const suggestedPrompts = [
    "新手在家第一次做手沖，需要準備哪些基礎器具？",
    "如何避免手沖咖啡喝起來有雜味、而且特別酸的味道？",
    "耶加雪菲日曬豆與水洗豆在手沖風味跟香氣上有何差別？",
    "水溫高與水溫低，分別會溶解出咖啡豆裡的哪些風味物質？",
    "冰手沖咖啡（急冷式）的粉水比與冰塊量應該如何精確分配？"
  ];

  // Handler: set active bean to calc and sync input configs
  const handleSelectBeanForCalc = (bean: CoffeeBean) => {
    setSelectedBean(bean);
    // Smooth scroll to the calculator element for better UX
    const calcEl = document.getElementById("brew-calculator");
    if (calcEl) {
      calcEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Handler: Clear bean binding in calculator
  const handleClearSelectedBean = () => {
    setSelectedBean(null);
  };

  // Reset conversation to initial text
  const handleClearHistory = () => {
    setMessages([
      {
        id: `init-reset-${Date.now()}`,
        role: "model",
        text: `### ☕ 歡迎回到 Cofeel 凱飛咖啡智慧知識庫！
對話紀錄已清除。我是您的凱飛咖啡顧問，隨時準備解答您對於手沖水溫、器具配平與風味細節的疑惑！請隨時點按下方卡片提問，或直接輸入您的疑問。`,
        timestamp: new Date()
      }
    ]);
    setErrorNotice(null);
  };

  // Handler: core send message logic to call local node Express endpoint
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setErrorNotice(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Scroll chat immediately to bottom
    setTimeout(() => {
      const chatWindow = document.getElementById("ai-chat-window");
      if (chatWindow) {
        chatWindow.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);

    try {
      // Build simple serialized history to prevent passing massive props to server
      const chatHistory = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatHistory,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "提問時連線伺服器失敗，請檢查設定。");
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        text: data.text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorNotice(err.message || "發生連線錯誤，請稍後重試。");
      
      // Auto-inject safety error response in chat history
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "model",
          text: `⚠️ **系統通知**：沖煮伺服器在讀取知識時受到阻礙。
          
原因可能為：尚未設定 AI Studio Secrets 面板中的 **GEMINI_API_KEY** 精密鑰匙。
請在右上角 Settings > Secrets 面板，新增變數名稱為 \`GEMINI_API_KEY\` 並儲存後再次嘗試發問。`,
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto trigger message generation upon pre-suggested links
  const handleSendPresetPromptToAI = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Brand Elegant Top bar banner */}
      <header className="bg-stone-950 text-amber-50 py-7 border-b border-amber-900/40 relative shadow-md">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2">
              <CofeelLogo variant="dark" className="h-14 sm:h-18 w-auto filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]" />
              <div className="ml-1 hidden xs:block">
                <span className="text-[10px] bg-amber-800/80 text-amber-100 px-2.5 py-0.5 rounded-full border border-amber-700/40 tracking-wider font-semibold block w-fit">
                  智慧豆理與手沖知識庫
                </span>
                <p className="text-[10px] text-amber-200/50 font-medium mt-1">
                  SCA 認證智能精工鮮烘 · 金杯萃取美學
                </p>
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-center sm:items-end gap-1">
            <div className="text-[10px] text-amber-200/50 uppercase tracking-widest font-mono">
              Founder Profile
            </div>
            <div className="text-xs font-semibold text-amber-100/90 bg-amber-800/25 px-3 py-1 rounded-full border border-amber-800/35">
              歡迎您，凱飛創辦人 <span className="text-amber-300 font-bold">Kevin</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace Container layout */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Error notification Notice banner if key is not declared */}
        {errorNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3 shadow-sm"
          >
            <ShieldAlert className="h-5 w-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block mb-0.5">系統核心錯誤說明</span>
              由於您在當前開發環境尚未注入您的 <span className="font-semibold underline">GEMINI_API_KEY</span>，AI 精密解答流程受到了暫停。
              煩請按右上角 **Settings &gt; Secrets** 將值補足後即時暢通。
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Coffee Bean database (visual charts) and Curated Knowledge themes in stacked grid */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Visual Intro Cards explaining high extraction metrics */}
            <section className="bg-gradient-to-br from-amber-900 to-stone-900 text-amber-50 rounded-2xl p-6 shadow border border-amber-80 * relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 font-serif text-9xl font-extrabold select-none pointer-events-none transform translate-x-4 translate-y-8">
                C
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Barista Method
                  </span>
                  <h2 className="font-serif text-lg font-bold">手沖黃金萃取・三大決定因子</h2>
                  <p className="text-xs text-amber-100/75 leading-relaxed">
                    在精品咖啡的領域中，「耶加雪菲的花果香」與「曼特寧的雪松黑巧」能否極致展現，不單只靠咖啡豆本身，
                    更是取決於您手沖時的 **黃金水溫**、**研磨度粗細** 與 **注水悶蒸比例** 的交互幾何平衡。
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                    <span className="text-xs font-bold text-amber-300 block mb-1">1. 水溫管理</span>
                    <p className="text-[10px] text-amber-100/70 leading-relaxed">
                      【淺焙豆】極需高溫（91~93°C）激發上揚花香與乾質水果酸度；【深焙豆】應用低溫（86~88°C）撫平苦澀焦煙。
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                    <span className="text-xs font-bold text-amber-300 block mb-1">2. 粉水比例</span>
                    <p className="text-[10px] text-amber-100/70 leading-relaxed">
                      金杯黃金基準為 **1:15**。過少水量（1:12）流於高酸粗獷感，過多水路（1:18）易導致水感及中後段木質澀感。
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                    <span className="text-xs font-bold text-amber-300 block mb-1">3. 磨度悶蒸</span>
                    <p className="text-[10px] text-amber-100/70 leading-relaxed">
                      中等粗細（二砂糖狀）是經典。沖泡前以 2~2.5 倍水做 **閃爍悶蒸** 釋放二氧化碳，是形成平衡甜感的靈魂。
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Coffee beans Visual Catalog */}
            <section>
              <BeverageCatalog
                selectedBeanId={selectedBean ? selectedBean.id : null}
                onSelectBeanForCalc={handleSelectBeanForCalc}
                onAskAIAboutBean={handleSendMessage}
              />
            </section>

            {/* Expert Handcraft FAQ cards */}
            <section>
              <KnowledgeBase onAskAIQuestion={handleSendMessage} />
            </section>

          </div>

          {/* Right Side: AI Chat window and Brewing slider calculator */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Interactive Chat window Container */}
            <section className="sticky top-6 space-y-8">
              
              {/* AI Assistant Chat view */}
              <ChatWindow
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onClearHistory={handleClearHistory}
                suggestedPrompts={suggestedPrompts}
              />

              {/* Hand-Drip slider calculator workstation */}
              <BrewCalculator
                selectedBean={selectedBean}
                onClearSelectedBean={handleClearSelectedBean}
                onSendPresetPromptToAI={handleSendPresetPromptToAI}
              />

            </section>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 border-t border-amber-900/30 text-stone-400 py-10 mt-16 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-3.5">
          <div className="flex justify-center gap-1.5 items-center text-amber-100/80 font-serif">
            <Coffee className="h-4 w-4 text-amber-600" />
            <span>Cofeel 凱飛咖啡 • 職人精神</span>
          </div>
          <p className="text-[11px] hover:text-stone-300 transition-colors">
            為一般顧客及手沖發燒友量身定制的手沖計算、知識查用與智慧 AI 完美整合系統。
          </p>
          <p className="text-[10px] text-stone-500 font-mono">
            © 2026 Cofeel Coffee Co. All rights reserved. Developed to maximum beauty.
          </p>
        </div>
      </footer>
    </div>
  );
}
