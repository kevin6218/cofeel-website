import React, { useState, useEffect } from "react";
import { CoffeeBean, BrewingProfile } from "../types";
import { Thermometer, Eye, RotateCw, Sparkles, Scale, Info, Layers, Compass, Play } from "lucide-react";
import { motion } from "motion/react";

interface BrewCalculatorProps {
  selectedBean: CoffeeBean | null;
  onClearSelectedBean: () => void;
  onSendPresetPromptToAI: (prompt: string) => void;
}

export const BrewCalculator: React.FC<BrewCalculatorProps> = ({
  selectedBean,
  onClearSelectedBean,
  onSendPresetPromptToAI,
}) => {
  // Config state
  const [beanWeight, setBeanWeight] = useState<number>(15);
  const [ratio, setRatio] = useState<number>(15); // 1:15 is standard
  const [grindSize, setGrindSize] = useState<BrewingProfile["grindSize"]>("中細");
  const [roastType, setRoastType] = useState<BrewingProfile["roastType"]>("中淺 / 中");

  // Synchronize when selected bean changes
  useEffect(() => {
    if (selectedBean) {
      if (selectedBean.roastLevel === "淺焙" || selectedBean.roastLevel === "中淺焙") {
        setRoastType("極淺 / 淺");
        setGrindSize("中細");
      } else if (selectedBean.roastLevel === "中焙") {
        setRoastType("中淺 / 中");
        setGrindSize("中");
      } else {
        setRoastType("中深 / 深");
        setGrindSize("中粗");
      }
    }
  }, [selectedBean]);

  // Calculations
  const totalWater = Math.round(beanWeight * ratio);
  
  // Calculate recommended temperature
  let recommendedTemp = 90;
  if (roastType === "極淺 / 淺") {
    recommendedTemp = 92;
  } else if (roastType === "中淺 / 中") {
    recommendedTemp = 90;
  } else if (roastType === "中深 / 深") {
    recommendedTemp = 87;
  }

  // Multi-pour stages calculations
  const bloomWater = Math.round(beanWeight * 2.5); // e.g., 15g * 2.5 = 37.5ml -> 38ml
  const remainingWater = totalWater - bloomWater;
  const secondPour = Math.round(bloomWater + remainingWater * 0.55); // First main pour up to 60% total content
  const thirdPour = totalWater; // final pour

  // Dynamic advice description
  const getRoastAdvice = () => {
    if (roastType === "極淺 / 淺") {
      return "淺焙豆硬度高、高酸質。推薦使用較高水溫（91~93°C）來提高萃取效率，激發檸檬野花與酸甜香氣。如果太酸，可稍微磨細或拉長沖煮時間。";
    } else if (roastType === "中淺 / 中") {
      return "中焙豆酸甜均衡、著重核果與巧克力甜感。90°C 是它的黃金沖煮水溫。研磨細度可控制在砂糖顆粒般，適中的流速能帶出最佳焦糖甜香。";
    } else {
      return "中深至深焙豆質地鬆散、容易過度萃取。特別推薦降低水溫至（85~88°C），避免焦苦味被沖煮出來，將可可草本香氣展現得十分溫厚。";
    }
  };

  const handleAskAICustomization = () => {
    const beanNameStr = selectedBean ? selectedBean.name : "經典莊園級";
    const prompt = `我想使用【Cofeel 凱飛咖啡】的「${beanNameStr}」進行專業手沖。我的沖煮配置為：
- 咖啡粉量：${beanWeight} 克
- 手沖粉水比： 1 : ${ratio} (總注水量約 ${totalWater} ml)
- 烘焙度：${selectedBean ? selectedBean.roastLevel : roastType}
- 研磨度：${grindSize}
- 推薦熱水溫度：${recommendedTemp}°C

請充當凱飛咖啡的冠軍咖啡師，為我這套參數客製化詳細的「三段式手沖攻略腳本」！請包含：
1. 悶蒸水量與秒數（如何在沖煮前喚醒新鮮烘烤的二氧化碳氣泡）。
2. 第一注水與第二注水的注水技巧、繞圈手法與流速。
3. 風味上的預期（例如前段、中段、後段餘韻）。`;
    
    onSendPresetPromptToAI(prompt);
  };

  return (
    <div id="brew-calculator" className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-50 pb-3">
        <h3 className="font-serif text-lg font-bold text-amber-950 flex items-center gap-2">
          <Scale className="h-5 w-5 text-amber-800 animate-pulse" />
          職人手沖黃金比例計算機
        </h3>
        {selectedBean && (
          <button
            onClick={onClearSelectedBean}
            className="text-[11px] text-amber-800 hover:text-amber-950 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 hover:border-amber-300 transition-all active:scale-95 flex items-center gap-1"
          >
            <RotateCw className="h-3 w-3" />
            重設
          </button>
        )}
      </div>

      {/* Synchronized status banner */}
      {selectedBean ? (
        <div id="sync-active-banner" className="bg-amber-800/10 border border-amber-800/20 px-3 py-2.5 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-ping"></span>
            <div className="text-[11px] text-amber-950">
              已連動精品豆：<span className="font-bold">{selectedBean.name}</span>
            </div>
          </div>
          <span className="text-[10px] bg-amber-800 text-amber-100 px-2 py-0.5 rounded font-mono font-bold font-semibold">
            {selectedBean.roastLevel}
          </span>
        </div>
      ) : (
        <div className="bg-neutral-50 border border-neutral-200/60 p-3 rounded-lg text-[11px] text-neutral-600 flex items-start gap-1.5 leading-relaxed">
          <Info className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
          歡迎直接在左側經典豆單點擊【帶入水溫計算機】，本計算機將自動代入精品豆最佳的研磨度及烘焙參數。
        </div>
      )}

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left column inputs */}
        <div className="space-y-4">
          {/* Slider 1: Weight */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-amber-950 font-semibold">
              <span className="flex items-center gap-1">咖啡粉重量</span>
              <span className="font-mono text-sm text-amber-800">{beanWeight} g</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="1"
              value={beanWeight}
              onChange={(e) => setBeanWeight(Number(e.target.value))}
              className="w-full h-1.5 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-800"
            />
            <div className="flex justify-between text-[10px] text-amber-800/60 font-mono">
              <span>10g (單人)</span>
              <span>15g (黃金單杯)</span>
              <span>25g (雙人)</span>
              <span>40g (多人)</span>
            </div>
          </div>

          {/* Slider 2: Ratio */}
          <div className="space-y-1 pt-2">
            <div className="flex items-center justify-between text-xs text-amber-950 font-semibold">
              <span className="flex items-center gap-1">
                粉水比 (Golden Ratio)
              </span>
              <span className="font-mono text-sm text-amber-800">1 : {ratio}</span>
            </div>
            <input
              type="range"
              min="12"
              max="18"
              step="1"
              value={ratio}
              onChange={(e) => setRatio(Number(e.target.value))}
              className="w-full h-1.5 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-800"
            />
            <div className="flex justify-between text-[10px] text-amber-800/60 font-mono">
              <span>1:12 (極濃厚)</span>
              <span className="text-amber-900 font-bold">1:15 (經典聖調)</span>
              <span>1:18 (輕亮乾淨)</span>
            </div>
          </div>

          {/* Roast Selector (Disabled if bean is selected) */}
          <div className="space-y-1 pt-1">
            <label className="block text-xs font-semibold text-amber-950 mb-1">
              咖啡豆烘焙程度
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["極淺 / 淺", "中淺 / 中", "中深 / 深"] as const).map((type) => {
                const isActive = roastType === type;
                return (
                  <button
                    key={type}
                    disabled={!!selectedBean}
                    onClick={() => setRoastType(type)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold tracking-wide border transition-all ${
                      isActive
                        ? "bg-amber-800 border-amber-900 text-white shadow-sm"
                        : "bg-neutral-50/50 hover:bg-neutral-100 border-neutral-200 text-neutral-800 disabled:opacity-55 disabled:hover:bg-neutral-50/50"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grind Selector */}
          <div className="space-y-1 pt-1">
            <label className="block text-xs font-semibold text-amber-950 mb-1">
              建議研磨細度
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(["細", "中細", "中", "中粗", "粗"] as const).map((size) => {
                const isActive = grindSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setGrindSize(size)}
                    className={`py-1 rounded text-[10px] font-semibold border transition-all ${
                      isActive
                        ? "bg-amber-900 border-amber-950 text-white shadow-sm"
                        : "bg-neutral-50/50 hover:bg-neutral-100 border-neutral-200 text-neutral-800"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column Dashboard output */}
        <div className="bg-amber-50/30 rounded-xl p-4 border border-amber-100/50 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-amber-900 font-bold border-b border-amber-100/60 pb-1 flex items-center justify-between">
              <span>手沖參數面板</span>
              <span className="text-[9px] text-amber-800/80 font-mono">Barista Specs</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-white p-2.5 rounded-lg border border-amber-100 flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-800 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[9px] text-amber-700/80 font-medium">總注水量</div>
                  <div className="text-sm font-bold font-mono text-amber-950 truncate">
                    {totalWater} <span className="text-[10px] font-normal">ml / c.c.</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-amber-100 flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[9px] text-amber-700/80 font-medium">建議水溫</div>
                  <div className="text-sm font-bold font-mono text-amber-950 truncate">
                    {recommendedTemp}°C
                  </div>
                </div>
              </div>
            </div>

            {/* Stage Hydration Timeline */}
            <div className="space-y-2 pt-1 bg-white p-2.5 rounded-lg border border-amber-100">
              <div className="text-[10px] text-amber-900 font-bold flex justify-between">
                <span>三段式注水時段 (ml)</span>
                <span className="text-[9px] text-amber-700/80">建議沖煮時程: ~2.5 分鐘</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-neutral-500">1. 悶蒸階段 (35-40s)</span>
                  <span className="font-mono font-bold text-amber-900">{bloomWater} ml</span>
                </div>
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden flex">
                  <div className="bg-amber-500 h-full" style={{ width: `${(bloomWater / totalWater) * 100}%` }}></div>
                  <div className="bg-amber-700 h-full border-l border-white" style={{ width: `${((secondPour - bloomWater) / totalWater) * 100}%` }}></div>
                  <div className="bg-amber-900 h-full border-l border-white" style={{ width: `${((totalWater - secondPour) / totalWater) * 100}%` }}></div>
                </div>
                <div className="flex justify-between text-[9px] text-neutral-600 font-mono">
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>悶蒸: {bloomWater}ml</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-700"></span>
                    <span>首注: {secondPour}ml</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-900"></span>
                    <span>尾注: {totalWater}ml</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advice paragraph */}
            <p className="text-[10px] text-amber-900/90 leading-relaxed bg-amber-50/50 p-2 rounded border border-amber-100/30">
              <span className="font-bold block mb-0.5">💡 大師萃取心法：</span>
              {getRoastAdvice()}
            </p>
          </div>

          {/* Floating AI customize Button */}
          <button
            id="customize-brew-btn"
            onClick={handleAskAICustomization}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-800 to-amber-950 hover:from-amber-900 hover:to-stone-900 text-white text-[11px] font-bold shadow-md transition-all active:scale-98 group cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            交由 AI 客製本套手沖大師劇本
          </button>
        </div>
      </div>
    </div>
  );
};
