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

export interface BehavioralProfile {
  name: string;
  communicationStyle: string;
  attachmentStyle: 'Seguro' | 'Ansioso' | 'Evitativo' | 'Desorganizado';
  emotionalInvestment: number;
  powerDynamic: 'Dominante' | 'Equilibrado' | 'Passivo/Submisso' | 'Evitativo/Indiferente';
  keyBehavior: string;
}

export interface SubtextDecoder {
  quote: string;
  apparentMeaning: string;
  hiddenMeaning: string;
  psychologicalInsight: string;
}

export interface ConnectionThermometers {
  intimacyScore: number;
  anxietyScore: number;
  vibeCompatibility: number;
  futurePotentialScore: number;
}

export interface TimelinePhase {
  phase: string;
  description: string;
  sentiment: 'Positivo' | 'Neutro' | 'Tenso' | 'Frio';
}

export interface SuggestedMessage {
  context: string;
  draft: string;
  objective: string;
}

export interface ActionPlaybook {
  whatToDo: string[];
  whatToAvoid: string[];
  suggestedMessages: SuggestedMessage[];
}

export interface DatingAnalysisResult {
  executiveSummary: string;
  relationshipHealth: number;
  sentimentTrend: 'Melhorando' | 'Declinando' | 'Estável' | 'Vulnerável';
  ghostingScore: {
    userA: { name: string; score: number; label: string; evidence?: string };
    userB: { name: string; score: number; label: string; evidence?: string };
    description: string;
  };
  behavioralProfiles: {
    userA: BehavioralProfile;
    userB: BehavioralProfile;
    dynamicSummary: string;
  };
  redFlags: RedFlag[];
  greenFlags: GreenFlag[];
  subtextDecoders: SubtextDecoder[];
  connectionThermometers: ConnectionThermometers;
  relationshipTimeline: TimelinePhase[];
  actionPlaybook: ActionPlaybook;
  aiAdvice: string;
}
