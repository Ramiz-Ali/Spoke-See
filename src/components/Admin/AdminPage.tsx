// src/pages/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import Sidebar from './Sidebar';
import UserList from './UserList';
import SettingsPanel from './SettingsPanel';
import AdminDashboard from './AdminDashboard';
import AdminActivities from './AdminActivities';
import useAppStore from '../../store';

const AdminPage: React.FC = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // Changed default to 'dashboard'

  useEffect(() => {
    const pathToTab: { [key: string]: string } = {
      '/admin/dashboard': 'dashboard',
      '/admin/users': 'users',
      '/admin/settings': 'settings',
      '/admin/analytics': 'analytics',
      '/admin/activities': 'activities',
      '/admin/security': 'security',
    };

    const currentPath = location.pathname;
    const currentTab = pathToTab[currentPath] || 'dashboard'; // Changed fallback to 'dashboard'

    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [location.pathname]);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
          <p className="text-gray-700">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          const routes: { [key: string]: string } = {
            dashboard: '/admin/dashboard',
            users: '/admin/users',
            activities: '/admin/activities',
            security: '/admin/security',
            settings: '/admin/settings',
            analytics: '/admin/analytics',
          };
          navigate(routes[tab] || '/admin/dashboard'); // Changed fallback to '/admin/dashboard'
        }}
      />
      <AdminHeader />
      <main className="pt-24 lg:pl-64 pb-8 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserList />} />
            <Route path="settings" element={<SettingsPanel />} />
            <Route path="activities" element={<AdminActivities />} />
            <Route path="/" element={<AdminDashboard />} /> {/* Changed to AdminDashboard */}
            <Route path="*" element={<AdminDashboard />} /> {/* Changed to AdminDashboard */}
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;