export enum TagType {
  Grammar = 'Gramatyka',
  Lexis = 'Leksyka',
  NonVerbal = 'Niewerbalność'
}

export enum Language {
  English = 'Angielski',
  Spanish = 'Hiszpański',
  German = 'Niemiecki',
  French = 'Francuski',
  Italian = 'Włoski',
  Other = 'Inny'
}

export interface Task {
  id: string;
  topic: string;
  description?: string; // New optional description
  language: Language; // New language field
  originalDuration: number; // minutes
  tag: TagType;
  createdAt: number; // timestamp
  nextDueDate: number; // timestamp (start of day)
  stage: number; // 0=Initial (Done), 1=Day 1, 2=Day 2, 3=Day 7, 4=Day 14, 5=Day 25
  isArchived: boolean;
}

export const INTERVALS = [1, 2, 7, 14, 25]; 

export interface TimeOption {
  label: string;
  minutes: number;
}