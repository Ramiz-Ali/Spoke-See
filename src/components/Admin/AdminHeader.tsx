import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';


interface AdminData {
  name: string;
  email: string;
  // Add other admin fields as needed
}

const AdminHeader: React.FC<{ toggleTheme: () => void, isDarkMode: boolean }> = () => {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setAdminData(userDoc.data() as AdminData);
          }
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A';
  };

  if (loading) {
    return (
      <motion.header
        className="fixed top-0 left-0 right-0 z-20 bg-gray-800/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-700 py-4 px-6"
      >
        <div className="max-w-[90vw] mx-auto flex items-center justify-between">
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-700"></div>
            <div>
              <div className="h-4 w-40 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </motion.header>
    );
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-20 bg-gray-800/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-700 py-4 px-6"
    >
      <div className="max-w-[90vw] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {getInitials(adminData?.name)}
            </span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {adminData?.name ? `Welcome back, ${adminData.name}` : 'Welcome back, Admin'}
            </h1>
            <p className="text-sm text-gray-400">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
        
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-gray-300 font-medium text-sm">
              {getInitials(adminData?.name)}
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default AdminHeader;