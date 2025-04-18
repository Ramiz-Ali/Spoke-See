// src/components/ControlButtons.tsx
import React from "react";
import { Mic, MicOff, Settings, MessageSquare, Loader2, Users, Sun, Moon } from "lucide-react";
import useAppStore from "../store";

const ControlButtons: React.FC = () => {
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [showGroupMode, setShowGroupMode] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false); // State for dropdown
  const isMobileRef = React.useRef<boolean>(false);
  const settingsRef = React.useRef<HTMLDivElement>(null); // Ref for dropdown

  const {
    isListening,
    setListening,
    setPopoutState,
    popoutState,
    savedTranscriptions,
    isDualMicActive,
    setDualMicActive,
    themeMode,
    toggleTheme,
    supportedLanguages,
    selectedLanguage,
    setSelectedLanguage,
  } = useAppStore();

  const latestTranscription = savedTranscriptions[savedTranscriptions.length - 1];

  React.useEffect(() => {
    isMobileRef.current = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleListening = async () => {
    setIsTransitioning(true);
    const transitionDelay = isMobileRef.current ? 50 : 150;
    await new Promise((resolve) => setTimeout(resolve, transitionDelay));
    setListening(!isListening);
    setTimeout(() => setIsTransitioning(false), isMobileRef.current ? 100 : 300);
  };

  const toggleGroupMode = () => {
    setDualMicActive(!isDualMicActive);
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleLanguageChange = (language: typeof supportedLanguages[0]) => {
    setSelectedLanguage(language);
  };

  return (
    <div className="fixed bottom-8 right-8 flex gap-4 items-center">
      <div className="flex gap-4">

        {/* Mic Button */}
        <div className="relative group">
          <button
            onClick={toggleListening}
            disabled={isTransitioning}
            className={`w-16 h-16 rounded-full flex items-center justify-center transform transition-all duration-300 ease-out
              ${isMobileRef.current ? "" : "hover:scale-105"} 
              active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg hover:shadow-xl
              ${isListening ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary-dark"} 
              text-white`}
            style={{
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
              WebkitAppearance: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          >
            {isTransitioning ? (
              <Loader2 size={24} className="animate-spin" />
            ) : isListening ? (
              <MicOff size={24} className="animate-in fade-in" />
            ) : (
              <Mic size={24} className="animate-in fade-in" />
            )}
          </button>

          {!isListening && latestTranscription && (
            <div className="absolute bottom-full right-0 mb-4 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 relative">
                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45" />
                <div className="flex items-start gap-3">
                  <MessageSquare size={16} className="text-primary" />
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Latest Transcription
                    </div>
                    <div className="text-sm text-gray-800 dark:text-white line-clamp-3">
                      {latestTranscription.text}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Users Button */}
        <div className="relative group">
          <button
            onClick={toggleGroupMode}
            className={`w-16 h-16 rounded-full flex items-center justify-center transform transition-all duration-300 ease-out
              ${isMobileRef.current ? "" : "hover:scale-105"} 
              active:scale-95 shadow-lg hover:shadow-xl
              ${isDualMicActive ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-600 hover:bg-gray-500"} 
              text-white`}
          >
            <Users size={24} />
          </button>
        </div>

      </div>

      {/* Settings Button with Dropdown */}
      <div className="relative" ref={settingsRef}>
        <button
          onClick={handleSettingsClick}
          className={`w-16 h-16 rounded-full flex items-center justify-center transform transition-all duration-300 ease-out active:scale-95
            ${popoutState !== "hidden" || isSettingsOpen ? "bg-primary-dark" : "bg-gray-700 hover:bg-gray-600"} 
            text-white shadow-lg transition-all`}
        >
          <Settings size={24} />
        </button>

        {/* Settings Dropdown */}
        {isSettingsOpen && (
          <div className="absolute bottom-full right-0 mb-4 w-64 bg-gray-800 rounded-lg shadow-lg p-4 text-white border border-gray-700">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm">Theme</span>
              <button
                onClick={handleThemeToggle}
                className="flex items-center px-2 py-1 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
              >
                {themeMode === "dark" ? (
                  <Sun size={16} className="mr-1" />
                ) : (
                  <Moon size={16} className="mr-1" />
                )}
                {themeMode === "dark" ? "Light" : "Dark"}
              </button>
            </div>

            {/* Language Dropdown */}
            <div>
              <label htmlFor="language" className="text-sm block mb-2">Language</label>
              <select
                id="language"
                value={selectedLanguage.code}
                onChange={(e) => {
                  const selected = supportedLanguages.find(lang => lang.code === e.target.value);
                  if (selected) handleLanguageChange(selected);
                }}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {supportedLanguages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name} ({language.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlButtons;