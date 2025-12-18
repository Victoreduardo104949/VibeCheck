
export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  fileName: string;
}

export interface Message {
  id: string;
  date: Date;
  author: string;
  content: string;
  isSystem: boolean;
  attachment?: Attachment;
}

export interface ChatData {
  participants: string[];
  messages: Message[];
  title: string;
}

export interface AnalysisResult {
  summary: string;
  sentiment: string;
  topics: string[];
}

export interface RedFlag {
  severity: 'low' | 'medium' | 'high';
  description: string;
  citation: string;
}

export interface GreenFlag {
  description: string;
  citation: string;
}

export interface DatingAnalysisResult {
  ghostingScore: {
    userA: { name: string; score: number; label: string };
    userB: { name: string; score: number; label: string };
    description: string;
  };
  redFlags: RedFlag[];
  greenFlags: GreenFlag[];
  relationshipHealth: number;
  sentimentTrend: 'Melhorando' | 'Declinando' | 'Estável' | 'Vulnerável';
  aiAdvice: string;
}
