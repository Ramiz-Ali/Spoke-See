// src/components/Admin/AdminDashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Settings, BarChart2, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface User {
  id: string; // Document ID
  name?: string;
  email: string;
  isPremium: boolean;
  role: string;
  lastLogin: Timestamp | null;
  createdAt: Timestamp;
}

interface Activity {
  userId: string;
  action: string;
  timestamp: Timestamp;
}

interface DisplayActivity {
  user: string;
  action: string;
  time: string;
  id: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [freeUsers, setFreeUsers] = useState<number>(0);
  const [premiumUsers, setPremiumUsers] = useState<number>(0);
  const [totalAdmins, setTotalAdmins] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<DisplayActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cache user data to avoid repeated Firestore reads
  const [userCache, setUserCache] = useState<Map<string, { name?: string; email: string }>>(
    new Map()
  );

  // Fetch user data and cache it
  const fetchUser = useCallback(async (userId: string) => {
    if (userCache.has(userId)) {
      const cachedUser = userCache.get(userId)!;
      return cachedUser.name || cachedUser.email || userId;
    }

    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as User;
        setUserCache((prev) =>
          new Map(prev).set(userId, {
            name: userData.name,
            email: userData.email,
          })
        );
        return userData.name || userData.email || userId;
      }
      return userId;
    } catch (err) {
      console.error(`Error fetching user ${userId}:`, err);
      return userId;
    }
  }, [userCache]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsRefreshing(true);

      // Fetch users data
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users: User[] = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      // Calculate stats
      const total = users.length;
      setTotalUsers(total);

      const free = users.filter((user) => !user.isPremium).length;
      setFreeUsers(free);

      const premium = users.filter((user) => user.isPremium).length;
      setPremiumUsers(premium);

      const admins = users.filter((user) => user.role === 'admin').length;
      setTotalAdmins(admins);

      // Fetch the latest 4 activities with real-time updates
      const activityQuery = query(
        collection(db, 'activityLogs'),
        orderBy('timestamp', 'desc'),
        limit(4)
      );

      const unsubscribe = onSnapshot(activityQuery, async (snapshot) => {
        const activities: Activity[] = snapshot.docs.map(
          (doc) => doc.data() as Activity
        );

        const activityData = await Promise.all(
          activities.map(async (activity) => {
            const userName = await fetchUser(activity.userId);

            const timeDiff = (Date.now() - activity.timestamp.toDate().getTime()) / 1000;
            let time: string;
            if (timeDiff < 60) {
              time = `${Math.round(timeDiff)} seconds ago`;
            } else if (timeDiff < 3600) {
              time = `${Math.round(timeDiff / 60)} minutes ago`;
            } else if (timeDiff < 86400) {
              time = `${Math.round(timeDiff / 3600)} hours ago`;
            } else {
              time = `${Math.round(timeDiff / 86400)} days ago`;
            }

            return {
              id: `${activity.userId}-${activity.timestamp.toMillis()}`,
              user: userName,
              action: activity.action,
              time,
            };
          })
        );
        setRecentActivities(activityData);
      }, (err) => {
        console.error('Error fetching activities:', err);
        setError('Failed to load dashboard data. Please try again later.');
        toast.error('Failed to load dashboard data.', {
          style: {
            background: '#1F2937',
            color: '#F3F4F6',
            borderRadius: '8px',
          },
        });
      });

      setLastUpdated(new Date());
      setLoading(false);
      setIsRefreshing(false);

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
      toast.error('Failed to load dashboard data.', {
        style: {
          background: '#1F2937',
          color: '#F3F4F6',
          borderRadius: '8px',
        },
      });
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
  };

  const handleSystemSettings = () => {
    navigate('/admin/settings');
  };

  const handleAnalytics = () => {
    navigate('/admin/activities');
  };

  const handleViewMoreActivities = () => {
    navigate('/admin/activities');
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-semibold text-gray-100 tracking-tight">
            Dashboard
          </h2>
          <SkeletonButton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-gray-800/70 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-100 mb-4 tracking-tight">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <SkeletonActivityItem key={i} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-1 h-fit bg-gray-800/70 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-100 mb-4 tracking-tight">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <SkeletonButton />
              <SkeletonButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        <AlertTriangle size={24} className="text-red-400 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-gray-800/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl max-w-5xl mx-auto border border-gray-700/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-semibold text-gray-100 tracking-tight">
          Admin Dashboard
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 flex items-center gap-1">
            <Clock size={16} />
            Last updated: {lastUpdated?.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600 transition-colors"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw
              className={`h-5 w-5 text-gray-300 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={totalUsers.toLocaleString()}
          change={calculateChange(totalUsers, totalUsers > 0 ? totalUsers - 10 : 0)}
          icon={<Users size={20} className="text-blue-400" />}
          gradient="from-blue-600 to-blue-400"
        />
        <StatCard
          title="Free Users"
          value={freeUsers.toLocaleString()}
          change={calculateChange(freeUsers, freeUsers > 0 ? freeUsers - 5 : 0)}
          icon={<Users size={20} className="text-green-400" />}
          gradient="from-green-600 to-green-400"
        />
        <StatCard
          title="Premium Users"
          value={premiumUsers.toLocaleString()}
          change={calculateChange(premiumUsers, premiumUsers > 0 ? premiumUsers - 2 : 0)}
          icon={<Users size={20} className="text-indigo-400" />}
          gradient="from-indigo-600 to-indigo-400"
        />
        <StatCard
          title="Total Admins"
          value={totalAdmins.toLocaleString()}
          change={calculateChange(totalAdmins, totalAdmins > 0 ? totalAdmins - 1 : 0)}
          icon={<Users size={20} className="text-orange-400" />}
          gradient="from-orange-600 to-orange-400"
        />
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-gray-800/70 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-100 tracking-tight">
              Recent Activity
            </h3>
            <button
              onClick={handleViewMoreActivities}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              aria-label="View more activities"
            >
              View More
            </button>
          </div>
          <div className="space-y-4">
            <AnimatePresence>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    user={activity.user}
                    action={activity.action}
                    time={activity.time}
                  />
                ))
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-gray-400 text-center text-sm"
                >
                  No recent activity available.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1 h-fit bg-gray-800/70 rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-100 mb-4 tracking-tight">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalytics}
              className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-gray-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="View Activities"
            >
              <span>Activities</span>
              <BarChart2 size={16} className="text-blue-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSystemSettings}
              className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-gray-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="System Settings"
            >
              <span>Settings</span>
              <Settings size={16} className="text-blue-400" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// StatCard Component
const StatCard: React.FC<{
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  gradient: string;
}> = ({ title, value, change, icon, gradient }) => {
  const isPositive = change.startsWith('+');

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)' }}
      className={`relative bg-gray-800/70 rounded-xl p-5 shadow-sm flex items-center justify-between transition-all duration-300 overflow-hidden border border-gray-700/50 group`}
    >
      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
      />
      <div className="relative z-10">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className="text-2xl font-semibold mt-1 text-gray-100">{value}</p>
        <p className={`text-sm mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {change}
        </p>
      </div>
      <div className="relative z-10 h-12 w-12 flex items-center justify-center">
        {icon}
      </div>
    </motion.div>
  );
};

// ActivityItem Component
const ActivityItem: React.FC<{
  user: string;
  action: string;
  time: string;
}> = ({ user, action, time }) => {
  const getActionStyle = (action: string) => {
    switch (action.toLowerCase()) {
      case 'logged in':
        return 'text-cyan-400';
      case 'created a new account':
        return 'text-green-400';
      case 'upgraded to premium':
        return 'text-indigo-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="flex items-center bg-gray-800/50 rounded-lg p-4 shadow-sm hover:bg-gray-700/50 transition-all duration-300"
    >
      <div className="flex flex-col items-center mr-4">
        <div className="h-4 w-4 bg-blue-400 rounded-full"></div>
        <div className="w-0.5 h-full bg-blue-400/30 mt-2 rounded-full"></div>
      </div>
      <div className="flex-1">
        <p className="text-gray-100 font-semibold text-lg">{user}</p>
        <p className={`text-base ${getActionStyle(action)} font-medium`}>{action}</p>
        <p className="text-sm text-gray-400 mt-1">{time}</p>
      </div>
    </motion.div>
  );
};

// Skeleton Components for Loading State
const SkeletonStatCard: React.FC = () => (
  <div className="bg-gray-800/70 rounded-xl p-5 shadow-sm flex items-center justify-between">
    <div className="space-y-2">
      <div className="h-4 w-24 bg-gray-700/50 rounded animate-pulse" />
      <div className="h-8 w-16 bg-gray-700/50 rounded animate-pulse" />
      <div className="h-4 w-12 bg-gray-700/50 rounded animate-pulse" />
    </div>
    <div className="h-12 w-12 bg-gray-700/50 rounded-full animate-pulse" />
  </div>
);

const SkeletonActivityItem: React.FC = () => (
  <div className="flex items-center bg-gray-800/50 rounded-lg p-4 shadow-sm">
    <div className="flex flex-col items-center mr-4">
      <div className="h-4 w-4 bg-gray-700/50 rounded-full animate-pulse" />
      <div className="w-0.5 h-12 bg-gray-700/50 rounded-full mt-2 animate-pulse" />
    </div>
    <div className="flex-1 space-y-2">
      <div className="h-5 w-32 bg-gray-700/50 rounded animate-pulse" />
      <div className="h-4 w-48 bg-gray-700/50 rounded animate-pulse" />
      <div className="h-4 w-24 bg-gray-700/50 rounded animate-pulse" />
    </div>
  </div>
);

const SkeletonButton: React.FC = () => (
  <div className="h-10 w-24 bg-gray-700/50 rounded-lg animate-pulse" />
);

export default AdminDashboard;