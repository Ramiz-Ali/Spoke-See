import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store';
import { useCallback } from 'react';
import AnimatedBackground from './AnimatedBackground';
import { Languages, ChevronDown } from 'lucide-react';

interface WordWithTimestamp {
  word: string;
  timestamp: number;
  translation?: string;
}

const CaptionsDisplay: React.FC = () => {
  const { 
    currentTranscription, 
    isListening, 
    wordTimeout, 
    showTranslation,
    selectedLanguage,
    targetLanguage,
    toggleTranslation,
    translateText,
    supportedLanguages,
    setTargetLanguage
  } = useAppStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobileRef = useRef<boolean>(false);
  const [displayedWords, setDisplayedWords] = useState<WordWithTimestamp[]>([]);
  const [removedWords, setRemovedWords] = useState<Set<string>>(new Set());
  const [isTranslating, setIsTranslating] = useState(false);
  const updateWordsTimeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    isMobileRef.current = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }, []);
  
  // Cleanup function
  useEffect(() => {
    return () => {
      if (updateWordsTimeoutRef.current) {
        window.clearTimeout(updateWordsTimeoutRef.current);
      }
    };
  }, []);
  
  const updateWords = useCallback(async () => {
    if (updateWordsTimeoutRef.current) {
      window.clearTimeout(updateWordsTimeoutRef.current);
      updateWordsTimeoutRef.current = null;
    }

    const debounceTime = isMobileRef.current ? 150 : 50;
    
    updateWordsTimeoutRef.current = window.setTimeout(async () => {
      const words = currentTranscription.split(' ').filter(Boolean);
      const now = Date.now();
    
      try {
        let translatedText = '';
        // Skip translation if source and target languages are the same
        if (showTranslation && words.length > 0 && selectedLanguage.code !== targetLanguage.code) {
          setIsTranslating(true);
          translatedText = await translateText(currentTranscription, selectedLanguage.code, targetLanguage.code);
          setIsTranslating(false);
        }
      
        const translatedWords = translatedText ? translatedText.split(' ').filter(Boolean) : [];
      
        const newWords = words.map((word, index) => ({
          word,
          timestamp: now,
          translation: showTranslation && translatedWords[index] ? translatedWords[index] : undefined
        }));
      
        setDisplayedWords(newWords);
      } catch (error) {
        console.error('Failed to process words:', error);
        // Still show original words even if translation fails
        const newWords = words.map(word => ({
          word,
          timestamp: now,
          translation: showTranslation ? 'Error translating' : undefined
        }));
        setDisplayedWords(newWords);
      } finally {
        setIsTranslating(false);
      }
    }, debounceTime);
  }, [currentTranscription, showTranslation, translateText, selectedLanguage.code, targetLanguage.code]);
  
  // Clean up old words
  useEffect(() => {
    if (!isListening || displayedWords.length === 0) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      setDisplayedWords(prev => {
        const newWords = prev.filter(({ timestamp }) => {
          return now - timestamp < wordTimeout;
        });
        
        // Add removed words to the set
        const removed = prev.filter(({ timestamp }) => 
          now - timestamp >= wordTimeout
        );
        if (removed.length > 0) {
          setRemovedWords(prev => 
            new Set([...prev, ...removed.map(w => w.word)])
          );
        }
        
        return newWords;
      });
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, [isListening, wordTimeout, displayedWords]);
  
  useEffect(() => {
    updateWords();
  }, [currentTranscription, updateWords]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedWords]);

  if (!isListening && !currentTranscription) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-16">
        <AnimatedBackground />
        <div className="flex flex-col items-center space-y-8 max-w-[90vw] px-8">
          <p className="text-content text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl text-glow-strong text-center pb-10 pt-10">
            Press the microphone button to start live captioning
          </p>
          
          {showTranslation && (
            <>
              <div className="relative w-full flex items-center justify-center my-8">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  className="absolute left-8 -translate-y-6 text-content-secondary text-sm flex items-center gap-2"
                >
                  <span>{selectedLanguage.name}</span>
                  <span className="text-xs">({selectedLanguage.nativeName})</span>
                </motion.span>
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 0.4 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-[90vw] h-[2px] bg-content-secondary"
                />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  className="absolute left-8 translate-y-6 text-content-secondary text-base flex items-center gap-2"
                >
                  <span>{targetLanguage.name}</span>
                  <span className="text-sm">({targetLanguage.nativeName})</span>
                </motion.span>
              </div>
              
              <p className="text-content text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-glow-strong text-center">
                Your translations will appear here
              </p>
            </>
          )}
        </div>
        
        <motion.div
          className="fixed bottom-8 left-8 flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }} 
        >
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-full text-primary transition-colors"
            >
              <Languages size={20} />
              <span className="capitalize min-w-[100px] text-center">
                {showTranslation ? targetLanguage.name : "Translate to..."}
              </span>
              <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700">
                {supportedLanguages
                  .filter(lang => lang.code !== selectedLanguage.code)
                  .map((language) => (
                    <button
                      key={language.code}
                      onClick={() => {
                        setTargetLanguage(language.code);
                        if (!showTranslation) toggleTranslation();
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                        ${language.code === targetLanguage.code ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {language.name} ({language.nativeName})
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16"
    >
      <AnimatedBackground />
      <motion.div
        className="fixed bottom-8 left-8 flex items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-full text-primary transition-colors"
          >
            <Languages size={20} />
            <span className="capitalize">{showTranslation ? targetLanguage.name : "Select Language"}</span>
            <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700">
              {supportedLanguages
                .filter(lang => lang.code !== selectedLanguage.code)
                .map((language) => (
                  <button
                    key={language.code}
                    onClick={() => {
                      setTargetLanguage(language.code);
                      if (!showTranslation) toggleTranslation();
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                      ${language.code === targetLanguage.code ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    {language.name} ({language.nativeName})
                  </button>
                ))
              }
            </div>
          )}
        </div>
      </motion.div>
      <div className="flex flex-col items-center space-y-12 max-w-[90vw] px-8">
        <div className="text-content text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl leading-[1.8] text-glow-strong text-center break-words">
          {displayedWords.length > 0 && currentTranscription ? (
            <AnimatePresence mode="popLayout">
              {displayedWords.map(({ word, timestamp }, index) => (
                <motion.span
                  key={`${word}-${timestamp}-${index}`}
                  className="inline-block mr-2 mb-2"
                  initial={{ 
                    opacity: 0, 
                    scale: 0.5,
                    filter: 'blur(8px)',
                    y: 20
                  }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    filter: 'blur(0px)', 
                    y: 0
                  }}
                  exit={{ 
                    opacity: 0,
                    filter: 'blur(8px)',
                    scale: 0.9,
                    transition: { 
                      duration: 0.8,
                      ease: "easeIn"
                    }
                  }}
                  transition={{ 
                    duration: 0.4,
                    ease: "easeOut",
                    scale: {
                      duration: 0.4,
                      ease: [0.34, 1.56, 0.64, 1]
                    }
                  }}
                  onAnimationComplete={() => {
                    if (removedWords.has(word)) {
                      setRemovedWords(prev => {
                        const next = new Set(prev);
                        next.delete(word);
                        return next;
                      });
                    }
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </AnimatePresence>
          ) : (
            isListening && (
              <span className="inline-flex items-center justify-center w-full animate-pulse-slow">
                Listening...
              </span>
            )
          )}
        </div>
        
        {showTranslation && displayedWords.length > 0 && (
          <>
            <div className="relative w-full flex items-center justify-center my-8">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                className="absolute left-8 -translate-y-6 text-content-secondary text-sm flex items-center gap-2"
              >
                <span>{selectedLanguage.name}</span>
                <span className="text-xs">({selectedLanguage.nativeName})</span>
              </motion.span>
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 0.4 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-[90vw] h-[2px] bg-content-secondary"
              />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                className="absolute left-8 translate-y-6 text-content-secondary text-base flex items-center gap-2"
              >
                <span>{targetLanguage.name}</span>
                <span className="text-sm">({targetLanguage.nativeName})</span>
              </motion.span>
            </div>
            
            <div className="text-content text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl leading-[1.8] text-glow-strong text-center break-words">
              <AnimatePresence mode="popLayout">
                {displayedWords.map(({ translation, timestamp }, index) => (
                  translation && (
                    <motion.span
                      key={`translation-${index}-${timestamp}`}
                      className="inline-block mr-2 mb-2 text-glow-strong text-translation font-normal"
                      initial={{ 
                        opacity: 0, 
                        scale: 0.5,
                        filter: 'blur(8px)',
                        y: 20
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        filter: 'blur(0px)',
                        y: 0
                      }}
                      exit={{ 
                        opacity: 0,
                        filter: 'blur(8px)',
                        scale: 0.9,
                        transition: { 
                          duration: 0.8,
                          ease: "easeIn"
                        }
                      }}
                      transition={{ 
                        duration: 0.4,
                        delay: 0.2,
                        ease: "easeOut",
                        scale: {
                          duration: 0.4,
                          ease: [0.34, 1.56, 0.64, 1]
                        }
                      }}
                    >
                      {translation}
                    </motion.span>
                  )
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CaptionsDisplay;