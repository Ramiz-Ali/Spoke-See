import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';

// Interfaces and Types
interface User {
  uid: string;
  name: string;
  email: string | null;
  isPremium: boolean;
  role: 'user' | 'admin'; // Replace isAdmin with role
}

interface Transcription {
  id: string;
  text: string;
  timestamp: Date;
  corrections?: GrammarCorrection[];
  summary?: string;
  translatedText?: string;
  userId?: string;
}

type PopoutState = 'hidden' | 'settings' | 'history' | 'help' | 'login' | 'signup';
type ThemeMode = 'light' | 'dark';

interface Language {
  code: string;
  name: string;
  nativeName?: string;
}

interface GrammarCorrection {
  message: string;
  offset: number;
  length: number;
  replacements: string[];
}

interface FilterSettings {
  enabled: boolean;
  mode: 'replace' | 'censor';
  customReplacements: FilteredWord[];
}

interface FilteredWord {
  word: string;
  replacement: string;
}

interface AudioState {
  isMusicEnabled: boolean;
  volume: number;
}

interface DualMicTranscript {
  original: string;
  translated: string;
  timestamp: Date;
  speaker: 'mic1' | 'mic2';
}

// Constants
const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en-US', name: 'English', nativeName: 'English' },
  { code: 'zh-CN', name: 'Chinese', nativeName: '中文' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский' },
];

// Store Interface
interface AppState {
  // Auth State
  currentUser: User | null;
  authError: string | null;
  isLoading: boolean;

  // Transcription State
  isListening: boolean;
  currentTranscription: string;
  savedTranscriptions: Transcription[];
  popoutState: PopoutState;
  themeMode: ThemeMode;
  selectedLanguage: Language;
  targetLanguage: Language;
  showTranslation: boolean;
  supportedLanguages: Language[];
  isCheckingGrammar: boolean;
  translationError: string | null;
  wordTimeout: number;
  filterSettings: FilterSettings;
  audioState: AudioState;

  // Dual Mic State
  isDualMicActive: boolean;
  mic1Language: Language;
  mic2Language: Language;
  mic1IsSpeaking: boolean;
  mic2IsSpeaking: boolean;
  mic1Transcription: string;
  mic2Transcription: string;
  mic1Translated: string;
  mic2Translated: string;
  dualMicConversation: DualMicTranscript[];
  isMic1Translating: boolean;
  isMic2Translating: boolean;

  // Audio Context
  audioContext: AudioContext | null;
  mic1Stream: MediaStream | null;
  mic2Stream: MediaStream | null;
  mic1Recognition: SpeechRecognition | null;
  mic2Recognition: SpeechRecognition | null;
  singleMicRecognition: SpeechRecognition | null;

  // Auth Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  checkPremiumStatus: () => Promise<void>;

  // Transcription Actions
  setListening: (isListening: boolean) => void;
  setCurrentTranscription: (text: string) => void;
  saveTranscription: (text: string) => Promise<void>;
  deleteTranscription: (id: string) => Promise<void>;
  summarizeTranscript: (text: string) => Promise<void>;
  updateTranscription: (id: string, text: string) => Promise<void>;
  setPopoutState: (state: PopoutState) => void;
  toggleTheme: () => void;
  setSelectedLanguage: (language: Language | string) => void;
  setTargetLanguage: (language: Language | string) => void;
  toggleTranslation: () => void;
  translateText: (text: string, sourceLang: string, targetLang: string) => Promise<string>;
  translateAndSave: (text: string) => Promise<void>;
  setWordTimeout: (timeout: number) => void;
  toggleWordFilter: () => void;
  setFilterMode: (mode: 'replace' | 'censor') => void;
  addFilteredWord: (word: string, replacement: string) => void;
  removeFilteredWord: (word: string) => void;
  toggleMusic: () => void;
  setVolume: (volume: number) => void;
  startListening: () => Promise<void>;
  stopListening: () => void;

  // Dual Mic Actions
  setDualMicActive: (active: boolean) => void;
  setMic1Language: (language: Language) => void;
  setMic2Language: (language: Language) => void;
  startDualMicRecording: () => Promise<void>;
  stopDualMicRecording: () => void;
  setMic1Speaking: (speaking: boolean) => void;
  setMic2Speaking: (speaking: boolean) => void;
  setMic1Transcription: (text: string) => Promise<void>;
  setMic2Transcription: (text: string) => Promise<void>;
  resetDualMicState: () => void;
  saveDualMicConversation: () => Promise<void>;
  exportToGoogleDocs: (text: string) => Promise<void>;
  clearDualMicConversation: () => void;
  translateMic1Text: () => Promise<void>;
  translateMic2Text: () => Promise<void>;

  // Utility Actions
  getUserTranscriptions: () => Promise<Transcription[]>;
  clearUserTranscriptions: () => Promise<void>;
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial Auth State
      currentUser: null,
      authError: null,
      isLoading: false,

      // Initial Transcription State
      isListening: false,
      currentTranscription: '',
      savedTranscriptions: [],
      popoutState: 'hidden',
      themeMode: 'dark',
      selectedLanguage: SUPPORTED_LANGUAGES[0], // en-US
      targetLanguage: SUPPORTED_LANGUAGES[5],  // es-ES
      showTranslation: true,
      supportedLanguages: SUPPORTED_LANGUAGES,
      isCheckingGrammar: false,
      translationError: null,
      wordTimeout: 7000,
      filterSettings: {
        enabled: true,
        mode: 'replace',
        customReplacements: [],
      },
      audioState: {
        isMusicEnabled: false,
        volume: 0.5,
      },

      // Dual Mic State
      isDualMicActive: false,
      mic1Language: SUPPORTED_LANGUAGES[0],
      mic2Language: SUPPORTED_LANGUAGES[5],
      mic1IsSpeaking: false,
      mic2IsSpeaking: false,
      mic1Transcription: '',
      mic2Transcription: '',
      mic1Translated: '',
      mic2Translated: '',
      dualMicConversation: [],
      isMic1Translating: false,
      isMic2Translating: false,

      // Audio Context
      audioContext: null,
      mic1Stream: null,
      mic2Stream: null,
      mic1Recognition: null,
      mic2Recognition: null,
      singleMicRecognition: null,

      // Auth Actions
      setUser: (user) => set({ currentUser: user, authError: null }),

      login: async (email, password) => {
        set({ isLoading: true, authError: null });
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};

          set({
            currentUser: {
              uid: user.uid,
              email: user.email,
              name: userData.name || '',
              isPremium: userData.isPremium || false,
              role: userData.role || 'user', // Use role from Firestore, default to "user"
            },
            authError: null,
            isLoading: false,
            popoutState: 'hidden',
          });
        } catch (error) {
          set({
            authError: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
          set({ currentUser: null, popoutState: 'hidden', savedTranscriptions: [] });
        } catch (error) {
          set({
            authError: error instanceof Error ? error.message : 'Logout failed',
          });
          throw error;
        }
      },

      upgradeToPremium: async () => {
        const { currentUser } = get();
        if (!currentUser) throw new Error('User must be logged in to upgrade');
        if (currentUser.isPremium) throw new Error('User is already Premium');

        set({ isLoading: true });
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), { isPremium: true });
          set({
            currentUser: { ...currentUser, isPremium: true },
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      checkPremiumStatus: async () => {
        const { currentUser } = get();
        if (!currentUser) return;

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        set({
          currentUser: {
            ...currentUser,
            isPremium: userData.isPremium || false,
            role: userData.role || 'user', // Use role from Firestore
          },
        });
      },

      // Transcription Actions
      setListening: (isListening) => set({ isListening }),

      setCurrentTranscription: (text) => set((state) => {
        const validText = typeof text === 'string' ? text : '';
        return {
          currentTranscription: state.filterSettings.enabled
            ? filterText(validText, state.filterSettings.customReplacements, state.filterSettings.mode)
            : validText,
        };
      }),

      saveTranscription: async (text) => {
        const { currentUser } = get();
        if (!text.trim() || !currentUser) return;

        set({ isLoading: true });
        try {
          const newTranscription: Transcription = {
            id: Date.now().toString(),
            text,
            timestamp: new Date(),
            userId: currentUser.uid,
          };

          const docRef = await addDoc(collection(db, 'transcriptions'), newTranscription);
          set((state) => ({
            savedTranscriptions: [
              ...state.savedTranscriptions,
              { ...newTranscription, id: docRef.id },
            ],
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      deleteTranscription: async (id) => {
        const { currentUser } = get();
        if (!currentUser) return;

        set({ isLoading: true });
        try {
          await deleteDoc(doc(db, 'transcriptions', id));
          set((state) => ({
            savedTranscriptions: state.savedTranscriptions.filter(t => t.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      summarizeTranscript: async (text) => {
        set({ isLoading: true });
        try {
          // Placeholder for actual summarization API
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulated API call
          const summary = `${text.substring(0, 100)}...`;
          set({ isLoading: false });
          // In a real app, you'd update state with the summary
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateTranscription: async (id, text) => {
        set({ isLoading: true });
        try {
          await updateDoc(doc(db, 'transcriptions', id), { text });
          set((state) => ({
            savedTranscriptions: state.savedTranscriptions.map(t =>
              t.id === id ? { ...t, text } : t
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setPopoutState: (state) => set({ popoutState: state }),

      toggleTheme: () => set((state) => ({
        themeMode: state.themeMode === 'light' ? 'dark' : 'light',
      })),

      setSelectedLanguage: (language) => {
        let selected: Language;
        if (typeof language === 'string') {
          selected = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
        } else {
          selected = SUPPORTED_LANGUAGES.find(l => l.code === language.code) || SUPPORTED_LANGUAGES[0];
        }
        console.debug('Setting selectedLanguage:', selected);
        set((state) => {
          // If targetLanguage matches new selectedLanguage, change targetLanguage
          const newTargetLanguage = state.targetLanguage.code === selected.code
            ? SUPPORTED_LANGUAGES.find(l => l.code !== selected.code) || SUPPORTED_LANGUAGES[5]
            : state.targetLanguage;
          return {
            selectedLanguage: selected,
            targetLanguage: newTargetLanguage,
          };
        }) ;
      },

      setTargetLanguage: (language) => {
        let selected: Language;
        if (typeof language === 'string') {
          selected = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[5];
        } else {
          selected = SUPPORTED_LANGUAGES.find(l => l.code === language.code) || SUPPORTED_LANGUAGES[5];
        }
        console.debug('Setting targetLanguage:', selected);
        set((state) => {
          // Avoid setting targetLanguage to same as selectedLanguage
          if (selected.code === state.selectedLanguage.code) {
            const fallback = SUPPORTED_LANGUAGES.find(l => l.code !== state.selectedLanguage.code) || SUPPORTED_LANGUAGES[5];
            console.debug('Avoiding same language, using fallback:', fallback);
            return { targetLanguage: fallback };
          }
          return { targetLanguage: selected };
        });
      },

      toggleTranslation: () => set((state) => ({
        showTranslation: !state.showTranslation,
      })),

      translateText: async (text: string, sourceLang: string, targetLang: string) => {
        const { selectedLanguage, targetLanguage } = get();
        const effectiveSourceLang = sourceLang || selectedLanguage.code;
        const effectiveTargetLang = targetLang || targetLanguage.code;

        if (!text?.trim() || !effectiveSourceLang || !effectiveTargetLang) {
          console.warn('Invalid translation input:', { 
            text, 
            textType: typeof text, 
            textContent: JSON.stringify(text, null, 2), 
            sourceLang: effectiveSourceLang, 
            targetLang: effectiveTargetLang 
          });
          return '';
        }

        // Prevent translation if source and target languages are the same
        if (effectiveSourceLang === effectiveTargetLang) {
          console.warn('Same source and target language:', effectiveSourceLang);
          return '';
        }

        try {
          const apiKey = 'AIzaSyDB7F7HH2DQ4BdfcwVJ_yGlrhjYY_VsdqA'; // Your API key
          const response = await fetch(
            `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                q: text,
                source: effectiveSourceLang.split('-')[0],
                target: effectiveTargetLang.split('-')[0],
                format: 'text',
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || 'Translation request failed';
            console.error('Translation API error:', errorMessage);
            set({ translationError: errorMessage });
            return '';
          }

          const data = await response.json();
          const translatedText = data?.data?.translations?.[0]?.translatedText || '';
          if (!translatedText) {
            console.warn('No translated text in response:', data);
            set({ translationError: 'No translation returned' });
          }
          return translatedText;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Translation failed';
          console.error('Translation error:', errorMessage);
          set({ translationError: errorMessage });
          return '';
        }
      },

      translateAndSave: async (text) => {
        const { currentUser, translateText, targetLanguage, selectedLanguage } = get();
        if (!currentUser || !text.trim()) return;

        set({ isLoading: true });
        try {
          const translatedText = selectedLanguage.code !== targetLanguage.code
            ? await translateText(text, selectedLanguage.code, targetLanguage.code)
            : '';
          const newTranscription: Transcription = {
            id: Date.now().toString(),
            text,
            translatedText,
            timestamp: new Date(),
            userId: currentUser.uid,
          };

          const docRef = await addDoc(collection(db, 'transcriptions'), newTranscription);
          set((state) => ({
            savedTranscriptions: [
              ...state.savedTranscriptions,
              { ...newTranscription, id: docRef.id },
            ],
            currentTranscription: '',
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setWordTimeout: (timeout) => set({ wordTimeout: timeout }),

      toggleWordFilter: () => set((state) => ({
        filterSettings: { ...state.filterSettings, enabled: !state.filterSettings.enabled },
      })),

      setFilterMode: (mode) => set((state) => ({
        filterSettings: { ...state.filterSettings, mode },
      })),

      addFilteredWord: (word, replacement) => set((state) => ({
        filterSettings: {
          ...state.filterSettings,
          customReplacements: [...state.filterSettings.customReplacements, { word, replacement }],
        },
      })),

      removeFilteredWord: (word) => set((state) => ({
        filterSettings: {
          ...state.filterSettings,
          customReplacements: state.filterSettings.customReplacements.filter(w => w.word !== word),
        },
      })),

      toggleMusic: () => set((state) => ({
        audioState: { ...state.audioState, isMusicEnabled: !state.audioState.isMusicEnabled },
      })),

      setVolume: (volume) => set((state) => ({
        audioState: { ...state.audioState, volume: Math.max(0, Math.min(1, volume)) },
      })),

      startListening: async () => {
        const { selectedLanguage } = get();
        try {
          set({ isLoading: true, isListening: true });
          
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          
          const recognition = new (window.SpeechRecognition || (window as any).webkitSpeechRecognition)();
          recognition.lang = selectedLanguage.code;
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
              .map(result => result[0])
              .map(result => result.transcript)
              .join('');
            if (transcript) {
              get().setCurrentTranscription(transcript);
            }
          };

          recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            set({ authError: `Recognition error: ${event.error}` });
          };

          recognition.onend = () => {
            if (get().isListening) {
              recognition.start();
            }
          };

          recognition.start();

          set({
            audioContext,
            singleMicRecognition: recognition,
            isLoading: false,
          });
        } catch (error) {
          set({
            isListening: false,
            isLoading: false,
            authError: error instanceof Error ? error.message : 'Failed to start listening',
          });
          throw error;
        }
      },

      stopListening: () => {
        const { audioContext, singleMicRecognition } = get();
        try {
          if (singleMicRecognition) {
            singleMicRecognition.stop();
          }
          if (audioContext) {
            audioContext.close();
          }
        } catch (error) {
          console.error('Error stopping recognition:', error);
        }
        set({
          isListening: false,
          audioContext: null,
          singleMicRecognition: null,
        });
      },

      // Dual Mic Actions
      setDualMicActive: (active) => set({ isDualMicActive: active }),

      setMic1Language: (language) => set((state) => ({
        mic1Language: language,
        mic1Recognition: state.mic1Recognition ? { ...state.mic1Recognition, lang: language.code } : null
      })),

      setMic2Language: (language) => set((state) => ({
        mic2Language: language,
        mic2Recognition: state.mic2Recognition ? { ...state.mic2Recognition, lang: language.code } : null
      })),

      startDualMicRecording: async () => {
        try {
          set({ isLoading: true, isDualMicActive: true });

          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter(device => device.kind === 'audioinput');

          const mic1Stream = await navigator.mediaDevices.getUserMedia({
            audio: { 
              deviceId: audioInputs[0]?.deviceId,
              noiseSuppression: true,
              echoCancellation: true 
            },
          });
          
          const mic2Stream = audioInputs.length > 1 ? await navigator.mediaDevices.getUserMedia({
            audio: { 
              deviceId: audioInputs[1]?.deviceId,
              noiseSuppression: true,
              echoCancellation: true 
            },
          }) : mic1Stream;

          const audioContext = new AudioContext();
          
          const mic1Recognition = new (window.SpeechRecognition || (window as any).webkitSpeechRecognition)();
          mic1Recognition.lang = get().mic1Language.code;
          mic1Recognition.continuous = true;
          mic1Recognition.interimResults = true;

          mic1Recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
              .map(result => result[0])
              .map(result => result.transcript)
              .join('');
            if (transcript) {
              get().setMic1Transcription(transcript);
            }
          };

          mic1Recognition.onerror = (event) => {
            console.error('Mic1 recognition error:', event.error);
            if (event.error !== 'no-speech') {
              set({ authError: `Mic1 error: ${event.error}` });
            }
          };

          mic1Recognition.onend = () => {
            if (get().isDualMicActive) {
              mic1Recognition.start();
            }
          };

          const mic2Recognition = new (window.SpeechRecognition || (window as any).webkitSpeechRecognition)();
          mic2Recognition.lang = get().mic2Language.code;
          mic2Recognition.continuous = true;
          mic2Recognition.interimResults = true;

          mic2Recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
              .map(result => result[0])
              .map(result => result.transcript)
              .join('');
            if (transcript) {
              get().setMic2Transcription(transcript);
            }
          };

          mic2Recognition.onerror = (event) => {
            console.error('Mic2 recognition error:', event.error);
            if (event.error !== 'no-speech') {
              set({ authError: `Mic2 error: ${event.error}` });
            }
          };

          mic2Recognition.onend = () => {
            if (get().isDualMicActive) {
              mic2Recognition.start();
            }
          };

          mic1Recognition.start();
          mic2Recognition.start();

          set({
            mic1Stream,
            mic2Stream,
            audioContext,
            mic1Recognition,
            mic2Recognition,
            mic1Transcription: '',
            mic2Transcription: '',
            mic1Translated: '',
            mic2Translated: '',
            isLoading: false,
            translationError: null,
          });
        } catch (error) {
          set({
            isDualMicActive: false,
            isLoading: false,
            authError: error instanceof Error ? error.message : 'Failed to start dual mic recording',
          });
          throw error;
        }
      },

      stopDualMicRecording: () => {
        const { mic1Stream, mic2Stream, audioContext, mic1Recognition, mic2Recognition } = get();
        try {
          if (mic1Stream) mic1Stream.getTracks().forEach(track => track.stop());
          if (mic2Stream) mic2Stream.getTracks().forEach(track => track.stop());
          if (audioContext) audioContext.close();
          if (mic1Recognition) mic1Recognition.stop();
          if (mic2Recognition) mic2Recognition.stop();
        } catch (error) {
          console.error('Error stopping dual mic recording:', error);
        }
        set({
          isDualMicActive: false,
          mic1IsSpeaking: false,
          mic2IsSpeaking: false,
          mic1Stream: null,
          mic2Stream: null,
          audioContext: null,
          mic1Recognition: null,
          mic2Recognition: null,
        });
      },

      setMic1Speaking: (speaking) => set({ mic1IsSpeaking: speaking }),

      setMic2Speaking: (speaking) => set({ mic2IsSpeaking: speaking }),

      setMic1Transcription: async (text) => {
        const { filterSettings, mic1Language, mic2Language, translateText } = get();
        const filteredText = filterSettings.enabled
          ? filterText(text, filterSettings.customReplacements, filterSettings.mode)
          : text;

        set((state) => ({
          mic1Transcription: filteredText,
          dualMicConversation: [
            ...state.dualMicConversation,
            {
              original: filteredText,
              translated: '',
              timestamp: new Date(),
              speaker: 'mic1',
            },
          ],
        }));

        if (mic2Language.code !== mic1Language.code) {
          try {
            const translated = await translateText(filteredText, mic1Language.code, mic2Language.code);
            set((state) => ({
              mic1Translated: translated,
              dualMicConversation: state.dualMicConversation.map((item, idx) =>
                idx === state.dualMicConversation.length - 1 && item.speaker === 'mic1'
                  ? { ...item, translated }
                  : item
              ),
            }));
          } catch (error) {
            set({ translationError: 'Failed to translate Mic1 text' });
          }
        }
      },

      setMic2Transcription: async (text) => {
        const { filterSettings, mic2Language, mic1Language, translateText } = get();
        const filteredText = filterSettings.enabled
          ? filterText(text, filterSettings.customReplacements, filterSettings.mode)
          : text;

        set((state) => ({
          mic2Transcription: filteredText,
          dualMicConversation: [
            ...state.dualMicConversation,
            {
              original: filteredText,
              translated: '',
              timestamp: new Date(),
              speaker: 'mic2',
            },
          ],
        }));

        if (mic1Language.code !== mic2Language.code) {
          try {
            const translated = await translateText(filteredText, mic2Language.code, mic1Language.code);
            set((state) => ({
              mic2Translated: translated,
              dualMicConversation: state.dualMicConversation.map((item, idx) =>
                idx === state.dualMicConversation.length - 1 && item.speaker === 'mic2'
                  ? { ...item, translated }
                  : item
              ),
            }));
          } catch (error) {
            set({ translationError: 'Failed to translate Mic2 text' });
          }
        }
      },

      resetDualMicState: () => {
        const { mic1Stream, mic2Stream, audioContext, mic1Recognition, mic2Recognition } = get();
        try {
          if (mic1Stream) mic1Stream.getTracks().forEach(track => track.stop());
          if (mic2Stream) mic2Stream.getTracks().forEach(track => track.stop());
          if (audioContext) audioContext.close();
          if (mic1Recognition) mic1Recognition.stop();
          if (mic2Recognition) mic2Recognition.stop();
        } catch (error) {
          console.error('Error resetting dual mic state:', error);
        }
        set({
          isDualMicActive: false,
          mic1Transcription: '',
          mic2Transcription: '',
          mic1Translated: '',
          mic2Translated: '',
          mic1IsSpeaking: false,
          mic2IsSpeaking: false,
          dualMicConversation: [],
          mic1Stream: null,
          mic2Stream: null,
          audioContext: null,
          mic1Recognition: null,
          mic2Recognition: null,
        });
      },

      saveDualMicConversation: async () => {
        const { currentUser, dualMicConversation } = get();
        if (!currentUser || !dualMicConversation.length) return;

        set({ isLoading: true });
        try {
          const conversationText = dualMicConversation
            .map(item => `[${item.timestamp.toLocaleTimeString()}] Speaker ${item.speaker === 'mic1' ? '1' : '2'}: ${item.original}${item.translated ? `\nTranslation: ${item.translated}` : ''}`)
            .join('\n\n');

          const newTranscription: Transcription = {
            id: Date.now().toString(),
            text: conversationText,
            timestamp: new Date(),
            userId: currentUser.uid,
          };

          const docRef = await addDoc(collection(db, 'transcriptions'), newTranscription);
          set((state) => ({
            savedTranscriptions: [
              ...state.savedTranscriptions,
              { ...newTranscription, id: docRef.id },
            ],
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      exportToGoogleDocs: async (text) => {
        set({ isLoading: true });
        try {
          // Placeholder for Google Docs API integration
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulated API call
          console.log('Exporting to Google Docs:', text);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      clearDualMicConversation: () => set({ dualMicConversation: [] }),

      translateMic1Text: async () => {
        const { mic1Transcription, mic1Language, mic2Language, translateText } = get();
        if (!mic1Transcription.trim()) return;

        set({ isMic1Translating: true, translationError: null });
        try {
          const translated = mic1Language.code !== mic2Language.code
            ? await translateText(mic1Transcription, mic1Language.code, mic2Language.code)
            : '';
          set({
            mic1Translated: translated,
            dualMicConversation: get().dualMicConversation.map((item, idx) =>
              item.speaker === 'mic1' && idx === get().dualMicConversation.length - 1
                ? { ...item, translated }
                : item
            ),
            isMic1Translating: false,
          });
        } catch (error) {
          set({
            translationError: error instanceof Error ? error.message : 'Translation failed',
            isMic1Translating: false,
          });
          throw error;
        }
      },

      translateMic2Text: async () => {
        const { mic2Transcription, mic2Language, mic1Language, translateText } = get();
        if (!mic2Transcription.trim()) return;

        set({ isMic2Translating: true, translationError: null });
        try {
          const translated = mic2Language.code !== mic1Language.code
            ? await translateText(mic2Transcription, mic2Language.code, mic1Language.code)
            : '';
          set({
            mic2Translated: translated,
            dualMicConversation: get().dualMicConversation.map((item, idx) =>
              item.speaker === 'mic2' && idx === get().dualMicConversation.length - 1
                ? { ...item, translated }
                : item
            ),
            isMic2Translating: false,
          });
        } catch (error) {
          set({
            translationError: error instanceof Error ? error.message : 'Translation failed',
            isMic2Translating: false,
          });
          throw error;
        }
      },

      // Utility Actions
      getUserTranscriptions: async () => {
        const { currentUser } = get();
        if (!currentUser) return [];

        set({ isLoading: true });
        try {
          const q = query(collection(db, 'transcriptions'), where('userId', '==', currentUser.uid));
          const querySnapshot = await getDocs(q);
          const transcriptions: Transcription[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
          } as Transcription));
          set({ savedTranscriptions: transcriptions, isLoading: false });
          return transcriptions;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      clearUserTranscriptions: async () => {
        const { currentUser, savedTranscriptions } = get();
        if (!currentUser) return;

        set({ isLoading: true });
        try {
          const batch = savedTranscriptions.map(t => deleteDoc(doc(db, 'transcriptions', t.id)));
          await Promise.all(batch);
          set({ savedTranscriptions: [], isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'voicebridge-store',
      partialize: (state) => ({
        themeMode: state.themeMode,
        selectedLanguage: state.selectedLanguage,
        targetLanguage: state.targetLanguage,
        audioState: state.audioState,
        filterSettings: state.filterSettings,
        mic1Language: state.mic1Language,
        mic2Language: state.mic2Language,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Validate persisted languages
        if (!SUPPORTED_LANGUAGES.some(l => l.code === state.selectedLanguage?.code)) {
          state.selectedLanguage = SUPPORTED_LANGUAGES[0];
        }
        if (!SUPPORTED_LANGUAGES.some(l => l.code === state.targetLanguage?.code)) {
          state.targetLanguage = SUPPORTED_LANGUAGES[5];
        }
        // Ensure selectedLanguage and targetLanguage are different
        if (state.selectedLanguage?.code === state.targetLanguage?.code) {
          state.targetLanguage = SUPPORTED_LANGUAGES.find(l => l.code !== state.selectedLanguage.code) || SUPPORTED_LANGUAGES[5];
        }
      },
    }
  )
);

// Helper function
function filterText(text: string, replacements: FilteredWord[], mode: 'replace' | 'censor'): string {
  if (!replacements.length) return text;

  let result = text;
  replacements.forEach(({ word, replacement }) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, mode === 'replace' ? replacement : '*'.repeat(word.length));
  });
  return result;
}

export default useAppStore;