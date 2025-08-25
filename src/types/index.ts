export interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  status: "uploading" | "processing" | "ready" | "error";
  progress?: number;
  content?: string; // Store extracted text content
  file?: File; // Store the original file for content extraction
}

export interface QAItem {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  documentId: string;
}

export interface UploadProgress {
  id: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
}

export interface SearchResult {
  qaItem: QAItem;
  document: Document;
  relevanceScore: number;
}

export interface AppState {
  documents: Document[];
  qaHistory: QAItem[];
  currentDocument: Document | null;
  isLoading: boolean;
  error: string | null;
}
