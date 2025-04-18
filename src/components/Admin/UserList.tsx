// UserList.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Edit, Trash2, X, User as UserIcon } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  role: string;
  isPremium: boolean;
}

const UserList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || '',
        role: doc.data().role || 'user',
        isPremium: doc.data().isPremium || false,
      }));

      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      isPremium: user.isPremium,
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      const userDoc = doc(db, 'users', editingUser.id);
      await updateDoc(userDoc, editForm);
      setEditingUser(null);
      setEditForm({});
      toast.success('User updated successfully');
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error('Failed to update user');
    }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    try {
      await deleteDoc(doc(db, 'users', deleteUserId));
      setDeleteUserId(null);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.id.includes(search)
  );

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-6xl mx-auto"
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-6xl mx-auto"
      >
        <div className="text-red-600 text-center p-4">{error}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg w-full md:w-96 shadow-sm">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search users by email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-white w-full text-base"
            aria-label="Search users"
          />
        </div>
      </div>
      
      {isMobile ? (
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-gray-300 text-center p-6 text-base">
              {users.length === 0 ? 'No users found' : 'No matching users found'}
            </div>
          ) : (
            filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-700 rounded-lg p-4 shadow-sm hover:bg-gray-600/70 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-600 p-3 rounded-full">
                    <UserIcon size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-lg truncate">{user.email}</div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        user.role === 'admin' 
                          ? 'bg-purple-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {user.role}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        user.isPremium 
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-600 text-white'
                      }`}>
                        {user.isPremium ? 'Premium' : 'Free'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                      aria-label="Edit user"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteUserId(user.id)}
                      className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm"
                      aria-label="Delete user"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-4 text-left text-white font-semibold text-base rounded-tl-lg">Email</th>
                <th className="p-4 text-left text-white font-semibold text-base">User ID</th>
                <th className="p-4 text-left text-white font-semibold text-base">Role</th>
                <th className="p-4 text-left text-white font-semibold text-base">Status</th>
                <th className="p-4 text-left text-white font-semibold text-base rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-gray-700/50 hover:bg-gray-600/70 transition-all duration-200 ${
                    index === filteredUsers.length - 1 ? 'rounded-b-lg' : ''
                  }`}
                >
                  <td className="p-4 text-white text-base border-t border-gray-600 truncate max-w-xs">{user.email}</td>
                  <td className="p-4 text-gray-300 text-sm border-t border-gray-600 font-mono truncate max-w-xs">{user.id}</td>
                  <td className="p-4 border-t border-gray-600">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 border-t border-gray-600">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      user.isPremium 
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-600 text-white'
                    }`}>
                      {user.isPremium ? 'Premium' : 'Free'}
                    </span>
                  </td>
                  <td className="p-4 border-t border-gray-600">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                        aria-label="Edit user"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteUserId(user.id)}
                        className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm"
                        aria-label="Delete user"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-gray-300 text-center text-base border-t border-gray-600 rounded-b-lg">
                    {users.length === 0 ? 'No users found' : 'No matching users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4 shadow-lg"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Edit User</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-white p-1"
                aria-label="Close edit modal"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Email</label>
                <input
                  type="text"
                  value={editingUser.email}
                  disabled
                  className="w-full px-4 py-3 bg-gray-700 text-gray-300 border border-gray-600 rounded-lg text-base shadow-sm"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">User ID</label>
                <input
                  type="text"
                  value={editingUser.id}
                  disabled
                  className="w-full px-4 py-3 bg-gray-700 text-gray-300 border border-gray-600 rounded-lg text-base shadow-sm font-mono"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-base shadow-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Status</label>
                  <select
                    value={editForm.isPremium ? 'premium' : 'free'}
                    onChange={(e) => setEditForm({ ...editForm, isPremium: e.target.value === 'premium' })}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-base shadow-sm"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={() => setEditingUser(null)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white text-base shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-base shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-lg"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
              <button 
                onClick={() => setDeleteUserId(null)}
                className="text-gray-400 hover:text-white p-1"
                aria-label="Close delete modal"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-300 text-base mb-8">
              Are you sure you want to delete this user? This action cannot be undone and will permanently remove all user data.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteUserId(null)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white text-base shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-base shadow-sm"
              >
                Delete User
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default UserList;