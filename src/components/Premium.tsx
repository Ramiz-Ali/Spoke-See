// src/pages/Premium.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Diamond } from 'lucide-react';
import useAppStore from '../store';
import { toast } from 'react-hot-toast';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Premium = () => {
  const { currentUser, upgradeToPremium, checkPremiumStatus } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check premium status on mount
  useEffect(() => {
    if (currentUser) {
      checkPremiumStatus();
    }
  }, [currentUser, checkPremiumStatus]);

  const handleUpgrade = async () => {
    if (!currentUser) {
      toast.error('Please log in to upgrade to Premium!');
      setTimeout(() => {
        navigate('/login');
      }, 1000);
      return;
    }

    setIsLoading(true);
    try {
      // Upgrade the user to premium (assumed to update Firestore and app store)
      await upgradeToPremium();

      // Log the "upgraded to premium" activity to activityLogs
      await addDoc(collection(db, 'activityLogs'), {
        userId: currentUser.uid,
        action: 'upgraded to premium',
        timestamp: serverTimestamp(),
      });

      toast.success('Upgraded to Premium successfully!');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      console.error('Error upgrading to premium:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upgrade to Premium');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-8 mt-14 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-2xl font-bold text-center text-white mb-6">
        Upgrade to <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">Premium</span>
      </h2>

      <div className="text-center text-gray-300 mb-8">
        <p>Unlock exclusive features with Speak & See Premium!</p>
        <p className="mt-2">Enjoy advanced transcription, dual mic support, and more.</p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center text-gray-200">
          <Diamond size={20} className="text-purple-500 mr-3" />
          <span>Unlimited transcriptions</span>
        </div>
        <div className="flex items-center text-gray-200">
          <Diamond size={20} className="text-purple-500 mr-3" />
          <span>Advanced grammar checking</span>
        </div>
        <div className="flex items-center text-gray-200">
          <Diamond size={20} className="text-purple-500 mr-3" />
          <span>Real-time translation in 10+ languages</span>
        </div>
        <div className="flex items-center text-gray-200">
          <Diamond size={20} className="text-purple-500 mr-3" />
          <span>Dual microphone support</span>
        </div>
        <div className="flex items-center text-gray-200">
          <Diamond size={20} className="text-purple-500 mr-3" />
          <span>Priority customer support</span>
        </div>
      </div>

      <button
        onClick={handleUpgrade}
        disabled={isLoading || (currentUser && currentUser.isPremium)}
        className={`w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 text-white py-2 px-4 rounded-lg transition-colors flex justify-center items-center ${
          isLoading || (currentUser && currentUser.isPremium) ? 'opacity-75 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? (
          <>
            <span className="animate-spin mr-2">↻</span>
            Upgrading...
          </>
        ) : currentUser && currentUser.isPremium ? (
          'Already Premium'
        ) : (
          <>
            <Diamond size={18} className="mr-2" />
            Upgrade Now
          </>
        )}
      </button>

      <div className="mt-6 text-center text-gray-400">
        <button
          onClick={() => navigate('/')}
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default Premium;