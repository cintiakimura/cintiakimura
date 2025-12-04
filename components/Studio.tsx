import React, { useState } from 'react';
import { FileData, StudioItem, SupportedLanguage, ProcessingStatus } from '../types';
import { generatePodcast, generateVideo, generateSlides } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Mic2, Video, Presentation, FileBarChart, Loader2, Globe, ArrowLeft, Wand2, Play } from 'lucide-react';

interface StudioProps {
  files: FileData[];
}

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'jp', label: '日本語' },
  { code: 'pt', label: 'Português' },
];

const VIDEO_STYLES = [
  "Cinematic",
  "Cyberpunk / Neon",
  "Minimalist / Clean",
  "Animated / Cartoon",
  "Vintage / Retro",
  "Abstract / Data Visualization",
  "Nature / Organic"
];

type StudioType = StudioItem['type'];

export const Studio: React.FC<StudioProps> = ({ files }) => {
  const [items, setItems] = useState<StudioItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuration State
  const [activeConfigType, setActiveConfigType] = useState<StudioType | null>(null);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('en');
  const [customPrompt, setCustomPrompt] = useState('');
  const [videoStyle, setVideoStyle] = useState(VIDEO_STYLES[0]);

  const handleStartConfig = (type: StudioType) => {
    setActiveConfigType(type);
    setCustomPrompt('');
    setVideoStyle(VIDEO_STYLES[0]);
  };

  const handleGenerate = async () => {
    if (!activeConfigType) return;
    if (files.length === 0) return alert("Please upload files first.");
    
    const type = activeConfigType;
    const newItem: StudioItem = {
      id: crypto.randomUUID(),
      type,
      title: `Generated ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content: '',
      status: ProcessingStatus.PROCESSING,
      language: selectedLang,
      createdAt: Date.now(),
      originalPrompt: customPrompt,
      style: type === 'video' ? videoStyle : undefined
    };

    setItems(prev => [newItem, ...prev]);
    setActiveConfigType(null); // Return to list view while processing
    setIsProcessing(true);

    try {
      let content = "";
      if (type === 'podcast') {
        content = await generatePodcast(files, selectedLang, customPrompt);
      } else if (type === 'video') {
        content = await generateVideo(files, selectedLang, customPrompt, videoStyle);
      } else if (type === 'slides' || type === 'infographic') {
        content = await generateSlides(files, selectedLang, customPrompt);
      }

      setItems(prev => prev.map(item => 
        item.id === newItem.id 
          ? { ...item, status: ProcessingStatus.SUCCESS, content } 
          : item
      ));
    } catch (error) {
      console.error(error);
      setItems(prev => prev.map(item => 
        item.id === newItem.id 
          ? { ...item, status: ProcessingStatus.ERROR, content: "Generation failed." } 
          : item
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = (item: StudioItem) => {
    if (item.status === ProcessingStatus.PROCESSING) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-notebook-teal animate-pulse">
          <Loader2 className="animate-spin mb-2" size={32} />
          <p className="text-sm">Generating your {item.type}...</p>
          {item.type === 'video' && <p className="text-xs text-slate-500 mt-2">This may take 1-2 minutes</p>}
        </div>
      );
    }

    if (item.status === ProcessingStatus.ERROR) {
      return <div className="p-4 text-red-400 bg-red-900/10 rounded">Error generating content. Please try again.</div>;
    }

    switch (item.type) {
      case 'podcast':
        return (
          <div className="p-4 bg-notebook-bg rounded-lg">
             <audio controls className="w-full" src={item.content} />
          </div>
        );
      case 'video':
        return (
          <div className="rounded-lg overflow-hidden bg-black aspect-video relative group">
             <video controls className="w-full h-full" src={item.content} />
          </div>
        );
      case 'slides':
      case 'infographic':
        return (
          <div className="p-6 bg-notebook-bg rounded-lg border border-notebook-border max-h-96 overflow-y-auto prose prose-invert prose-sm">
            <ReactMarkdown>{item.content}</ReactMarkdown>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-6 relative">
      
      {/* Configuration Mode Overlay */}
      {activeConfigType && (
        <div className="absolute inset-0 z-20 bg-notebook-bg/95 backdrop-blur-sm p-6 flex flex-col animate-in fade-in zoom-in-95 duration-200">
           <div className="max-w-2xl mx-auto w-full h-full flex flex-col">
              <button 
                onClick={() => setActiveConfigType(null)}
                className="flex items-center text-slate-400 hover:text-white mb-6 w-fit transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" /> Back to Studio
              </button>

              <div className="bg-notebook-surface border border-notebook-border rounded-2xl p-8 shadow-2xl flex-1 flex flex-col">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-notebook-teal/10 text-notebook-teal">
                      {activeConfigType === 'podcast' && <Mic2 size={24} />}
                      {activeConfigType === 'video' && <Video size={24} />}
                      {activeConfigType === 'slides' && <Presentation size={24} />}
                      {activeConfigType === 'infographic' && <FileBarChart size={24} />}
                    </div>
                    <h2 className="text-2xl font-bold text-white capitalize">Configure {activeConfigType}</h2>
                 </div>

                 <div className="space-y-6 flex-1">
                    {/* Language */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Language</label>
                      <select 
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value as SupportedLanguage)}
                        className="w-full bg-notebook-bg border border-notebook-border rounded-lg p-3 text-slate-200 focus:border-notebook-teal outline-none"
                      >
                        {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                      </select>
                    </div>

                    {/* Video Style - Only for Video */}
                    {activeConfigType === 'video' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Visual Style</label>
                        <select 
                          value={videoStyle}
                          onChange={(e) => setVideoStyle(e.target.value)}
                          className="w-full bg-notebook-bg border border-notebook-border rounded-lg p-3 text-slate-200 focus:border-notebook-teal outline-none"
                        >
                          {VIDEO_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Custom Prompt */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Custom Instructions (Optional)</label>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder={activeConfigType === 'video' 
                          ? "Describe the specific scene or elements you want to see..." 
                          : "Focus on specific topics, tone, or audience..."
                        }
                        className="w-full h-32 bg-notebook-bg border border-notebook-border rounded-lg p-3 text-slate-200 focus:border-notebook-teal outline-none resize-none"
                      />
                    </div>
                 </div>

                 <div className="pt-6 mt-6 border-t border-notebook-border">
                    <button
                      onClick={handleGenerate}
                      disabled={isProcessing}
                      className="w-full py-4 bg-gradient-to-r from-notebook-teal to-notebook-tealDark hover:from-teal-400 hover:to-teal-600 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                      Generate {activeConfigType.charAt(0).toUpperCase() + activeConfigType.slice(1)}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Main Studio View */}
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Creative Studio</h2>
          <p className="text-slate-400">Transform your sources into different formats.</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleStartConfig('podcast')}
            disabled={isProcessing}
            className="flex flex-col items-center gap-3 p-6 bg-notebook-surface border border-notebook-border hover:border-notebook-teal/50 hover:bg-notebook-item transition-all rounded-xl text-left group disabled:opacity-50"
          >
            <div className="p-3 rounded-full bg-notebook-bg group-hover:bg-notebook-teal/10 text-notebook-teal transition-colors">
              <Mic2 size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-slate-200">Audio Overview</h3>
              <p className="text-xs text-slate-500 mt-1">Deep Dive conversation (2 hosts)</p>
            </div>
          </button>

          <button
            onClick={() => handleStartConfig('video')}
            disabled={isProcessing}
            className="flex flex-col items-center gap-3 p-6 bg-notebook-surface border border-notebook-border hover:border-notebook-teal/50 hover:bg-notebook-item transition-all rounded-xl text-left group disabled:opacity-50"
          >
            <div className="p-3 rounded-full bg-notebook-bg group-hover:bg-notebook-teal/10 text-notebook-teal transition-colors">
              <Video size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-slate-200">Video Brief</h3>
              <p className="text-xs text-slate-500 mt-1">AI-generated visual summary</p>
            </div>
          </button>

          <button
            onClick={() => handleStartConfig('slides')}
            disabled={isProcessing}
            className="flex flex-col items-center gap-3 p-6 bg-notebook-surface border border-notebook-border hover:border-notebook-teal/50 hover:bg-notebook-item transition-all rounded-xl text-left group disabled:opacity-50"
          >
            <div className="p-3 rounded-full bg-notebook-bg group-hover:bg-notebook-teal/10 text-notebook-teal transition-colors">
              <Presentation size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-slate-200">Slide Deck</h3>
              <p className="text-xs text-slate-500 mt-1">Structured presentation outline</p>
            </div>
          </button>
          
          <button
            onClick={() => handleStartConfig('infographic')}
            disabled={isProcessing}
            className="flex flex-col items-center gap-3 p-6 bg-notebook-surface border border-notebook-border hover:border-notebook-teal/50 hover:bg-notebook-item transition-all rounded-xl text-left group disabled:opacity-50"
          >
            <div className="p-3 rounded-full bg-notebook-bg group-hover:bg-notebook-teal/10 text-notebook-teal transition-colors">
              <FileBarChart size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-slate-200">Infographic</h3>
              <p className="text-xs text-slate-500 mt-1">Key stats and visual plan</p>
            </div>
          </button>
        </div>

        {/* Results List */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-300 border-b border-notebook-border pb-2">Your Creations</h3>
          
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-600 border border-dashed border-notebook-border rounded-xl">
              Select an option above to generate content from your documents.
            </div>
          ) : (
            <div className="grid gap-6">
              {items.map(item => (
                <div key={item.id} className="bg-notebook-surface border border-notebook-border rounded-xl p-5 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono px-2 py-1 rounded bg-notebook-bg text-notebook-teal uppercase border border-notebook-border">
                        {item.type}
                      </span>
                      <h4 className="font-medium text-slate-200">{item.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="uppercase">{item.language}</span>
                      {item.style && <span className="bg-notebook-item px-2 py-0.5 rounded">{item.style}</span>}
                    </div>
                  </div>
                  
                  {item.originalPrompt && (
                     <div className="mb-4 text-xs text-slate-400 italic bg-notebook-bg/50 p-2 rounded border-l-2 border-notebook-border">
                       "{item.originalPrompt}"
                     </div>
                  )}

                  {renderContent(item)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
