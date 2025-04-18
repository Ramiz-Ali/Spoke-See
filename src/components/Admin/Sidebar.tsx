// src/components/Admin/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Activity, 
  Settings, 
  Shield,
  BarChart2,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store'; // Import useAppStore

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAppStore(); // Destructure logout function

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2, path: '/admin/dashboard' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'activities', label: 'Activities', icon: Activity, path: '/admin/activities' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
  
  ];

  const handleNavClick = (id: string, path: string) => {
    setActiveTab(id);
    navigate(path);
  };

  const handleLogout = () => {
    logout(); // Clear currentUser
    navigate('/login'); // Redirect to login
  };

  return (
    <motion.aside
      className={`fixed top-0 left-0 h-full bg-gray-800/90 backdrop-blur-md border-r border-gray-700 z-20 pt-20 ${
        isMobile ? 'px-2 w-16' : 'px-4 w-64'
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex mt-4 flex-col h-full">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item.id, item.path)}
              whileHover={{ scale: isMobile ? 1.05 : 1, x: isMobile ? 0 : 5 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center w-full ${
                isMobile ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              } rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-primary/30 text-primary'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}
              aria-label={isMobile ? item.label : undefined}
            >
              <item.icon 
                size={20} 
                className={activeTab === item.id ? "text-primary" : "text-gray-400"} 
              />
              {!isMobile && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </motion.button>
          ))}
        </nav>

        <div className={`mt-auto mb-6 ${isMobile ? 'flex justify-center' : ''}`}>
          <motion.button
            whileHover={{ scale: isMobile ? 1.05 : 1, x: isMobile ? 0 : 5 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center w-full ${
              isMobile ? 'justify-center p-3' : 'gap-3 px-4 py-3'
            } rounded-lg text-gray-300 hover:bg-gray-700/50`}
            aria-label={isMobile ? "Logout" : undefined}
            onClick={handleLogout} // Updated to use handleLogout
          >
            <LogOut size={20} className="text-gray-400" />
            {!isMobile && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;