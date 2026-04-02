/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  MapPin, 
  Users, 
  Flame, 
  Clock, 
  Hash, 
  ChevronRight,
  Info,
  User,
  Activity,
  Layers,
  BookOpen,
  Sparkles,
  Eye,
  History,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- 绵羊图腾 (去掉了红点，更精致的黑白对比，增加神秘感) ---
const SheepLogo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="sheepGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stopColor="rgba(217, 70, 90, 0.4)" />
        <stop offset="100%" stopColor="rgba(217, 70, 90, 0)" />
      </radialGradient>
      <filter id="inkBlur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
      </filter>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#sheepGlow)" className="animate-pulse" />
    
    {/* 外轮廓: 墨色质感 */}
    <path 
      d="M50 15C40 15 32 18 28 24C22 22 15 25 12 32C8 38 10 45 15 50C10 55 8 62 12 68C15 75 22 78 28 76C32 82 40 85 50 85C60 85 68 82 72 76C78 78 85 75 88 68C92 62 90 55 85 50C90 45 92 38 88 32C85 25 78 22 72 24C68 18 60 15 50 15Z" 
      fill="#050505" 
      stroke="rgba(217, 70, 90, 0.3)"
      strokeWidth="1"
      filter="url(#inkBlur)"
    />
    
    {/* 面部: 苍白纸感 */}
    <path 
      d="M50 32C42 32 35 38 35 48C35 58 42 64 50 64C58 64 65 58 65 48C65 38 58 32 50 32Z" 
      fill="#f5f5f5" 
    />
    
    {/* 眼睛: 深邃而诡异 */}
    <circle cx="44" cy="48" r="2.5" fill="#000" />
    <circle cx="56" cy="48" r="2.5" fill="#000" />
    
    {/* 腮红: 极淡的血色/樱花色 */}
    <circle cx="40" cy="52" r="2.5" fill="#d9465a" opacity="0.2" />
    <circle cx="60" cy="52" r="2.5" fill="#d9465a" opacity="0.2" />
    
    {/* 羊角: 抽象线条 */}
    <path d="M30 25Q20 20 15 30" fill="none" stroke="#d9465a" strokeWidth="1" opacity="0.5" />
    <path d="M70 25Q80 20 85 30" fill="none" stroke="#d9465a" strokeWidth="1" opacity="0.5" />
  </svg>
);

// --- 数据结构 ---
interface MemoryFragment {
  id: string;
  title: string;
  content: string;
  isCrucial: boolean;
  unlockedAt: string;
}

interface Character {
  id: string;
  name: string;
  isPresent: boolean;
  location?: string;
  role?: string; 
  attributes: { label: string; value: string | number }[];
  status?: 'normal' | 'danger' | 'warning';
  description?: string;
  imageUrl?: string;
  hasFullPortrait?: boolean;
}

interface PlayerState {
  name: string;
  role: string;
  camp: string;
  status: string;
}

interface GameState {
  route: string;
  chapter: string;
  date: string;
  timePeriod: string;
  loopNumber: number;
  isFoggy: boolean;
  isFeastActive: boolean;
  currentLocation: string;
  player: PlayerState;
  characters: Character[];
  memories: MemoryFragment[];
}

// --- 初始数据 (更具叙事感的中文) ---
const INITIAL_STATE: GameState = {
  route: "黄泉之花",
  chapter: "第三章 · 迷雾中的祭祀",
  date: "五月十三日",
  timePeriod: "逢魔时刻",
  loopNumber: 4,
  isFoggy: true,
  isFeastActive: true,
  currentLocation: "休水村 · 祭祀集会所",
  player: {
    name: "房石 阳明",
    role: "蛇",
    camp: "人类",
    status: "存活"
  },
  characters: [
    { id: '1', name: '芹泽 千枝实', isPresent: true, role: '猿', attributes: [{ label: '情感', value: '眷恋' }], status: 'normal', description: '开朗的机车少女，似乎隐藏着什么秘密。', imageUrl: 'https://picsum.photos/seed/char1/400/600', hasFullPortrait: true },
    { id: '2', name: '回末 李花子', isPresent: true, role: '未分配', attributes: [{ label: '神秘', value: '极高' }], status: 'warning', description: '神秘的民俗学者，对休水村的传统了如指掌。', imageUrl: 'https://picsum.photos/seed/char2/400/600', hasFullPortrait: true },
    { id: '3', name: '卷岛 春', isPresent: true, role: '未分配', attributes: [{ label: '心理', value: '内向' }], status: 'normal', description: '宽造的孙女，性格内向，总是带着歉意。', imageUrl: 'https://picsum.photos/seed/char3/400/600', hasFullPortrait: true },
    { id: '4', name: '织部 香织', isPresent: true, role: '未分配', attributes: [{ label: '焦虑', value: '溢出' }], status: 'warning', description: '泰长和义次的母亲，经营着村里的食堂。', imageUrl: 'https://picsum.photos/seed/char4/400/600', hasFullPortrait: true },
    { id: '5', name: '咩子', isPresent: true, role: '未分配', attributes: [{ label: '状态', value: '失忆' }], status: 'normal', description: '神秘的失忆少女，总是抱着一个破旧的毛绒玩具。', imageUrl: 'https://picsum.photos/seed/char5/400/600', hasFullPortrait: true },
    { id: '6', name: '马宫 久子', isPresent: true, role: '未分配', attributes: [{ label: '好奇', value: '旺盛' }], status: 'normal', description: '撰稿人，为了探寻传说来到休水村。', imageUrl: 'https://picsum.photos/seed/char6/400/600', hasFullPortrait: true },
    { id: '7', name: '织部 泰长', isPresent: true, role: '未分配', attributes: [{ label: '理智', value: '动摇' }], status: 'normal', description: '香织的长子，理性的大学生。', imageUrl: 'https://picsum.photos/seed/char7/400/600' },
    { id: '8', name: '酿田 近望', isPresent: true, role: '鸦', attributes: [{ label: '洞察', value: '敏锐' }], status: 'normal', description: '总是游离在人群边缘，观察着一切的高中生。', imageUrl: 'https://picsum.photos/seed/char8/400/600' },
    { id: '9', name: '室 匠', isPresent: true, role: '未分配', attributes: [{ label: '武力', value: '极高' }], status: 'normal', description: '粗犷的猎人，村里的武力担当。', imageUrl: 'https://picsum.photos/seed/char9/400/600' },
    { id: '10', name: '织部 义次', isPresent: true, role: '未分配', attributes: [{ label: '性格', value: '叛逆' }], status: 'warning', description: '香织的次子，性格叛逆的不良少年。', imageUrl: 'https://picsum.photos/seed/char10/400/600' },
    { id: '11', name: '山胁 多惠', isPresent: true, role: '未分配', attributes: [{ label: '信仰', value: '狂热' }], status: 'danger', description: '村里的长者，传统习俗的坚定维护者。', imageUrl: 'https://picsum.photos/seed/char11/400/600' },
    { id: '12', name: '卷岛 宽造', isPresent: true, role: '未分配', attributes: [{ label: '威严', value: '极高' }], status: 'warning', description: '村长般的存在，威严而顽固。', imageUrl: 'https://picsum.photos/seed/char12/400/600' },
    { id: '13', name: '能里 清之介', isPresent: true, role: '未分配', attributes: [{ label: '态度', value: '傲慢' }], status: 'normal', description: '富家子弟，对村子的落后充满鄙夷。', imageUrl: 'https://picsum.photos/seed/char13/400/600' },
    { id: '14', name: '木田 德治', isPresent: true, role: '未分配', attributes: [{ label: '精神', value: '异常' }], status: 'danger', description: '人称“狼老头”，总是疯疯癫癫地念叨着狼的传说。', imageUrl: 'https://picsum.photos/seed/char14/400/600' },
    { id: '15', name: '桥本 雄大', isPresent: false, role: '未分配', attributes: [{ label: '状态', value: '未知' }], description: '体格健壮的摄影师，与马宫久子同行。', imageUrl: 'https://picsum.photos/seed/char15/400/600' },
    { id: '16', name: '美佐峰 美辻', isPresent: false, role: '未分配', attributes: [{ label: '状态', value: '未知' }], description: '便利店的店员，似乎被卷入了这场风波。', imageUrl: 'https://picsum.photos/seed/char16/400/600' }
  ],
  memories: [
    {
      id: 'm1',
      title: '禁忌的童谣',
      content: '“绵羊入睡，狼群起舞……” 这首歌谣在村中流传已久，似乎暗示了祭祀的真实顺序。',
      isCrucial: true,
      unlockedAt: '神社后山'
    },
    {
      id: 'm2',
      title: '染血的契约',
      content: '在集会所的暗格中发现的羊皮纸，上面记录了五十年前那场失败的祭祀。',
      isCrucial: false,
      unlockedAt: '集会所地下'
    }
  ]
};

type TabType = 'status' | 'beings' | 'memories' | 'scene';

export default function App() {
  const [state] = useState<GameState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);

  const presentCharacters = state.characters.filter(c => c.isPresent);
  const absentCharacters = state.characters.filter(c => !c.isPresent);
  const selectedCharacterData = state.characters.find(c => c.id === selectedChar);

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4 font-sans select-none antialiased">
      {/* 模拟酒馆消息容器宽度 */}
      <div className="w-full max-w-[720px] mx-auto">
        <div className="glass-panel rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] border-border">
          
          {/* --- 顶部栏: 对称美学 --- */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-border relative bg-gradient-to-b from-bg-secondary to-transparent">
          {/* 左侧: 章节与路线 */}
          <div className="flex flex-col w-1/3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--theme-accent)]" />
              <span className="text-[10px] font-bold text-text-secondary tracking-[0.3em]">当前章节</span>
            </div>
            <h1 className="text-lg font-medium tracking-tight text-text-primary">{state.chapter}</h1>
            <div className="flex items-center gap-3 mt-1 text-[10px] font-medium text-text-secondary tracking-[0.2em]">
              <span className="text-accent">{state.route}</span>
              <span className="opacity-30">|</span>
              <span>第 {state.loopNumber} 次轮回</span>
            </div>
          </div>

          {/* 中间: 绵羊图腾 (核心视觉) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative group">
              <div className="absolute inset-0 bg-accent/10 blur-3xl rounded-full group-hover:bg-accent/20 transition-all duration-700" />
              <SheepLogo className="relative w-14 h-14 text-text-primary drop-shadow-[0_0_20px_var(--theme-accent)] group-hover:scale-105 transition-transform duration-700 cursor-pointer" />
            </div>
          </div>

          {/* 右侧: 时间与刻度 */}
          <div className="flex flex-col items-end w-1/3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-text-secondary tracking-[0.3em]">时空坐标</span>
              <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_var(--theme-gold)]" />
            </div>
            <div className="text-xl font-light text-text-primary tracking-tighter">{state.date}</div>
            <div className="text-[11px] font-bold text-gold tracking-[0.4em] mt-1">{state.timePeriod}</div>
          </div>
        </div>

        {/* --- 导航栏: 极简中文 --- */}
        <div className="px-8 py-4 flex items-center justify-center bg-bg-tertiary">
          <div className="flex p-1.5 bg-bg-secondary border border-border rounded-2xl w-full max-w-2xl backdrop-blur-md">
            {[
              { id: 'status', label: '现世', icon: Activity },
              { id: 'beings', label: '众生', icon: User },
              { id: 'memories', label: '记忆', icon: History },
              { id: 'scene', label: '地缘', icon: Layers },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl text-xs font-medium transition-all duration-500 ${
                  activeTab === tab.id 
                    ? 'tab-active text-text-primary shadow-inner' 
                    : 'text-text-secondary hover:text-text-primary/80'
                }`}
              >
                <tab.icon size={14} className={activeTab === tab.id ? 'text-danger' : ''} />
                <span className="tracking-[0.3em]">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* --- 内容区域 --- */}
        <div className="px-8 py-6 min-h-[240px]">
          <AnimatePresence mode="wait">
            {activeTab === 'status' && (
              <motion.div
                key="status"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-col gap-6"
              >
                {/* --- 我的身份 --- */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold text-text-secondary tracking-[0.3em] flex items-center gap-3">
                    <div className="w-1 h-3 bg-accent rounded-full" />
                    自我认知
                  </h3>
                  <div className="p-3 sm:p-4 rounded-3xl bg-bg-secondary border border-border flex flex-row items-center justify-center gap-3 sm:gap-4">
                    <div className="flex-1 px-3 py-2 rounded-2xl bg-bg-tertiary border border-border flex flex-col items-center justify-center w-full">
                      <span className="text-[10px] text-text-secondary font-bold tracking-widest mb-1">加护</span>
                      <span className="text-base font-bold text-text-primary">{state.player.role}</span>
                    </div>
                    <div className="flex-1 px-3 py-2 rounded-2xl bg-bg-tertiary border border-border flex flex-col items-center justify-center w-full">
                      <span className="text-[10px] text-text-secondary font-bold tracking-widest mb-1">阵营</span>
                      <span className="text-base font-bold text-gold">{state.player.camp}</span>
                    </div>
                    <div className="flex-1 px-3 py-2 rounded-2xl bg-bg-tertiary border border-border flex flex-col items-center justify-center w-full">
                      <span className="text-[10px] text-text-secondary font-bold tracking-widest mb-1">状态</span>
                      <span className="text-base font-bold text-danger">{state.player.status}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-text-secondary tracking-[0.3em] flex items-center gap-3">
                      <div className="w-1 h-3 bg-danger rounded-full" />
                      异象监测
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-5 rounded-3xl border transition-all duration-700 ${state.isFoggy ? 'bg-bg-secondary border-danger/20' : 'bg-bg-tertiary border-border'}`}>
                        <Cloud className={state.isFoggy ? 'text-danger animate-pulse' : 'text-text-secondary/80'} size={24} />
                        <div className="mt-4 text-sm font-bold text-text-primary">迷雾</div>
                        <div className="text-[10px] text-text-secondary mt-1 tracking-widest">{state.isFoggy ? '幽冥之气 · 浓郁' : '暂无异动'}</div>
                      </div>
                      <div className={`p-5 rounded-3xl border transition-all duration-700 ${state.isFeastActive ? 'bg-gold/5 border-gold/20' : 'bg-bg-tertiary border-border'}`}>
                        <Flame className={state.isFeastActive ? 'text-gold' : 'text-text-secondary/80'} size={24} />
                        <div className="mt-4 text-sm font-bold text-text-primary">祭祀</div>
                        <div className="text-[10px] text-text-secondary mt-1 tracking-widest">{state.isFeastActive ? '宴会 · 进行中' : '尚未开启'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-text-secondary tracking-[0.3em] flex items-center gap-3">
                      <div className="w-1 h-3 bg-gold rounded-full" />
                      记忆残片
                    </h3>
                    <div className="p-5 rounded-3xl bg-bg-secondary border border-border space-y-4">
                      {state.memories.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {state.memories.map(m => (
                            <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-bg-secondary border border-border hover:border-gold/30 transition-colors cursor-pointer group">
                              <History size={12} className="text-gold group-hover:scale-110 transition-transform" />
                              <span className="text-xs font-medium text-text-primary/80 group-hover:text-text-primary transition-colors">{m.title}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-text-secondary/80 italic py-4">记忆的丝线尚未交织...</div>
                      )}
                      <div className="pt-3 border-t border-border">
                        <button 
                          onClick={() => setActiveTab('memories')}
                          className="text-[10px] font-bold text-gold/60 hover:text-gold transition-colors tracking-[0.2em] flex items-center gap-2"
                        >
                          追溯完整记忆 <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'beings' && (
              <motion.div
                key="beings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-bold text-text-secondary tracking-[0.3em] flex items-center gap-3">
                        <div className="w-1 h-3 bg-danger rounded-full" />
                        在场众生 ({presentCharacters.length})
                      </h3>
                      <div className="text-[10px] text-text-secondary/80 font-medium tracking-widest italic">点击凝视角色深处</div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {presentCharacters.map((char) => (
                        <button
                          key={char.id}
                          onClick={() => setSelectedChar(selectedChar === char.id ? null : char.id)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-500 text-left group ${
                            selectedChar === char.id 
                              ? 'bg-accent/5 border-accent/50 shadow-[0_10px_20px_-5px_var(--theme-accent)]' 
                              : 'bg-bg-secondary border-border hover:border-accent/30 hover:bg-bg-tertiary'
                          }`}
                        >
                          <img 
                            src={char.imageUrl} 
                            alt={char.name} 
                            className="w-10 h-10 rounded-xl object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-text-primary truncate group-hover:text-accent transition-colors">{char.name}</span>
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                char.status === 'danger' ? 'bg-danger' : 
                                char.status === 'warning' ? 'bg-gold' : 
                                'bg-accent'
                              } shadow-[0_0_8px_currentColor]`} />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {absentCharacters.length > 0 && (
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-[11px] font-bold text-text-secondary tracking-[0.3em] flex items-center gap-3 mb-4">
                        <div className="w-1 h-3 bg-text-secondary/30 rounded-full" />
                        离散者 ({absentCharacters.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {absentCharacters.map((char) => (
                          <button
                            key={char.id}
                            onClick={() => setSelectedChar(selectedChar === char.id ? null : char.id)}
                            className={`px-3 py-1.5 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
                              selectedChar === char.id
                                ? 'bg-accent/10 border-accent/40 text-accent'
                                : 'bg-bg-tertiary border-border/50 text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                            }`}
                          >
                            <span className="text-xs font-medium">{char.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {selectedChar && selectedCharacterData && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                      onClick={() => setSelectedChar(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`glass-panel border border-accent/20 overflow-hidden relative flex flex-col w-full max-w-sm shadow-2xl rounded-[2.5rem] ${
                          selectedCharacterData.hasFullPortrait ? 'h-[80vh] max-h-[600px]' : 'h-auto'
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
                        
                        <button 
                          onClick={() => setSelectedChar(null)}
                          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg-secondary/80 backdrop-blur-md flex items-center justify-center text-text-primary/80 hover:text-text-primary hover:bg-accent/20 transition-all z-20 border border-border"
                        >
                          <ChevronRight size={16} className="rotate-90" />
                        </button>

                        {selectedCharacterData.hasFullPortrait ? (
                          <>
                            {/* 有立绘的角色：大图展示 */}
                            <div className="relative flex-grow min-h-0 w-full overflow-hidden border-b border-border">
                              <img 
                                src={selectedCharacterData.imageUrl} 
                                className="w-full h-full object-cover grayscale-[0.2] contrast-105"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/20 to-transparent" />
                              <div className="absolute bottom-6 left-6 right-6">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--theme-accent)]" />
                                  <span className="text-[9px] text-accent font-bold tracking-[0.5em] uppercase">角色启示</span>
                                </div>
                                <h4 className="text-3xl font-bold text-text-primary tracking-tighter">{selectedCharacterData.name}</h4>
                              </div>
                            </div>
                            <div className="p-6 flex-shrink-0 space-y-5 overflow-y-auto">
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1.5 rounded-xl bg-bg-tertiary border border-border text-[10px] font-bold text-text-secondary tracking-widest uppercase">
                                  身份: <span className="text-text-primary ml-1">{selectedCharacterData.role || '未知'}</span>
                                </span>
                              </div>
                              <div className="p-4 rounded-2xl bg-bg-secondary border border-border italic text-text-primary/80 text-xs leading-relaxed font-light">
                                “{selectedCharacterData.description}”
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {selectedCharacterData.attributes.map((attr, i) => (
                                  <div key={i} className="p-3 rounded-xl bg-bg-secondary border border-border flex flex-col gap-1">
                                    <span className="text-[8px] text-text-secondary font-bold tracking-widest uppercase">{attr.label}</span>
                                    <span className="text-xs text-gold font-medium">{attr.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* 无立绘的角色：紧凑卡片展示 */}
                            <div className="p-8 flex flex-col relative z-10">
                              <div className="flex items-center gap-5 mb-6">
                                <img 
                                  src={selectedCharacterData.imageUrl} 
                                  className="w-16 h-16 rounded-2xl object-cover grayscale-[0.2] border border-border shadow-lg"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--theme-accent)]" />
                                    <span className="text-[9px] text-accent font-bold tracking-[0.5em] uppercase">角色启示</span>
                                  </div>
                                  <h4 className="text-2xl font-bold text-text-primary tracking-tighter">{selectedCharacterData.name}</h4>
                                </div>
                              </div>
                              
                              <div className="space-y-5">
                                <div className="flex items-center gap-3">
                                  <span className="px-3 py-1.5 rounded-xl bg-bg-tertiary border border-border text-[10px] font-bold text-text-secondary tracking-widest uppercase">
                                    身份: <span className="text-text-primary ml-1">{selectedCharacterData.role || '未知'}</span>
                                  </span>
                                </div>
                                <div className="p-4 rounded-2xl bg-bg-secondary border border-border italic text-text-primary/80 text-xs leading-relaxed font-light">
                                  “{selectedCharacterData.description}”
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  {selectedCharacterData.attributes.map((attr, i) => (
                                    <div key={i} className="p-3 rounded-xl bg-bg-secondary border border-border flex flex-col gap-1">
                                      <span className="text-[8px] text-text-secondary font-bold tracking-widest uppercase">{attr.label}</span>
                                      <span className="text-xs text-gold font-medium">{attr.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'memories' && (
              <motion.div
                key="memories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-text-secondary tracking-[0.3em] flex items-center gap-3">
                    <div className="w-1 h-3 bg-gold rounded-full" />
                    追溯 · 记忆残片 ({state.memories.length})
                  </h3>
                  <div className="text-[10px] text-text-secondary/80 font-medium tracking-widest italic">过去即是未来的回响</div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {state.memories.map((m) => (
                    <motion.button
                      key={m.id}
                      layoutId={`memory-${m.id}`}
                      onClick={() => setSelectedMemory(selectedMemory === m.id ? null : m.id)}
                      className={`p-6 rounded-3xl border transition-all duration-700 text-left relative overflow-hidden group ${
                        selectedMemory === m.id 
                          ? 'bg-accent/5 border-accent/40 shadow-[0_30px_60px_-15px_var(--theme-accent)]' 
                          : 'bg-bg-secondary border-border hover:border-accent/20'
                      }`}
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        {m.isCrucial ? <Sparkles size={64} /> : <History size={64} />}
                      </div>

                      <div className="relative z-10 flex items-start gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 ${
                          selectedMemory === m.id ? 'bg-accent/20 scale-110 rotate-3' : 'bg-bg-secondary'
                        }`}>
                          {m.isCrucial ? (
                            <Eye className={selectedMemory === m.id ? 'text-accent' : 'text-text-secondary'} size={24} />
                          ) : (
                            <BookOpen className={selectedMemory === m.id ? 'text-accent' : 'text-text-secondary'} size={24} />
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex items-center gap-4 mb-2">
                            <h4 className="text-xl font-bold text-text-primary tracking-tight group-hover:text-accent transition-colors">{m.title}</h4>
                            {m.isCrucial && (
                              <span className="px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-[9px] font-black text-accent uppercase tracking-widest">关键</span>
                            )}
                          </div>
                          <div className="text-[10px] text-text-secondary tracking-[0.3em] uppercase">溯源：{m.unlockedAt}</div>
                          
                          <AnimatePresence>
                            {selectedMemory === m.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="mt-6 pt-6 border-t border-border"
                              >
                                <p className="text-base text-text-primary/90 leading-relaxed font-light italic">
                                  “{m.content}”
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'scene' && (
              <motion.div
                key="scene"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-text-secondary tracking-[0.3em] flex items-center gap-3">
                    <div className="w-1 h-3 bg-danger rounded-full" />
                    地缘情报
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-bg-secondary border border-border flex items-center gap-4 group hover:bg-bg-tertiary transition-all duration-700">
                    <div className="w-10 h-10 rounded-xl bg-danger/5 flex items-center justify-center text-danger shadow-[0_10px_20px_-5px_var(--theme-danger)] group-hover:scale-105 transition-transform duration-700 flex-shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <div className="text-base font-bold text-text-primary tracking-tight">{state.currentLocation}</div>
                      <div className="text-[10px] text-text-secondary font-bold tracking-[0.3em] mt-1 uppercase">当前地缘坐标</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-bg-tertiary border border-border flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center text-text-secondary">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-text-primary">藤良村</div>
                        <div className="text-[9px] text-text-secondary tracking-widest mt-0.5">周边区域</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-bg-tertiary border border-border flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center text-text-secondary">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-text-primary">神社后山</div>
                        <div className="text-[9px] text-text-secondary tracking-widest mt-0.5">禁忌之地</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-bg-tertiary border border-border flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center text-text-secondary">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-text-primary">休水村 · 食堂</div>
                        <div className="text-[9px] text-text-secondary tracking-widest mt-0.5">生活区</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- 底部栏: 极简留白与主题切换 --- */}
        <div className="px-8 py-4 bg-bg-tertiary border-t border-border flex items-center justify-between relative z-50">
          <div className="flex items-center gap-4 text-[10px] text-text-secondary font-bold tracking-[0.3em]">
            <Eye size={14} className="text-accent" />
            <span>休水村 · 状态观测系统 v5.0</span>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_var(--theme-accent)]" />
              <span className="text-[10px] text-text-secondary font-bold tracking-[0.2em]">因果同步中</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
