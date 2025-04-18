// src/pages/Header.tsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Diamond, LogIn, UserPlus, User, LogOut, Menu, X } from 'lucide-react';
import useAppStore from '../store';

const Header = () => {
  const { currentUser, logout } = useAppStore();
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Handle scroll effect for shadow
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = (): void => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    navigate('/login');
  };

  const handlePremiumClick = (): void => {
    navigate('/premium');
    setIsMenuOpen(false);
  };

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 
        bg-gray-800 text-white 
        transition-all duration-300
        ${hasScrolled ? 'shadow-lg py-2' : 'shadow-md py-3'}
      `}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Website Name with Link to Home */}
        <Link to="/" className="flex items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            Speak & See
          </h1>
        </Link>

        {/* Hamburger Menu Button (Visible on Mobile) */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation Buttons (Hidden on Mobile, Visible on Larger Screens) */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Conditional Element: Premium Badge or Upgrade Button */}
          {currentUser?.isPremium ? (
            <div
              className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-green-500 animate-pulse-glow"
              aria-label="Premium Member Badge"
            >
              <Diamond size={18} className="mr-2 text-white" />
              <span className="text-sm font-semibold text-white">Premium Member</span>
            </div>
          ) : (
            <button
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg hover:opacity-90 transition-opacity"
              onClick={handlePremiumClick}
              aria-label="Upgrade to Premium"
            >
              <Diamond size={18} className="mr-2" />
              <span>Upgrade to Premium</span>
            </button>
          )}

          {/* Auth Buttons */}
          {currentUser ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                aria-label="User profile"
                aria-expanded={isProfileOpen}
              >
                <User size={20} />
              </button>
              {isProfileOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-50 border border-gray-600"
                  role="menu"
                >
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-600 w-full text-left"
                    role="menuitem"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                aria-label="Login"
              >
                <LogIn size={18} className="mr-2" />
                <span>Login</span>
              </Link>
              <Link
                to="/signup"
                className="flex items-center px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                aria-label="Sign up"
              >
                <UserPlus size={18} className="mr-2" />
                <span>Signup</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu (Visible when Menu is Open) */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
            {/* Conditional Element: Premium Badge or Upgrade Button */}
            {currentUser?.isPremium ? (
              <div
                className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-green-500"
                aria-label="Premium Member Badge"
              >
                <Diamond size={18} className="mr-2 text-white" />
                <span className="text-base font-semibold text-white">Premium Member</span>
              </div>
            ) : (
              <button
                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg hover:opacity-90 transition-opacity text-base"
                onClick={handlePremiumClick}
                aria-label="Upgrade to Premium"
              >
                <Diamond size={18} className="mr-2" />
                <span>Upgrade to Premium</span>
              </button>
            )}

            {/* Auth Buttons */}
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-base"
                aria-label="Logout"
              >
                <LogOut size={18} className="mr-2" />
                <span>Logout</span>
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-base"
                  aria-label="Login"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn size={18} className="mr-2" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors text-base"
                  aria-label="Sign up"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserPlus size={18} className="mr-2" />
                  <span>Signup</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;