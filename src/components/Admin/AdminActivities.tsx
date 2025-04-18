// src/components/Admin/AdminActivities.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface Activity {
  userId: string;
  action: string;
  timestamp: Timestamp;
}

interface DisplayActivity {
  id: string;
  user: string;
  action: string;
  time: string;
}

const AdminActivities: React.FC = () => {
  const [activities, setActivities] = useState<DisplayActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<DisplayActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        const activityQuery = query(
          collection(db, 'activityLogs'),
          orderBy('timestamp', 'desc'),
          limit(10)
        );

        const unsubscribe = onSnapshot(activityQuery, async (snapshot) => {
          const activitiesData: Activity[] = snapshot.docs.map(
            (doc) => doc.data() as Activity
          );

          const activityData = await Promise.all(
            activitiesData.map(async (activity) => {
              // Fetch user document by document ID
              let userName = 'Unknown User';
              try {
                const userDocRef = doc(db, 'users', activity.userId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                  const userData = userDocSnap.data();
                  // Use name if available, otherwise fall back to email or userId
                  userName = userData.name || userData.email || activity.userId;
                }
              } catch (err) {
                console.error(`Error fetching user ${activity.userId}:`, err);
                // Fallback to userId if user document fetch fails
                userName = activity.userId;
              }

              // Calculate time difference for display
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

          setActivities(activityData);
          setFilteredActivities(activityData);
          setLoading(false);
        }, (err) => {
          console.error('Error fetching activities:', err);
          setError('Failed to load activities. Please try again later.');
          toast.error('Failed to load activities.');
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error('Error setting up activities listener:', err);
        setError('Failed to load activities. Please try again later.');
        toast.error('Failed to load activities.');
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  useEffect(() => {
    const filtered = activities.filter((activity) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        activity.user.toLowerCase().includes(searchLower) ||
        activity.action.toLowerCase().includes(searchLower)
      );
    });
    setFilteredActivities(filtered);
  }, [searchQuery, activities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-300">
        <div className="animate-pulse">Loading activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-gray-900 rounded-xl p-8 shadow-lg max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-16 justify-between mb-8">
        <h2 className="text-2xl font-bold text-white tracking-wide">
          Recent Activities
        </h2>
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800/50 text-white placeholder-gray-400 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {filteredActivities.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-400 text-center text-sm"
            >
              No activities found.
            </motion.p>
          ) : (
            filteredActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                user={activity.user}
                action={activity.action}
                time={activity.time}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

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
      className="flex items-center bg-gray-800/70 rounded-lg p-4 shadow-sm hover:bg-gray-700/70 transition-all duration-300"
    >
      <div className="flex flex-col items-center mr-4">
        <Clock size={18} className="text-blue-400" />
        <div className="w-0.5 h-full bg-blue-400/30 mt-2 rounded-full"></div>
      </div>

      <div className="flex-1">
        <p className="text-white font-semibold text-lg">{user}</p>
        <p className={`text-base ${getActionStyle(action)} font-medium`}>{action}</p>
        <p className="text-sm text-gray-400 mt-1">{time}</p>
      </div>
    </motion.div>
  );
};

export default AdminActivities;