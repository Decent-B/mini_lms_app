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

  // Edit parent modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
  });

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

  const handleEditClick = (parent: Parent) => {
    setEditingParent(parent);
    setEditFormData({
      name: parent.user.name,
      phone: parent.phone || '',
    });
    setShowEditModal(true);
  };

  const handleEditParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await api.patch<Parent>(`/parents/${editingParent.id}`, editFormData);
      setParents(parents.map(p => p.id === editingParent.id ? response.data : p));
      setShowEditModal(false);
      setEditingParent(null);
      setFormError(null);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to update parent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingParent(null);
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
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Parents Management</h2>
          <p className="text-slate-600 mt-1">Manage parent accounts and view their children</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Parent
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {parents.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <p className="text-slate-600 text-lg">No parents found. Add your first parent!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {parents.map((parent) => (
            <div
              key={parent.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition hover:shadow-md"
            >
              {/* Parent Header */}
              <div className="flex items-center justify-between p-5">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleToggleChildren(parent.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {parent.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800">{parent.user.name}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-600 mt-1">
                        <span>📧 {parent.user.email}</span>
                        {parent.phone && <span>📱 {parent.phone}</span>}
                      </div>
                    </div>
                    <button
                      className={`ml-4 transition-transform ${
                        expandedParentId === parent.id ? 'rotate-180' : ''
                      }`}
                    >
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(parent)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                    title="Edit parent"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteParent(parent.id, parent.user.name)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Delete parent"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expandable Children */}
              {expandedParentId === parent.id && (
                <div className="border-t border-slate-200 p-5 bg-slate-50">
                  {loadingChildren[parent.id] ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : !childrenData[parent.id] || childrenData[parent.id].length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No children registered</p>
                  ) : (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-slate-800 mb-4">
                        Children ({childrenData[parent.id].length})
                      </h4>
                      <div className="space-y-3">
                        {childrenData[parent.id].map((student) => (
                          <div
                            key={student.id}
                            className="bg-slate-50 p-3 rounded-lg"
                          >
                            <p className="font-medium text-slate-800">{student.user.name}</p>
                            <div className="flex flex-wrap gap-3 text-sm text-slate-600 mt-1">
                              <span>📧 {student.user.email}</span>
                              {student.current_grade && <span>📚 {student.current_grade}</span>}
                              {student.dob && <span>🎂 {new Date(student.dob).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
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

      {/* Edit Parent Modal */}
      {showEditModal && editingParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Edit Parent</h3>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditParent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="555-0123"
                  />
                </div>

                <div className="text-sm text-slate-500">
                  <p>Email: {editingParent.user.email}</p>
                  <p className="text-xs mt-1">Email cannot be changed</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Parent'}
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
