// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { auth, db } from '../firebase';
import useAppStore from '../store';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sign in the user with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user data from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // Update the user's lastLogin timestamp
        await updateDoc(doc(db, 'users', userDoc.id), {
          lastLogin: serverTimestamp(),
        });

        // Set user in the app store
        setUser({
          uid: user.uid,
          email: user.email,
          name: userData.name || '',
          isPremium: userData.isPremium || false,
          role: userData.role || 'user',
        });

        // Log the "logged in" activity to activityLogs
        await addDoc(collection(db, 'activityLogs'), {
          userId: user.uid,
          action: 'logged in',
          timestamp: serverTimestamp(),
        });

        toast.success('Login successful!');

        // Redirect logic
        if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/'); // All non-admin users go to home page, regardless of premium status
        }
      } else {
        toast.error('User data not found!');
        setError('User data not found in database');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      switch (err.code) {
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/user-not-found':
          setError('No user found with this email');
          break;
        case 'auth/invalid-email':
          setError('Invalid email format');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts, please try again later');
          break;
        default:
          setError('Login failed. Please try again.');
      }
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className='bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md'>
      <h2 className='text-2xl font-bold text-center text-white mb-6'>
        Login To Your Account
      </h2>

      {error && (
        <div className='mb-4 p-3 bg-red-600 text-white rounded-lg text-sm'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label htmlFor='email' className='block text-gray-300 mb-2'>
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

        <div className='mb-6 relative'>
          <label htmlFor='password' className='block text-gray-300 mb-2'>
            Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
          <button
            type='button'
            onClick={togglePasswordVisibility}
            className='absolute right-3 top-11 text-gray-400 hover:text-gray-200 focus:outline-none'
          >
            {showPassword ? (
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                ></path>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                ></path>
              </svg>
            ) : (
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                ></path>
              </svg>
            )}
          </button>
        </div>

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
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>
      </form>

      <div className='mt-6 text-center text-gray-400'>
        Don't have an account?{' '}
        <button
          onClick={() => navigate('/signup')}
          className='text-blue-400 hover:text-blue-300 font-medium'
        >
          Sign up
        </button>
      </div>
    </div>
  );
};

export default Login;