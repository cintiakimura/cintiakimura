export interface FileData {
  id: string;
  name: string;
  type: string;
  content: string; // Base64 encoded content
  size: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'jp' | 'pt';

export interface StudioItem {
  id: string;
  type: 'podcast' | 'video' | 'slides' | 'infographic';
  title: string;
  content: string; // URL for media, or Markdown for text
  status: ProcessingStatus;
  language: SupportedLanguage;
  createdAt: number;
  // Metadata for history
  originalPrompt?: string;
  style?: string;
}
