import { useEffect, useState, useRef } from 'react';
import useAppStore from '../store';

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

const useSpeechRecognition = () => {
  const { isListening, setCurrentTranscription, saveTranscription, selectedLanguage } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const currentLanguageRef = useRef<string>(selectedLanguage.code);
  const isInitializedRef = useRef<boolean>(false);
  const isMobileRef = useRef<boolean>(false);
  const transcriptBufferRef = useRef<string>('');
  const updateTimeoutRef = useRef<number | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);

  // Check if running on mobile device
  useEffect(() => {
    isMobileRef.current = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    const cleanup = () => {
      if (recognitionRef.current) {
        try {
          isInitializedRef.current = false;
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error stopping recognition:', err);
        }
        recognitionRef.current = null;
      }
      setError(null);
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      transcriptBufferRef.current = '';
    };

    const updateTranscription = (transcript: string) => {
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
      
      transcriptBufferRef.current = transcript;
      
      updateTimeoutRef.current = window.setTimeout(() => {
        setCurrentTranscription(transcriptBufferRef.current);
        transcriptBufferRef.current = '';
      }, 100); // Debounce updates
    };

    const startListening = () => {
      try {
        cleanup(); // Ensure clean state before starting

        // Reinitialize if language changed or not initialized
        if (isInitializedRef.current && currentLanguageRef.current === selectedLanguage.code) {
          return; // Prevent multiple initializations
        }

        // @ts-ignore - Web Speech API is not fully typed in TypeScript
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
          setError('Speech recognition is not supported in this browser');
          return;
        }
        
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = isMobileRef.current;
        recognition.interimResults = true;
        recognition.lang = selectedLanguage.code;
        currentLanguageRef.current = selectedLanguage.code;
        isInitializedRef.current = true;
        
        recognition.onresult = (event: any): void => {
          if (!event?.results || !isListening) return;
          
          let finalTranscript = isMobileRef.current ? transcriptBufferRef.current : '';
          let interimTranscript = isMobileRef.current ? transcriptBufferRef.current : '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript + ' ';
            }
          }

          const fullTranscript = (finalTranscript + interimTranscript).trim();
          updateTranscription(fullTranscript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          
          // Handle specific error cases
          switch (event.error) {
            case 'no-speech':
              setError('No speech detected. Please try speaking again.');
              break;
            case 'aborted':
              setError('Recognition was aborted. Please try again.');
              break;
            case 'network':
              setError('Network error occurred. Please check your connection.');
              break;
            case 'not-allowed':
              setError('Microphone access denied. Please enable microphone permissions.');
              break;
            default:
              setError(`Recognition error: ${event.error}`);
          }
          
          cleanup();
          // Auto-clear error after 3 seconds
          setTimeout(() => setError(null), 3000);
          
          // If still listening, attempt to restart after a delay
          if (isListening) {
            const delay = isMobileRef.current ? 300 : 1000;
            restartTimeoutRef.current = window.setTimeout(() => {
              if (isListening) {
                startListening();
              }
            }, delay);
          }
          
        };
        
        recognition.onend = async () => {
          isInitializedRef.current = false;
          if (isListening) {
            try {
              if (!recognitionRef.current) return;
              
              // Add a small delay before restarting to prevent rapid restarts
              const delay = isMobileRef.current ? 100 : 300;
              restartTimeoutRef.current = window.setTimeout(() => {
                if (isListening) {
                  startListening();
                }
              }, delay);
            } catch (err) {
              console.error('Failed to restart recognition:', err);
            }
          } else {
            // Save transcription when stopping
            saveTranscription();
          }
        };
        
        recognition.start();
        
      } catch (err) {
        console.error('Speech recognition error:', err);
        setError(err instanceof Error ? err.message : 'Failed to start speech recognition');
      }
    };

    if (isListening) {
      startListening();
    } else if (recognitionRef.current) {
      try {
        cleanup();
      } catch (err) {
        console.error('Error during cleanup:', err);
      }
    }
    
    return cleanup;
  }, [isListening, setCurrentTranscription, saveTranscription, selectedLanguage.code]);
  
  return { error };
};

export default useSpeechRecognition;