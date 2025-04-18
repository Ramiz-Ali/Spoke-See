// src/pages/Signup.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import useAppStore from '../store';
import { auth, db } from '../firebase';
import { toast } from 'react-hot-toast';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAppStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      toast.error("Passwords don't match");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Save user data to Firestore with default 'user' role
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid, // Add uid explicitly for consistency
        name,
        email,
        createdAt: serverTimestamp(), // Use serverTimestamp for consistency
        lastLogin: null, // Set to null since the user hasn't logged in yet
        isPremium: false, // Default to non-premium
        role: 'user', // Default to regular user role
      });

      // Log the "created a new account" activity to activityLogs
      await addDoc(collection(db, 'activityLogs'), {
        userId: user.uid,
        action: 'created a new account',
        timestamp: serverTimestamp(),
      });

      // Update the app store with the new user data
      setUser({
        uid: user.uid,
        email,
        name,
        isPremium: false,
        role: 'user',
      });

      toast.success('Account created successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      if (err instanceof Error) {
        switch ((err as any).code) {
          case 'auth/email-already-in-use':
            setError('This email is already in use');
            toast.error('This email is already in use');
            break;
          case 'auth/invalid-email':
            setError('Invalid email format');
            toast.error('Invalid email format');
            break;
          case 'auth/weak-password':
            setError('Password should be at least 6 characters');
            toast.error('Password should be at least 6 characters');
            break;
          default:
            setError('Registration failed. Please try again.');
            toast.error('Registration failed');
        }
      } else {
        setError('Registration failed');
        toast.error('Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='bg-gray-800 p-8 mt-20 mb-10 rounded-lg shadow-lg w-full max-w-md'>
      <h2 className='text-2xl font-bold text-center text-white mb-6'>
        Create an Account
      </h2>
      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label
            htmlFor='name'
            className='block text-gray-300 mb-2'
          >
            Name
          </label>
          <input
            type='text'
            id='name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='mb-4'>
          <label
            htmlFor='email'
            className='block text-gray-300 mb-2'
          >
            Email
          </label>
          <input
            type='email'
            id='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='mb-4'>
          <label
            htmlFor='password'
            className='block text-gray-300 mb-2'
          >
            Password
          </label>
          <input
            type='password'
            id='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
            minLength={6}
          />
        </div>
        <div className='mb-6'>
          <label
            htmlFor='confirmPassword'
            className='block text-gray-300 mb-2'
          >
            Confirm Password
          </label>
          <input
            type='password'
            id='confirmPassword'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        {error && <p className='text-red-500 text-sm mb-4'>{error}</p>}
        <button
          type='submit'
          disabled={isLoading}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex justify-center items-center ${
            isLoading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <>
              <span className='animate-spin mr-2'>↻</span>
              Signing Up...
            </>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>
      <div className='mt-4 text-center text-gray-400'>
        Already have an account?{' '}
        <button
          onClick={() => navigate('/login')}
          className='text-blue-400 hover:text-blue-300'
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Signup;