import React from "react";
import { CoffeeBean } from "../types";
import { Coffee, ShieldCheck, Flame, Award, Heart, RefreshCw, MessageSquare } from "lucide-react";
import { motion } from "motion/react";

interface BeverageCatalogProps {
  onSelectBeanForCalc: (bean: CoffeeBean) => void;
  onAskAIAboutBean: (beanName: string) => void;
  selectedBeanId: string | null;
}

export const COFFEE_BEANS: CoffeeBean[] = [
  {
    id: "yirgacheffe",
    name: "CoFeel 衣索比亞 耶加雪菲 G1",
    englishName: "Ethiopia Yirgacheffe G1 Light Medium Roast",
    roastLevel: "中淺焙",
    process: "水洗",
    origin: "衣索比亞 耶加雪菲 (Yirgacheffe, Ethiopia)",
    altitude: "1,800 - 2,100m",
    flavorNotes: ["白花香氣", "檸檬柑橘", "甜杏橘皮", "清甜綠茶"],
    description: "凱飛經典代表作！採用 SCA 認證智能精工烘焙。一入口展現清新高雅的茉莉與柑橘花香，酸質細緻如檸檬汽水，伴隨著甜美水蜜桃與大吉嶺紅茶的悠長尾韻，口感澄澈明亮。",
    acidity: 4,
    body: 2,
    sweetness: 4,
    imageType: "yirgacheffe",
  },
  {
    id: "guji-narcissus",
    name: "CoFeel 衣索比亞 古吉 G1 水仙（蜜處理）",
    englishName: "Ethiopia Guji G1 Narcissus Honey Roast",
    roastLevel: "中淺焙",
    process: "蜜處理",
    origin: "衣索比亞 古吉 (Guji, Ethiopia)",
    altitude: "1,900 - 2,200m",
    flavorNotes: ["水仙花香", "熱帶熟果", "荔枝甜香", "蜂蜜綠茶"],
    description: "超高人氣品項古吉「水仙」！兼具水洗的優雅花香與日曬的豐富水果甜。荔枝、白桃果香交織出如香水般的層次，中後段呈現蜂蜜糖漿般的豐厚甜感，回甘性極佳。",
    acidity: 4,
    body: 3,
    sweetness: 5,
    imageType: "costarica",
  },
  {
    id: "malawi-geisha",
    name: "CoFeel 馬拉威 厭氧酒香藝妓/瑰夏",
    englishName: "Malawi Anaerobic Winey Geisha",
    roastLevel: "中淺焙",
    process: "日曬",
    origin: "馬拉威 密蘇庫山脈 (Misuku Hills, Malawi)",
    altitude: "1,600 - 2,000m",
    flavorNotes: ["威士忌酒香", "熱帶百香果", "莓果酸甜", "玫瑰花香"],
    description: "頂級奢華藝妓（Geisha）豆款。採用高難度厭氧發酵日曬處理，將成熟果實蜜甜與濃郁發酵感緩緩注入豆芯。入口是令人陶醉的威士忌酒香，百香果、黑葡萄熟果甜感爆表，極富層次。",
    acidity: 3,
    body: 4,
    sweetness: 5,
    imageType: "kenya",
  },
  {
    id: "myanmar-yinon",
    name: "CoFeel 緬甸 依濃巧克力堅果 高山阿拉比卡",
    englishName: "Myanmar Yinon Chocolate Nut Arabica",
    roastLevel: "中深焙",
    process: "半水洗",
    origin: "緬甸 依濃伊濃莊園 (Yinon, Myanmar)",
    altitude: "1,200 - 1,450m",
    flavorNotes: ["烤榛果", "黑巧克力", "奶油焦糖", "煙燻烤杏仁"],
    description: "烘焙職人精工打造。具有緬甸高原特有的乾淨度與豐厚感。濃郁的巧克力與烘烤榛果香氣鋪底，口感極其滑順，伴隨著焦糖奶油的流暢甜感。幾乎無酸，甜感極高。",
    acidity: 1,
    body: 5,
    sweetness: 4,
    imageType: "mandheling",
  },
  {
    id: "honduras-esperanza",
    name: "CoFeel 宏都拉斯 希望曙光",
    englishName: "Honduras Esperanza Medium Dark Roast",
    roastLevel: "中深焙",
    process: "水洗",
    origin: "宏都拉斯 馬爾卡拉 (Marcala, Honduras)",
    altitude: "1,400 - 1,700m",
    flavorNotes: ["紅糖甜香", "烤麵包", "黑可可", "溫潤奶油"],
    description: "溫暖、平衡、包容力強的一款精緻深焙。經典的紅糖伴隨烤堅果香氣。奶油般的厚實口感（Body）非常飽滿。苦甜均衡良好，不酸，尾韻帶有濃郁的香草巧克力餘韻。",
    acidity: 1,
    body: 4,
    sweetness: 4,
    imageType: "bluemountain",
  },
  {
    id: "baby-geisha",
    name: "CoFeel 衣索比亞 BABY GEISHA 藝伎",
    englishName: "Ethiopia Baby Geisha Light Medium Roast",
    roastLevel: "中淺焙",
    process: "水洗",
    origin: "衣索比亞 (Ethiopia)",
    altitude: "1,800 - 2,000m",
    flavorNotes: ["柑橘花香", "檸檬草", "新鮮蜂蜜", "白葡萄"],
    description: "輕盈的藝伎（Geisha）風骨。小巧玲瓏的Baby Geisha具有純淨活潑的水蜜桃、柑橘與檸檬草氣息。口感細緻，酸香流暢，猶如品嚐一杯頂級的水果花茶，餘韻甘甜純潔。",
    acidity: 4,
    body: 3,
    sweetness: 4,
    imageType: "yirgacheffe",
  }
];

export const BeverageCatalog: React.FC<BeverageCatalogProps> = ({
  onSelectBeanForCalc,
  onAskAIAboutBean,
  selectedBeanId,
}) => {
  return (
    <div id="beverage-catalog" className="space-y-6">
      <div className="flex items-center justify-between border-b border-amber-100 pb-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-amber-900 flex items-center gap-2">
            <Coffee className="h-5 w-5 text-amber-700" />
            Cofeel 凱飛經典精品豆單
          </h2>
          <p className="text-xs text-amber-800/70 mt-1">
            點選咖啡豆查看風味圖表，可直接一鍵帶入「極致水溫計算機」或提問 AI
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
          <Award className="h-3 w-3 text-amber-600" />
          職人新鮮烘焙
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {COFFEE_BEANS.map((bean) => {
          const isSelected = selectedBeanId === bean.id;
          return (
            <motion.div
              id={`bean-card-${bean.id}`}
              key={bean.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? "border-amber-700 bg-amber-50/70 shadow-md ring-1 ring-amber-700/30"
                  : "border-amber-100 bg-amber-50/20 hover:border-amber-300 hover:bg-amber-50/40"
              }`}
            >
              {isSelected && (
                <div id={`selected-badge-${bean.id}`} className="absolute top-0 right-0 bg-amber-800 text-amber-50 text-[10px] uppercase font-bold tracking-widest py-1 px-3.5 rounded-bl-xl shadow-sm flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  已選定沖煮
                </div>
              )}

              <div className="space-y-3">
                {/* Header */}
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-800 text-amber-50 shadow-sm">
                      {bean.roastLevel}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-200/60 text-amber-900 border border-amber-300">
                      {bean.process}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
                      海拔 {bean.altitude}
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-amber-950 mt-1.5 flex items-center gap-1.5">
                    {bean.name}
                  </h3>
                  <div className="text-[11px] font-mono text-amber-800/80 tracking-wide mt-0.5">
                    {bean.englishName}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-amber-900/80 leading-relaxed bg-white/40 p-2.5 rounded-lg border border-amber-100/30">
                  {bean.description}
                </p>

                {/* Flavor tags */}
                <div className="flex flex-wrap gap-1.5">
                  {bean.flavorNotes.map((note, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100/60 text-amber-900 border border-amber-200"
                    >
                      ✦ {note}
                    </span>
                  ))}
                </div>

                {/* Flavor Graphs */}
                <div className="pt-2 border-t border-amber-100/50 space-y-1.5">
                  <div className="flex items-center text-[10px] text-amber-900 font-medium">
                    <span className="w-12 text-amber-800">
                      精緻酸質:
                    </span>
                    <div className="flex-1 bg-amber-100 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-amber-600 h-full rounded-full"
                        style={{ width: `${(bean.acidity / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="w-6 text-right text-amber-800">{bean.acidity}</span>
                  </div>
                  
                  <div className="flex items-center text-[10px] text-amber-900 font-medium">
                    <span className="w-12 text-amber-800">
                      醇厚質地:
                    </span>
                    <div className="flex-1 bg-amber-100 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-amber-800 h-full rounded-full"
                        style={{ width: `${(bean.body / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="w-6 text-right text-amber-800">{bean.body}</span>
                  </div>

                  <div className="flex items-center text-[10px] text-amber-900 font-medium">
                    <span className="w-12 text-amber-800">
                      焦糖甜感:
                    </span>
                    <div className="flex-1 bg-amber-100 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-amber-700 h-full rounded-full"
                        style={{ width: `${(bean.sweetness / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="w-6 text-right text-amber-800">{bean.sweetness}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-amber-100">
                <button
                  id={`calc-btn-${bean.id}`}
                  onClick={() => onSelectBeanForCalc(bean)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-[11px] font-semibold transition-all shadow-sm active:scale-95"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  帶入水溫計算機
                </button>
                <button
                  id={`ask-ai-btn-${bean.id}`}
                  onClick={() => onAskAIAboutBean(`我想詢問 Cofeel 凱飛咖啡的「${bean.name}」這款單品咖啡豆，應該手沖才能展現它的最佳風味？有哪些細節需要特別注意？`)}
                  className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-amber-800 text-[11px] font-semibold transition-all active:scale-95"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  問 AI 攻略
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
