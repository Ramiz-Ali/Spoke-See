export interface Transcription {
  id: string;
  text: string;
  timestamp: Date;
  summary?: string;
  corrections?: GrammarCorrection[];
}

export interface GrammarCorrection {
  message: string;
  offset: number;
  length: number;
  replacements: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

export type PopoutState = 'hidden' | 'login' | 'settings' | 'transcriptions' | 'splash';

export type ThemeMode = 'light' | 'dark';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface FilteredWord {
  word: string;
  replacement: string;
}

export interface FilterSettings {
  enabled: boolean;
  mode: 'replace' | 'censor';
  customReplacements: FilteredWord[];
}

export interface AudioState {
  isMusicEnabled: boolean;
  volume: number;
}