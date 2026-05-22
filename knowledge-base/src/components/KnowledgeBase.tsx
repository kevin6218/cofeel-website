import React, { useState } from "react";
import { BookOpen, HelpCircle, Thermometer, Flame, Star, Award, Compass, ArrowRight, CornerDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface KnowledgeBaseProps {
  onAskAIQuestion: (question: string) => void;
}

interface TopicCard {
  id: string;
  category: "beans" | "temperature" | "equipment";
  title: string;
  shortDesc: string;
  longDesc: string;
  suggestedQuestion: string;
  badge: string;
  icon: React.ReactNode;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onAskAIQuestion }) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "beans" | "temperature" | "equipment">("all");

  const topics: TopicCard[] = [
    {
      id: "processing-impact",
      category: "beans",
      title: "日曬、水洗與蜜處理的風味密碼",
      shortDesc: "同樣產區的豆子，處理法不同會帶來天差地別的風味表現...",
      longDesc: "【水洗法】會除去所有果肉與果膠層，口感最為乾淨澈底、花香明顯、擁有明亮高雅的檸檬或核果酸質；【日曬法】則是連皮帶肉曝曬，使果實甜感與發酵風味滲入豆芯，厚實肉感、醇厚度強（Body），帶有飽滿的乾果與酒釀甜香；【蜜處理】保留部分粘稠果膠进行發酵，保留了水洗乾淨的酸度之餘，也增添了日曬般的甜感與滑順度，其風味溫和，蜜香和堅果感突出。",
      suggestedQuestion: "我想了解日曬、水洗跟蜜處理對咖啡酸度、醇厚度跟甜感的具體影響是什麼？凱飛有推薦哪款處理法嗎？",
      badge: "處理法解析",
      icon: <Star className="h-4 w-4 text-amber-700" />,
    },
    {
      id: "temperature-math",
      category: "temperature",
      title: "溫度對咖啡酸、苦、甜萃取率的控制",
      shortDesc: "熱水是萃取咖啡的最重要溶劑。溫度高一降一度，其實在悄悄控制著風味物...",
      longDesc: "熱水水溫高（90~93°C）會加速溶解咖啡豆中的可溶物，能快速逼出「淺焙豆」內分子大、難溶解的花果優雅果酸與芳香，然而若用在「深焙豆」則會過度溶解木質素而帶來燒焦、煙燻焦苦味。相反，水溫低（85~88°C）萃取率較慢，正能封鎖深焙豆的苦澀、完美導引出中深焙特有的黑巧克力甘甜、奶油厚實風味與流暢焦糖甜感。",
      suggestedQuestion: "請問手沖咖啡的水溫要怎麼精準控制？淺焙豆可以用 85 度的水沖煮嗎？會不會萃取不足？",
      badge: "水溫萃取法",
      icon: <Thermometer className="h-4 w-4 text-emerald-700" />,
    },
    {
      id: "dripper-comparison",
      category: "equipment",
      title: "Hario V60 螺旋大孔 vs Kalita Wave 蛋糕濾杯",
      shortDesc: "兩款經典濾杯在肋骨、排水孔及流速上，將塑造截然不同的咖啡性格...",
      longDesc: "【Hario V60 濾杯】為 60 度錐形、螺旋狀高肋骨設計，配有底部單一大孔。這讓水流速度完全取決於你的注水流速，空氣排出順暢、水停留時間短。它能完全突顯明亮花果香與澄澈酸質。 \n\n【Kalita Wave 蛋糕濾杯】為平置底部、備有三個細孔，蛋糕濾紙與杯壁折頁阻隔。它具有極佳的容錯率與保溫效果，排水流速平穩安靜。熱水浸潤均勻，最適合突顯飽滿的甜感、均勻的萃取度以及滑順的厚實感。",
      suggestedQuestion: "Hario V60 與 Kalita Wave 濾杯沖煮出來的口感跟風味具體差別在哪？我想要好甜感跟容錯率高應該選哪一個？",
      badge: "濾杯大對決",
      icon: <Compass className="h-4 w-4 text-amber-800" />,
    },
    {
      id: "freshness-bloom",
      category: "beans",
      title: "悶蒸（Bloom）對新鮮咖啡的呼吸意義",
      shortDesc: "為什麼在手沖注水一開始，需要先等待 30 秒？這其實是咖啡豆在呼吸...",
      longDesc: "剛烘焙好不久的新鮮精品咖啡豆（例如凱飛新鮮咖啡豆）內部飽含二氧化碳氣体。如果不先用熱水將二氧化碳排擠出來，氣體會阻礙熱水與咖啡粉的分子接觸，導致咖啡粉各處浸潤不均，產生嚴重的萃取通道效益與稀薄偏酸的萃取不足口感。悶蒸的 2.5 倍粉重注水與 30~40 秒靜待，不僅排出廢氣，還能使咖啡粉床充分膨起排氣（宛如精緻土丘），讓正式注水能發揮更為均勻、香氣逼人的萃取平衡。",
      suggestedQuestion: "為什麼手沖咖啡需要悶蒸？悶蒸時咖啡粉沒有膨起代表什麼？要如何控制悶蒸的水量與水路？",
      badge: "悶蒸與排氣",
      icon: <Award className="h-4 w-4 text-yellow-700" />,
    },
    {
      id: "grind-channels",
      category: "equipment",
      title: "研磨度與萃取通道：避免沖出苦澀味",
      shortDesc: "磨豆機的研磨精度，是掌握好咖啡靈魂的鑰匙。細粉過多或研磨不均...",
      longDesc: "手沖最適研磨細度為「中等研磨（如二砂糖顆粒）」。若磨得過細，水流受阻在濾杯中積水，熱水與細粉接觸過久會溶解出咖啡後段中大分子的焦苦味與澀感（過度萃取）；若磨得太粗，水流直接穿過且沖刷不夠，便無法溶解風味物質，咖啡寡淡、高酸、且流於稀薄（萃取不足）。因此選用均勻度高的磨豆機與避開過細研磨，是沖煮出完美口感的關鍵。",
      suggestedQuestion: "怎麼判斷咖啡是萃取不足還是過度萃取？手沖有苦澀味或味道太淡，在磨豆與注水上要如何微調？",
      badge: "研磨度指南",
      icon: <HelpCircle className="h-4 w-4 text-stone-700" />,
    }
  ];

  const filteredTopics = activeTab === "all" ? topics : topics.filter(t => t.category === activeTab);

  return (
    <div id="knowledge-base" className="space-y-4">
      {/* Search/Tabs section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-100 pb-3 gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-amber-950 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-800" />
            咖啡大師知識探索庫
          </h2>
          <p className="text-xs text-amber-800/70">
            精選核心手沖教學主題，點選展開後可一鍵提問 AI 開啟對話
          </p>
        </div>

        {/* Tab filters */}
        <div className="flex flex-wrap gap-1">
          {([
            { id: "all", label: "全部" },
            { id: "beans", label: "咖啡豆/處理" },
            { id: "temperature", label: "黃金溫度" },
            { id: "equipment", label: "大師器具" }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-amber-800 text-white"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid showing topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredTopics.map((topic) => {
          const isExpanded = selectedTopicId === topic.id;
          return (
            <div
              id={`topic-item-${topic.id}`}
              key={topic.id}
              className={`rounded-xl border transition-all ${
                isExpanded
                  ? "border-amber-800 bg-amber-50/20 col-span-1 md:col-span-2 shadow-sm"
                  : "border-amber-100 bg-white hover:border-amber-300 hover:bg-amber-50/10 cursor-pointer"
              }`}
              onClick={() => {
                if (!isExpanded) {
                  setSelectedTopicId(topic.id);
                }
              }}
            >
              <div className="p-4 flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-semibold flex items-center gap-1">
                      {topic.icon}
                      {topic.badge}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTopicId(isExpanded ? null : topic.id);
                      }}
                      className="text-[10px] text-amber-800 font-bold hover:underline"
                    >
                      {isExpanded ? "收合" : "閱讀詳情"}
                    </button>
                  </div>

                  <h3 className="font-serif text-sm font-semibold text-amber-950">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-amber-900/80 leading-relaxed">
                    {isExpanded ? topic.longDesc : topic.shortDesc}
                  </p>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 pt-3 border-t border-amber-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/50 -mx-4 -mb-4 p-4 rounded-b-xl"
                  >
                    <div className="flex items-start gap-1.5 min-w-0">
                      <CornerDownLeft className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-amber-900">推薦給 AI 顧問的快捷提問：</div>
                        <div className="text-[10px] text-amber-800/80 truncate">
                          {topic.suggestedQuestion}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAIQuestion(topic.suggestedQuestion);
                      }}
                      className="shrink-0 inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-[10px] font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                      提問 AI 智慧解析
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
