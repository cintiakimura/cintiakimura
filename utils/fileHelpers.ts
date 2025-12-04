import { FileData } from '../types';

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const processFiles = async (files: File[]): Promise<FileData[]> => {
  const processedFiles: FileData[] = [];

  for (const file of files) {
    try {
      const content = await readFileAsBase64(file);
      processedFiles.push({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        content: content,
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
    }
  }

  return processedFiles;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};