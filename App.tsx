import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { FileData, Message } from './types';
import { Upload, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleAddFiles = (newFiles: FileData[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-notebook-bg text-slate-200">
      {/* Mobile Sidebar Toggle - Visible only on small screens */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-notebook-teal text-black rounded-full shadow-lg md:hidden"
        >
          <BookOpen size={24} />
        </button>
      )}

      {/* Sidebar - Collapsible on mobile */}
      <div
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:relative z-40 w-80 h-full transition-transform duration-300 ease-in-out md:translate-x-0 bg-notebook-surface border-r border-notebook-border shadow-xl md:shadow-none flex flex-col`}
      >
        <Sidebar
          files={files}
          onAddFiles={handleAddFiles}
          onRemoveFile={handleRemoveFile}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-notebook-bg relative">
        <header className="h-16 border-b border-notebook-border flex items-center px-6 bg-notebook-bg/80 backdrop-blur z-10">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-gradient-to-br from-notebook-teal to-notebook-tealDark rounded-lg text-white">
                 <BookOpen size={20} />
               </div>
               <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-notebook-teal to-notebook-tealDark">
                 NotebookLM Clone
               </h1>
            </div>
            <div className="ml-auto text-sm text-slate-500 hidden sm:block">
              Powered by Gemini 2.5 Flash
            </div>
        </header>
        
        <main className="flex-1 overflow-hidden relative">
          <ChatInterface files={files} />
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;