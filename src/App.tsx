/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Zap, 
  Video, 
  FileText, 
  Anchor, 
  BarChart3, 
  Copy, 
  Check, 
  Loader2, 
  ArrowRight,
  Sparkles,
  Youtube,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

// --- Types ---

type TabId = 'research' | 'angles' | 'script' | 'hooks' | 'seo';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  prompt: (topic: string, extra?: string) => string;
  color: string;
}

interface Result {
  id: string;
  tabId: TabId;
  topic: string;
  content: string;
  timestamp: number;
}

// --- Constants ---

const QUICK_CHIPS = [
  "GPT-5 news", 
  "Google Gemini updates", 
  "AI agents 2026", 
  "Open source AI", 
  "AI in robotics", 
  "Mistral AI", 
  "AI coding tools", 
  "AI regulation 2026"
];

const TABS: Tab[] = [
  {
    id: 'research',
    label: 'Topic Research',
    icon: <Search className="w-4 h-4" />,
    color: 'bg-blue-500',
    prompt: (topic) => `Research ${topic} for an AI & Tech News YouTube channel. Give: simple explanation, why it matters right now in 2026, 5 shocking facts or stats, biggest controversy or debate, and what non-techies should care about.`
  },
  {
    id: 'angles',
    label: 'Video Angles',
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-cyan-500',
    prompt: (topic) => `Give 6 unique YouTube video angles for ${topic} in the AI & tech news niche. Mix: beginner explainer, hot controversial take, future impact on jobs, news breakdown, myth-busting, and comparison angle. Include a punchy clickable title and target audience for each.`
  },
  {
    id: 'script',
    label: 'Script Outline',
    icon: <FileText className="w-4 h-4" />,
    color: 'bg-indigo-500',
    prompt: (topic, length = '10') => `Write a timestamped script outline for a ${length}-minute YouTube video about ${topic} for a non-technical audience. Include: gripping hook (0:00-0:10), intro with clear benefit promise, 3 main sections each with 3 talking points, re-engagement lines between sections, practical takeaway, and a comment-driving CTA at the end.`
  },
  {
    id: 'hooks',
    label: 'Hook Generator',
    icon: <Anchor className="w-4 h-4" />,
    color: 'bg-teal-500',
    prompt: (topic) => `Write 7 YouTube hooks for a video about ${topic} in the AI & tech news niche. Use these 7 types: shocking stat, bold claim, relatable problem, question hook, story hook, future prediction, and 'most people don't know this' hook. Each hook must be under 20 words and impossible to skip.`
  },
  {
    id: 'seo',
    label: 'SEO Keywords',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'bg-sky-500',
    prompt: (topic) => `Generate a full YouTube SEO strategy for ${topic} in the AI & tech news niche. Include: 1 primary keyword, 6 secondary keywords, 5 long-tail search phrases, 3 video title formulas under 60 characters, 10 hashtags/tags, 2 thumbnail text options (max 5 words each), and the first 2 lines of a video description.`
  }
];

// --- App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('research');
  const [topic, setTopic] = useState('');
  const [scriptLength, setScriptLength] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const resultsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [results, isLoading]);

  const handleSearch = async (overrideTopic?: string, overrideTab?: TabId, customPrompt?: string) => {
    const currentTopic = overrideTopic || topic;
    const currentTabId = overrideTab || activeTab;
    
    if (!currentTopic.trim() && !customPrompt) return;

    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const currentTab = TABS.find(t => t.id === currentTabId);
      
      const promptText = customPrompt || currentTab?.prompt(currentTopic, scriptLength) || '';

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: promptText,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const newResult: Result = {
        id: Math.random().toString(36).substring(7),
        tabId: currentTabId,
        topic: currentTopic,
        content: response.text || "No response generated.",
        timestamp: Date.now()
      };

      setResults(prev => [newResult, ...prev]);
    } catch (err: any) {
      console.error("AI Error:", err);
      setError(err.message || "Failed to generate content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (chip: string) => {
    setTopic(chip);
    handleSearch(chip);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAction = (topic: string, action: string) => {
    let prompt = "";
    if (action === "script") prompt = `Write a full, detailed YouTube script for a video about ${topic}. Include specific visual cues, B-roll suggestions, and a natural conversational tone for a tech news channel.`;
    if (action === "thumbnail") prompt = `Give me 5 highly clickable thumbnail design concepts for a YouTube video about ${topic}. Describe the background, main subject, text overlay, and color scheme for each.`;
    if (action === "trending") prompt = `Find 10 trending questions or search queries people are asking right now about ${topic} that would make great community post or short-form video ideas.`;
    
    handleSearch(topic, activeTab, prompt);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Youtube className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">AI & Tech News Research Assistant</h1>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Research · Script · Rank · Launch</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? `${tab.color} text-white shadow-lg` 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Search Section */}
        <section className="mb-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-[#141418] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter a topic (e.g., GPT-5, AI Agents, Robotics...)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  />
                </div>
                
                {activeTab === 'script' && (
                  <div className="md:w-32">
                    <select
                      value={scriptLength}
                      onChange={(e) => setScriptLength(e.target.value)}
                      className="w-full h-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="5">5 min</option>
                      <option value="10">10 min</option>
                      <option value="15">15 min</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={() => handleSearch()}
                  disabled={isLoading || !topic.trim()}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  <span>Generate</span>
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3"
          >
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {error}
          </motion.div>
        )}

        {/* Results Section */}
        <section className="space-y-8">
          <AnimatePresence mode="popLayout">
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#141418] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-slate-400"
              >
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                  <div className="absolute inset-0 blur-xl bg-cyan-500/20 rounded-full animate-pulse" />
                </div>
                <p className="text-lg font-medium animate-pulse">Analyzing tech trends for 2026...</p>
              </motion.div>
            )}

            {results.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#141418]/50 border border-dashed border-white/10 rounded-2xl p-20 flex flex-col items-center justify-center gap-6 text-center"
              >
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                  <Video className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-300">Ready to research?</h3>
                  <p className="text-slate-500 mt-2 max-w-xs mx-auto">Enter a topic above or pick a quick chip to start generating viral tech content ideas.</p>
                </div>
              </motion.div>
            )}

            {results.map((result) => {
              const tab = TABS.find(t => t.id === result.tabId);
              return (
                <motion.div
                  key={result.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#141418] border border-white/10 rounded-2xl overflow-hidden shadow-xl group"
                >
                  {/* Card Header */}
                  <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white ${tab?.color}`}>
                        {tab?.label}
                      </span>
                      <h3 className="text-sm font-semibold text-white truncate max-w-[200px] md:max-w-md">
                        {result.topic}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(result.content, result.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title="Copy to clipboard"
                      >
                        {copiedId === result.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 prose prose-invert prose-cyan max-w-none prose-p:text-slate-300 prose-headings:text-white prose-strong:text-cyan-400 prose-li:text-slate-300">
                    <ReactMarkdown>{result.content}</ReactMarkdown>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex flex-wrap gap-3">
                    <button 
                      onClick={() => handleAction(result.topic, 'script')}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-all"
                    >
                      Write full script <ArrowRight className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleAction(result.topic, 'thumbnail')}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-all"
                    >
                      Get thumbnail ideas <ArrowRight className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleAction(result.topic, 'trending')}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-all"
                    >
                      Find trending questions <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={resultsEndRef} />
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-600 text-sm mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Powered by Gemini 3.1 Pro & Google Search</span>
        </div>
        <p className="text-slate-500 text-xs">
          © 2026 AI & Tech News Research Assistant. Optimized for high-growth tech channels.
        </p>
      </footer>
    </div>
  );
}
