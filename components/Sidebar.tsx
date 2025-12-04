import React, { useRef } from 'react';
import { FileData } from '../types';
import { processFiles, formatFileSize } from '../utils/fileHelpers';
import { Upload, X, FileText, File as FileIcon, Trash2, Plus, XCircle } from 'lucide-react';

interface SidebarProps {
  files: FileData[];
  onAddFiles: (files: FileData[]) => void;
  onRemoveFile: (id: string) => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ files, onAddFiles, onRemoveFile, onCloseMobile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = await processFiles(Array.from(e.target.files));
      onAddFiles(newFiles);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="text-red-400" size={20} />;
    if (mimeType.includes('text') || mimeType.includes('md')) return <FileText className="text-blue-400" size={20} />;
    return <FileIcon className="text-slate-400" size={20} />;
  };

  return (
    <div className="flex flex-col h-full bg-notebook-surface">
      <div className="p-4 border-b border-notebook-border flex items-center justify-between">
        <h2 className="font-semibold text-slate-200">Sources</h2>
        <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-slate-200">
            <XCircle size={24} />
        </button>
      </div>

      <div className="p-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-notebook-teal/30 hover:border-notebook-teal bg-notebook-teal/5 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group"
        >
          <div className="bg-notebook-item p-3 rounded-full shadow-sm group-hover:shadow-md transition-shadow mb-3 text-notebook-teal border border-notebook-border">
            <Plus size={24} />
          </div>
          <span className="text-sm font-medium text-notebook-teal">Add Source</span>
          <span className="text-xs text-slate-500 mt-1">PDF, TXT, MD, CSV</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept=".pdf,.txt,.md,.csv,.doc,.docx"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {files.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-500 text-sm">
            <p>No sources added yet.</p>
            <p className="mt-1">Upload documents to start chatting.</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="group relative bg-notebook-item p-3 rounded-lg border border-notebook-border shadow-sm hover:border-notebook-teal/50 transition-colors flex items-start gap-3">
               <div className="mt-1">
                 {getFileIcon(file.type)}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-slate-200 truncate" title={file.name}>{file.name}</p>
                 <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
               </div>
               <button 
                 onClick={() => onRemoveFile(file.id)}
                 className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-all"
                 title="Remove file"
               >
                 <Trash2 size={16} />
               </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 text-xs text-slate-500 text-center border-t border-notebook-border">
        Files are processed in your browser.
      </div>
    </div>
  );
};