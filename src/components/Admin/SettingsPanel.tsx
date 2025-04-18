// src/components/Admin/SettingsPanel.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const fonts = ['Arial', 'Open Sans', 'Roboto', 'Helvetica'];
const themes = ['Light', 'Dark', 'High Contrast'];

const SettingsPanel: React.FC = () => {
  const [selectedFont, setSelectedFont] = useState(fonts[0]);
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [isFontOpen, setIsFontOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const handleSave = () => {
    console.log('Saving:', { selectedFont, selectedTheme });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-lg p-6 max-w-lg mx-auto"
    >
      <h2 className="text-content text-2xl sm:text-3xl text-glow-strong mb-6 text-center">
        Default Settings
      </h2>
      <div className="relative mb-6">
        <label className="text-content text-lg mb-2 block">Default Font</label>
        <button
          onClick={() => setIsFontOpen(!isFontOpen)}
          className="flex items-center justify-between w-full px-4 py-2 bg-primary/20 rounded-full text-content hover:bg-primary/30"
          aria-expanded={isFontOpen}
        >
          <span>{selectedFont}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${isFontOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isFontOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700 z-10">
            {fonts.map((font) => (
              <button
                key={font}
                onClick={() => {
                  setSelectedFont(font);
                  setIsFontOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-content"
              >
                {font}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="relative mb-6">
        <label className="text-content text-lg mb-2 block">Default Theme</label>
        <button
          onClick={() => setIsThemeOpen(!isThemeOpen)}
          className="flex items-center justify-between w-full px-4 py-2 bg-primary/20 rounded-full text-content hover:bg-primary/30"
          aria-expanded={isThemeOpen}
        >
          <span>{selectedTheme}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${isThemeOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isThemeOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700 z-10">
            {themes.map((theme) => (
              <button
                key={theme}
                onClick={() => {
                  setSelectedTheme(theme);
                  setIsThemeOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-content"
              >
                {theme}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 bg-primary/10 rounded-lg mb-6">
        <p
          className="text-content text-glow-strong text-lg sm:text-xl text-center"
          style={{ fontFamily: selectedFont }}
        >
          Preview: This is how captions will look.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSave}
        className="w-full px-6 py-2 bg-primary/20 hover:bg-primary/30 rounded-full text-primary text-lg"
      >
        Save Settings
      </motion.button>
    </motion.div>
  );
};

export default SettingsPanel;