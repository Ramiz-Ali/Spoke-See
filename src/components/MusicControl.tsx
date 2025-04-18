import React from 'react';
import { Music, Volume2 } from 'lucide-react';
import useAppStore from '../store';
import useBackgroundMusic from '../hooks/useBackgroundMusic';

const MusicControl: React.FC = () => {
  const { audioState, toggleMusic, setVolume } = useAppStore();
  const { isPlaying } = useBackgroundMusic();
  const [isVolumeVisible, setIsVolumeVisible] = React.useState(false);

  return (
    <div className="relative group">
      <button
        onClick={toggleMusic}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
          isPlaying
            ? 'bg-primary text-white'
            : 'bg-primary/20 text-primary hover:bg-primary/30'
        }`}
        title={isPlaying ? 'Stop music' : 'Play background music'}
      >
        <Music size={20} />
        <span className="text-sm">
          {isPlaying ? 'Stop Music' : 'Play Music'}
        </span>
      </button>

      {isPlaying && (
        <div 
          className={`absolute -right-2 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 transition-opacity duration-200 ${
            isVolumeVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onMouseEnter={() => setIsVolumeVisible(true)}
          onMouseLeave={() => setIsVolumeVisible(false)}
        >
          <div className="flex items-center gap-3 min-w-[150px]">
            <Volume2 size={16} className="text-primary" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audioState.volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 w-8">
              {Math.round(audioState.volume * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
export default MusicControl;