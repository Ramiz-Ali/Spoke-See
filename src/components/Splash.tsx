// src/pages/Splash.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Diamond, Mic, Globe, BookOpen, Volume2, Users } from 'lucide-react'; // Icons for features
import { motion } from 'framer-motion';
import useAppStore from '../store';
import { toast } from 'react-hot-toast';

const Splash = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();

  // Redirect premium users to the dashboard
  useEffect(() => {
    if (currentUser?.isPremium) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleUpgradeClick = () => {
    if (!currentUser) {
      toast.error('Please log in to upgrade to Premium!');
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } else {
      navigate('/premium');
    }
  };

  // Animation variants for fading in elements
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  // Animation for the CTA button
  const pulse = {
    scale: [1, 1.05, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  };

  return (
    <div className="mb-10 mt-20  text-white flex flex-col items-center px-4 py-12 bg-gray-900">
      {/* Hero Section */}
      <motion.div
        className="text-center max-w-3xl mb-12"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-4">
          Welcome to Speak & See
        </h1>
        <p className="text-lg md:text-xl text-gray-300">
          Experience the future of live captioning with AI-powered transcription, translation, and more. Go Premium to unlock the full experience!
        </p>
      </motion.div>

      {/* Features Section */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mb-12"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 },
          },
        }}
      >
        {/* Feature 1: Dual Microphone Support */}
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-start space-x-4 hover:shadow-xl transition-shadow"
          variants={fadeIn}
        >
          <Mic size={36} className="text-purple-500" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Dual Microphone Support</h3>
            <p className="text-gray-300">
              Transcribe two speakers at once with distinct colors and names—perfect for interviews or meetings.{' '}
              <span className="text-blue-400 font-medium">[Premium]</span>
            </p>
          </div>
        </motion.div>

        {/* Feature 2: Real-Time Translation */}
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-start space-x-4 hover:shadow-xl transition-shadow"
          variants={fadeIn}
        >
          <Globe size={36} className="text-purple-500" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Real-Time Translation</h3>
            <p className="text-gray-300">
              Instantly translate captions into over 10 languages in real time.{' '}
              <span className="text-blue-400 font-medium">[Premium]</span>
            </p>
          </div>
        </motion.div>

        {/* Feature 3: AI Summarization */}
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-start space-x-4 hover:shadow-xl transition-shadow"
          variants={fadeIn}
        >
          <BookOpen size={36} className="text-purple-500" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">AI Summarization</h3>
            <p className="text-gray-300">
              Get concise summaries of your transcriptions with AI—up to 500 words free, full summary with Premium.{' '}
              <span className="text-blue-400 font-medium">[Premium]</span>
            </p>
          </div>
        </motion.div>

        {/* Feature 4: Unlimited Transcriptions */}
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-start space-x-4 hover:shadow-xl transition-shadow"
          variants={fadeIn}
        >
          <Volume2 size={36} className="text-purple-500" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Unlimited Transcriptions</h3>
            <p className="text-gray-300">
              Transcribe without limits—available exclusively with a Premium subscription.{' '}
              <span className="text-blue-400 font-medium">[Premium]</span>
            </p>
          </div>
        </motion.div>

        {/* Feature 5: Live Captions for Groups */}
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-start space-x-4 hover:shadow-xl transition-shadow"
          variants={fadeIn}
        >
          <Users size={36} className="text-purple-500" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Live Captions for Groups</h3>
            <p className="text-gray-300">
              Share live captions with participants via a code—great for churches, talks, or events.{' '}
              <span className="text-blue-400 font-medium">[Premium]</span>
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Testimonial Section */}
      <motion.div
        className="max-w-3xl mb-12 text-center"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
          What Our Users Say
        </h2>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <p className="text-gray-300 italic">
            "Speak & See has transformed our meetings! The dual mic support and real-time translation make it so easy to communicate across languages."
          </p>
          <p className="mt-4 text-gray-400 font-semibold">— Sarah M., Event Organizer</p>
        </div>
      </motion.div>

      {/* Call-to-Action Section */}
      <motion.div
        className="text-center"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
          Unlock the Full Power of Speak & See
        </h2>
        <motion.button
          onClick={handleUpgradeClick}
          className="flex items-center justify-center mx-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg hover:opacity-90 transition-opacity text-white text-lg font-medium"
          animate={pulse}
          aria-label="Get Premium Now"
        >
          <Diamond size={24} className="mr-2" />
          Get Premium Now
        </motion.button>
        {!currentUser && (
          <p className="mt-4 text-gray-400">
            New here?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-blue-400 hover:text-blue-300"
              aria-label="Sign Up"
            >
              Sign Up
            </button>{' '}
            or{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:text-blue-300"
              aria-label="Log In"
            >
              Log In
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Splash;