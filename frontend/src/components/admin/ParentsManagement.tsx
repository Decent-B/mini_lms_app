import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { Parent, Student } from '../../types';

interface ParentWithChildren extends Parent {
  students: Student[];
}

const ParentsManagement = () => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedParentId, setExpandedParentId] = useState<number | null>(null);
  const [childrenData, setChildrenData] = useState<{ [key: number]: Student[] }>({});
  const [loadingChildren, setLoadingChildren] = useState<{ [key: number]: boolean }>({});
  
  // Add parent modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const response = await api.get<Parent[]>('/parents');
      setParents(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch parents');
    } finally {
      setLoading(false);
    }
  };

  const fetchParentChildren = async (parentId: number) => {
    if (childrenData[parentId]) {
      // Already fetched, just toggle
      setExpandedParentId(expandedParentId === parentId ? null : parentId);
      return;
    }

    try {
      setLoadingChildren({ ...loadingChildren, [parentId]: true });
      const response = await api.get<ParentWithChildren>(`/parents/${parentId}`);
      setChildrenData({ ...childrenData, [parentId]: response.data.students });
      setExpandedParentId(parentId);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch children');
    } finally {
      setLoadingChildren({ ...loadingChildren, [parentId]: false });
    }
  };

  const handleDeleteParent = async (parentId: number, parentName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${parentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/parents/${parentId}`);
      setParents(parents.filter(p => p.id !== parentId));
      // Clean up expanded state if this parent was expanded
      if (expandedParentId === parentId) {
        setExpandedParentId(null);
      }
      // Clean up children data
      const newChildrenData = { ...childrenData };
      delete newChildrenData[parentId];
      setChildrenData(newChildrenData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete parent');
    }
  };

  const handleToggleChildren = (parentId: number) => {
    if (expandedParentId === parentId) {
      setExpandedParentId(null);
    } else {
      fetchParentChildren(parentId);
    }
  };

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await api.post<Parent>('/parents', formData);
      setParents([...parents, response.data]);
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', phone: '' });
      setError(null);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to create parent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({ name: '', email: '', password: '', phone: '' });
    setFormError(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Parents Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 transition duration-300 transform hover:scale-105 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Add Parent
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {parents.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No parents found. Click "Add Parent" to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {parents.map((parent) => (
            <div
              key={parent.id}
              className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition duration-200"
            >
              {/* Parent Row */}
              <div className="bg-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => handleToggleChildren(parent.id)}
                    className="text-slate-600 hover:text-blue-600 transition"
                  >
                    {loadingChildren[parent.id] ? (
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    ) : (
                      <svg
                        className={`w-5 h-5 transition-transform ${
                          expandedParentId === parent.id ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{parent.user.name}</h3>
                    <div className="flex gap-4 text-sm text-slate-600 mt-1">
                      <span>📧 {parent.user.email}</span>
                      {parent.phone && <span>📱 {parent.phone}</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteParent(parent.id, parent.user.name)}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow hover:from-red-600 hover:to-red-700 transition duration-300 transform hover:scale-105"
                >
                  Delete
                </button>
              </div>

              {/* Children Dropdown */}
              {expandedParentId === parent.id && childrenData[parent.id] && (
                <div className="bg-slate-50 border-t border-slate-200 p-4">
                  <h4 className="font-semibold text-slate-700 mb-2">Children:</h4>
                  {childrenData[parent.id].length === 0 ? (
                    <p className="text-sm text-slate-500">No children registered</p>
                  ) : (
                    <div className="space-y-2">
                      {childrenData[parent.id].map((student) => (
                        <div
                          key={student.id}
                          className="bg-white p-3 rounded-lg shadow-sm"
                        >
                          <p className="font-medium text-slate-800">{student.user.name}</p>
                          <div className="flex gap-3 text-sm text-slate-600 mt-1">
                            <span>📧 {student.user.email}</span>
                            {student.current_grade && <span>📚 {student.current_grade}</span>}
                            {student.dob && <span>🎂 {new Date(student.dob).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Parent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Add New Parent</h3>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddParent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Min 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="555-0123"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow hover:from-green-600 hover:to-green-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Parent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentsManagement;
