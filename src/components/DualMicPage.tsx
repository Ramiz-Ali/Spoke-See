import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, ChevronDown, Languages, X, Download, FileText, Sparkles } from 'lucide-react';
import useAppStore from '../store';
import jsPDF from 'jspdf';
import { Document, Paragraph, TextRun, Packer } from "docx";

interface Language {
  code: string;
  name: string;
  nativeName?: string;
}

interface Speaker {
  name: string;
  color: string;
  isActive: boolean;
  transcription: string;
  language: Language;
  translationLanguage: Language | null;
  translatedText: string;
  words: WordWithTimestamp[];
  removedWords: Set<string>;
  lastFinalTranscript: string;
  isTranslating: boolean;
}

interface WordWithTimestamp {
  word: string;
  timestamp: number;
  translation?: string;
}

const LanguageDropdown: React.FC<{
  languages: Language[];
  selected: Language;
  onSelect: (lang: Language) => void;
  className?: string;
}> = ({ languages, selected, onSelect, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-white text-sm w-full min-w-[120px] justify-between"
      >
        <div className="flex items-center gap-2 truncate">
          <Languages size={14} />
          <span className="truncate">{selected.name}</span>
        </div>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-full bg-gray-700 rounded-lg shadow-lg py-1 z-10 border border-gray-600 max-h-60 overflow-y-auto scrollbar-hide"
          style={{
            msOverflowStyle: 'none', // IE and Edge
            scrollbarWidth: 'none', // Firefox
          }}
        >
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                onSelect(lang);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-600 text-white text-sm flex items-center gap-2"
            >
              <span className="truncate">
                {lang.name} {lang.nativeName && `(${lang.nativeName})`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Add this CSS to hide scrollbars in Webkit browsers (Chrome, Safari)
const styles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Inject styles into the document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

const DualMicPage: React.FC = () => {
  const {
    isDualMicActive,
    supportedLanguages,
    setDualMicActive,
    saveTranscript,
    summarizeTranscript,
    wordTimeout,
    translateText,
  } = useAppStore();

  const [speakers, setSpeakers] = useState<Speaker[]>([
    {
      name: "Speaker 1",
      color: "text-blue-400",
      isActive: false,
      transcription: "",
      language: supportedLanguages[0] || { code: 'en-US', name: 'English' },
      translationLanguage: null,
      translatedText: "",
      words: [],
      removedWords: new Set(),
      lastFinalTranscript: "",
      isTranslating: false
    },
    {
      name: "Speaker 2",
      color: "text-green-400",
      isActive: false,
      transcription: "",
      language: supportedLanguages[0] || { code: 'en-US', name: 'English' },
      translationLanguage: null,
      translatedText: "",
      words: [],
      removedWords: new Set(),
      lastFinalTranscript: "",
      isTranslating: false
    },
  ]);

  const [combinedTranscript, setCombinedTranscript] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const activeSpeakerRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 3;

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Release the stream after granting permission
      return true;
    } catch (error) {
      console.error('Microphone permission request failed:', error);
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          return 'Microphone access denied. Please allow microphone permissions in your browser settings.';
        } else if (error.name === 'NotFoundError') {
          return 'No microphone found. Please connect a microphone and try again.';
        }
      }
      return 'An unexpected error occurred while requesting microphone access.';
    }
  };

  const initSpeechRecognition = (speakerIndex: number) => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported");
      setTranslationError("Speech recognition not supported in your browser");
      return null;
    }

    if (recognitionRef.current && activeSpeakerRef.current !== speakerIndex) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speakers[speakerIndex].language.code;

    recognition.onstart = () => {
      console.log(`Speech recognition started for Speaker ${speakerIndex + 1}`);
      retryCountRef.current = 0;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const currentResult = results[results.length - 1];
      const transcript = currentResult[0].transcript.trim();

      if (activeSpeakerRef.current === null) return;

      setSpeakers(prev => {
        const newSpeakers = [...prev];
        const currentSpeaker = newSpeakers[speakerIndex];

        if (!currentResult.isFinal) {
          currentSpeaker.transcription = transcript;
        } else if (transcript && transcript !== currentSpeaker.lastFinalTranscript) {
          const timestamp = new Date().toLocaleTimeString();
          setCombinedTranscript(prev => {
            const newEntry = `[${timestamp}] ${currentSpeaker.name}: ${transcript}\n`;
            return prev.includes(newEntry) ? prev : prev + newEntry;
          });
          currentSpeaker.transcription = "";
          currentSpeaker.lastFinalTranscript = transcript;
          currentSpeaker.translatedText = ""; // Reset for new translation

          const words = transcript.split(' ').filter(Boolean);
          const now = Date.now();
          currentSpeaker.words = [
            ...currentSpeaker.words.filter(w => now - w.timestamp < wordTimeout),
            ...words.map(word => ({ word, timestamp: now }))
          ];
        }
        return newSpeakers;
      });
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error(`Speech recognition error for Speaker ${speakerIndex + 1}:`, event.error);
      if (event.error === 'network' && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        console.log(`Retrying recognition (${retryCountRef.current}/${maxRetries})...`);
        setTimeout(() => recognition.start(), 1000);
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setTranslationError(`Microphone error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log(`Speech recognition ended for Speaker ${speakerIndex + 1}`);
      if (isRecording && activeSpeakerRef.current === speakerIndex && recognitionRef.current === recognition) {
        try {
          recognition.start();
          console.log(`Speech recognition restarted for Speaker ${speakerIndex + 1}`);
        } catch (error) {
          console.error('Error restarting recognition:', error);
          setTranslationError('Failed to restart microphone');
        }
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  };

  const handleTranslate = async (speakerIndex: number, text: string) => {
    const speaker = speakers[speakerIndex];
    if (!speaker.translationLanguage || !text.trim()) {
      console.log(`Skipping translation for Speaker ${speakerIndex + 1}: No language or text`);
      return;
    }

    console.log(`Translating for Speaker ${speakerIndex + 1}: "${text}" to ${speaker.translationLanguage.code}`);
    try {
      setSpeakers(prev => {
        const newSpeakers = [...prev];
        newSpeakers[speakerIndex].isTranslating = true;
        return newSpeakers;
      });

      const translated = await translateText(
        text,
        speaker.language.code,
        speaker.translationLanguage.code
      );
      console.log(`Translation result for Speaker ${speakerIndex + 1}: "${translated}"`);

      setSpeakers(prev => {
        const newSpeakers = [...prev];
        newSpeakers[speakerIndex].translatedText = translated || "Translation unavailable";
        newSpeakers[speakerIndex].isTranslating = false;
        return newSpeakers;
      });
      setTranslationError(null);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationError(error instanceof Error ? error.message : 'Translation failed');
      setSpeakers(prev => {
        const newSpeakers = [...prev];
        newSpeakers[speakerIndex].isTranslating = false;
        newSpeakers[speakerIndex].translatedText = "Translation failed";
        return newSpeakers;
      });
    }
  };

  useEffect(() => {
    speakers.forEach((speaker, index) => {
      if (speaker.translationLanguage && speaker.lastFinalTranscript && !speaker.isTranslating) {
        handleTranslate(index, speaker.lastFinalTranscript);
      }
    });
  }, [speakers.map(s => s.lastFinalTranscript).join(), speakers.map(s => s.translationLanguage?.code).join()]);

  const startRecording = async () => {
    if (!window.SpeechRecognition && !(window as any).webkitSpeechRecognition) {
      setTranslationError("Speech recognition not supported in your browser");
      return;
    }

    // Request microphone permission explicitly
    const permissionResult = await requestMicPermission();
    if (typeof permissionResult === 'string') {
      setTranslationError(permissionResult);
      return;
    }

    const initialSpeaker = 0;
    const recognition = initSpeechRecognition(initialSpeaker);
    
    try {
      recognition?.start();
      setIsRecording(true);
      setCombinedTranscript("");
      activeSpeakerRef.current = initialSpeaker;
      
      setSpeakers(prev =>
        prev.map((speaker, index) => ({
          ...speaker,
          isActive: index === initialSpeaker,
          transcription: "",
          words: [],
          translatedText: "",
          lastFinalTranscript: ""
        }))
      );
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setTranslationError(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Microphone access denied. Please check browser permissions.'
          : 'Failed to start recording. Please try again.'
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (error) {
        console.error(`Error stopping recognition:`, error);
      }
    }
    setIsRecording(false);
    activeSpeakerRef.current = null;
    setSpeakers(prev =>
      prev.map(speaker => ({
        ...speaker,
        isActive: false,
        transcription: "",
        words: [],
        translatedText: "",
        lastFinalTranscript: ""
      }))
    );
  };

  const handleSpeakerToggle = (speakerIndex: number) => {
    if (!isRecording || activeSpeakerRef.current === speakerIndex) return;

    const recognition = initSpeechRecognition(speakerIndex);
    try {
      recognition?.start();
      activeSpeakerRef.current = speakerIndex;
      setSpeakers(prev =>
        prev.map((speaker, index) => ({
          ...speaker,
          isActive: index === speakerIndex,
          transcription: index === speakerIndex ? speaker.transcription : ""
        }))
      );
    } catch (error) {
      console.error('Error toggling speaker:', error);
      setTranslationError('Error switching microphone');
    }
  };

  const handleLanguageChange = (speakerIndex: number, language: Language) => {
    setSpeakers(prev => {
      const newSpeakers = [...prev];
      newSpeakers[speakerIndex].language = language;

      if (activeSpeakerRef.current === speakerIndex && isRecording) {
        const recognition = initSpeechRecognition(speakerIndex);
        try {
          recognition?.start();
        } catch (error) {
          console.error('Error restarting recognition after language change:', error);
          setTranslationError('Failed to restart microphone after language change');
        }
      }
      return newSpeakers;
    });
  };

  const handleTranslationLanguageChange = (speakerIndex: number, language: Language | null) => {
    setSpeakers(prev => {
      const newSpeakers = [...prev];
      newSpeakers[speakerIndex].translationLanguage = language;
      if (!language) {
        newSpeakers[speakerIndex].translatedText = "";
      }
      return newSpeakers;
    });
  };

  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setSpeakers(prev =>
        prev.map(speaker => ({
          ...speaker,
          words: speaker.words.filter(({ timestamp }) => now - timestamp < wordTimeout)
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, wordTimeout]);

  const handleStartStop = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleClose = () => {
    stopRecording();
    setDualMicActive(false);
  };

  const handleSaveTranscript = () => {
    const fullTranscript = combinedTranscript + speakers
      .filter(s => s.translatedText)
      .map(s => `\n[${s.name} Translation]: ${s.translatedText}`)
      .join("");
    
    // Generate PDF
    const doc = new jsPDF();
    doc.setFontSize(12);
    
    // Split text to fit within PDF margins (assuming 10pt margin)
    const splitText = doc.splitTextToSize(fullTranscript, 190);
    let yPosition = 10;
    
    splitText.forEach((line: string) => {
      if (yPosition > 280) { // Check if we need a new page
        doc.addPage();
        yPosition = 10;
      }
      doc.text(line, 10, yPosition);
      yPosition += 7; // Line spacing
    });
    
    doc.save('transcript.pdf');
    
    // Maintain original save functionality
    saveTranscript(fullTranscript);
    alert('Transcript saved as PDF!');
  };



const handleExportToDocs = async () => {
  // Format transcript with speaker names and translations
  const fullTranscript = combinedTranscript + speakers
    .filter(s => s.translatedText)
    .map(s => `\n\n[${s.name} Translation]: ${s.translatedText}`)
    .join("");

  // Create a Word document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "Transcript",
              bold: true,
              size: 28,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: fullTranscript,
              size: 24,
            }),
          ],
        }),
      ],
    }],
  });

  // Generate and download the .docx file
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `transcript_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  const handleSummarize = () => {
    summarizeTranscript(combinedTranscript);
    alert('Transcript sent for summarization!');
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  if (!isDualMicActive) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 w-full max-w-6xl mx-auto my-2 sm:my-4 relative">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Dual Speaker Captioning</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-white p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {(speakers.some(s => s.isTranslating) || translationError) && (
          <div className="absolute top-20 left-0 right-0 flex justify-center z-10">
            <div className={`px-4 py-2 rounded-lg shadow-lg text-white ${
              translationError ? 'bg-red-600' : 'bg-blue-600'
            }`}>
              {translationError || 'Translating...'}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {speakers.map((speaker, index) => (
            <div
              key={index}
              className={`p-3 sm:p-4 rounded-xl border-2 ${speaker.isActive ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 bg-gray-700'} transition-colors cursor-pointer`}
              onClick={() => handleSpeakerToggle(index)}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <input
                  type="text"
                  value={speaker.name}
                  onChange={(e) => {
                    const newSpeakers = [...speakers];
                    newSpeakers[index].name = e.target.value;
                    setSpeakers(newSpeakers);
                  }}
                  className="text-base sm:text-lg font-semibold text-white bg-transparent border-b border-gray-500 focus:border-blue-500 focus:outline-none w-full sm:w-auto"
                />
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                  <LanguageDropdown
                    languages={supportedLanguages}
                    selected={speaker.language}
                    onSelect={(lang) => handleLanguageChange(index, lang)}
                  />
                  <LanguageDropdown
                    languages={[{ code: '', name: 'No Translation' }, ...supportedLanguages]}
                    selected={speaker.translationLanguage || { code: '', name: 'No Translation' }}
                    onSelect={(lang) => handleTranslationLanguageChange(index, lang.code ? lang : null)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className={`p-1.5 sm:p-2 rounded-full ${speaker.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}>
                  {speaker.isActive ? <Mic size={16} /> : <MicOff size={16} />}
                </div>
                <span className={`text-xs sm:text-sm font-medium ${speaker.isActive ? 'text-green-400' : 'text-gray-400'}`}>
                  {speaker.isActive ? 'Active - Click to switch' : isRecording ? 'Click to activate' : 'Start recording to activate'}
                </span>
              </div>

              <div className="p-2 sm:p-3 bg-gray-800 rounded-lg min-h-[80px] sm:min-h-[100px] max-h-[150px] sm:max-h-[200px] overflow-y-auto">
                <div className={`text-xs sm:text-sm ${speaker.color} leading-relaxed`}>
                  {speaker.words.length > 0 || speaker.transcription ? (
                    <>
                      <AnimatePresence mode="popLayout">
                        {speaker.words.map(({ word, timestamp }, wordIndex) => (
                          <motion.span
                            key={`${word}-${timestamp}-${wordIndex}`}
                            className="inline-block mr-1 sm:mr-2 mb-0.5 sm:mb-1"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                          >
                            {word}
                          </motion.span>
                        ))}
                      </AnimatePresence>
                      {speaker.transcription && (
                        <span className="opacity-70">{speaker.transcription}</span>
                      )}
                    </>
                  ) : (
                    <span className="opacity-70">
                      {isRecording ? "Click to activate microphone..." : "Waiting for speech..."}
                    </span>
                  )}
                </div>
                {speaker.translatedText && (
                  <div className="text-xs sm:text-sm text-gray-300 mt-1 sm:mt-2 italic border-t border-gray-700 pt-1 sm:pt-2">
                    <span className="font-medium">Translation:</span> {speaker.translatedText}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 sm:mt-4 bg-gray-700 rounded-xl p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-white">Combined Transcript</h3>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              <button
                onClick={handleSaveTranscript}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs sm:text-sm min-w-[80px] sm:min-w-[100px] justify-center"
              >
                <Download size={14} />
                <span>Save</span>
              </button>
              <button
                onClick={handleExportToDocs}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-white text-xs sm:text-sm min-w-[80px] sm:min-w-[100px] justify-center"
              >
                <FileText size={14} />
                <span>Google Docs</span>
              </button>
              <button
                onClick={handleSummarize}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-xs sm:text-sm min-w-[80px] sm:min-w-[100px] justify-center"
              >
                <Sparkles size={14} />
                <span>Summarize</span>
              </button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 sm:p-3 max-h-40 sm:max-h-60 overflow-y-auto">
            <pre className="text-gray-300 text-xs sm:text-sm whitespace-pre-wrap font-sans">
              {combinedTranscript || "Transcript will appear here as speakers talk..."}
            </pre>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 flex justify-center">
          <button
            onClick={handleStartStop}
            className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2 ${
              isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white font-medium transition-colors text-sm sm:text-base`}
          >
            {isRecording ? (
              <>
                <MicOff size={16} />
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <Mic size={16} />
                <span>Start Recording</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-2 sm:mt-3 text-center text-gray-400 text-xs sm:text-sm">
          <p>Click on a speaker panel to activate their microphone</p>
          <p>
            Speaker 1 appears in <span className="text-blue-400">blue</span>, Speaker 2 in{' '}
            <span className="text-green-400">green</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DualMicPage;