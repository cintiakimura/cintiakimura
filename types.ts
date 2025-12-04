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