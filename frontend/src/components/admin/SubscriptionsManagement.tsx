import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { Subscription, Student } from '../../types';
import EditSubscriptionModal from './EditSubscriptionModal';

const SubscriptionsManagement = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add subscription modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    package_name: '',
    start_date: '',
    end_date: '',
    total_sessions: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit subscription modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    fetchSubscriptions();
    fetchStudents();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get<Subscription[]>('/subscriptions');
      setSubscriptions(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get<Student[]>('/students');
      setStudents(response.data);
    } catch (err: any) {
      console.error('Failed to fetch students:', err);
    }
  };

  const handleDeleteSubscription = async (subscriptionId: number, packageName: string) => {
    if (!window.confirm(`Are you sure you want to delete subscription "${packageName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/subscriptions/${subscriptionId}`);
      setSubscriptions(subscriptions.filter(s => s.id !== subscriptionId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete subscription');
    }
  };

  const handleEditClick = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setShowEditModal(true);
  };

  const handleEditSubscription = async (formData: any) => {
    if (!editingSubscription) return;

    try {
      const response = await api.patch(`/subscriptions/${editingSubscription.id}`, formData);
      setSubscriptions(subscriptions.map(s => s.id === editingSubscription.id ? response.data : s));
      setShowEditModal(false);
      setEditingSubscription(null);
    } catch (err: any) {
      throw err; // Let the modal handle the error
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingSubscription(null);
  };

  const handleUseSession = async (subscriptionId: number) => {
    try {
      const response = await api.patch<Subscription>(`/subscriptions/${subscriptionId}/use`);
      // Update the subscription in the list
      setSubscriptions(subscriptions.map(s => 
        s.id === subscriptionId ? response.data : s
      ));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to use session');
    }
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const subscriptionData = {
        student_id: parseInt(formData.student_id),
        package_name: formData.package_name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_sessions: parseInt(formData.total_sessions),
      };

      const response = await api.post<Subscription>('/subscriptions', subscriptionData);
      setSubscriptions([...subscriptions, response.data]);
      setShowAddModal(false);
      setFormData({
        student_id: '',
        package_name: '',
        start_date: '',
        end_date: '',
        total_sessions: '',
      });
      setError(null);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to create subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      student_id: '',
      package_name: '',
      start_date: '',
      end_date: '',
      total_sessions: '',
    });
    setFormError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Subscriptions Management</h2>
          <p className="text-slate-600 mt-1">Manage student subscription packages and sessions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Subscription
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <p className="text-slate-600 text-lg">No subscriptions found. Add your first subscription!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition hover:shadow-md"
            >
              <div className="flex">
                {/* Left Side - Student Info */}
                <div className="flex-1 p-5 border-r border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {subscription.student.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {subscription.student.user.name}
                      </h3>
                      <div className="flex gap-3 text-sm text-slate-600 mt-1">
                        <span>ID: {subscription.student.id}</span>
                        {subscription.student.current_grade && (
                          <span>📚 {subscription.student.current_grade}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Subscription Details */}
                <div 
                  className={`flex-1 p-5 ${
                    subscription.is_active 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50' 
                      : 'bg-gradient-to-br from-slate-50 to-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-lg font-bold text-slate-800">
                          {subscription.package_name}
                        </h4>
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            subscription.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {subscription.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Start Date:</span>
                          <p className="font-medium text-slate-800">
                            {formatDate(subscription.start_date)}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-600">End Date:</span>
                          <p className="font-medium text-slate-800">
                            {formatDate(subscription.end_date)}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-600">Total Sessions:</span>
                          <p className="font-medium text-slate-800">{subscription.total_sessions}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Used Sessions:</span>
                          <p className="font-medium text-slate-800">{subscription.used_sessions}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Progress</span>
                          <span>
                            {subscription.remaining_sessions} sessions remaining
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              subscription.is_active ? 'bg-green-500' : 'bg-slate-400'
                            }`}
                            style={{
                              width: `${(subscription.used_sessions / subscription.total_sessions) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleUseSession(subscription.id)}
                        disabled={!subscription.is_active || subscription.remaining_sessions <= 0}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Use one session"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditClick(subscription)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                        title="Edit subscription"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteSubscription(subscription.id, subscription.package_name)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete subscription"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Add New Subscription</h3>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubscription}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Student *
                  </label>
                  <select
                    required
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.user.name} - {student.current_grade || 'No grade'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.package_name}
                    onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Monthly Premium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Sessions *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.total_sessions}
                    onChange={(e) => setFormData({ ...formData, total_sessions: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 20"
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
                  {isSubmitting ? 'Creating...' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {showEditModal && editingSubscription && (
        <EditSubscriptionModal
          subscription={editingSubscription}
          onClose={handleCloseEditModal}
          onSubmit={handleEditSubscription}
        />
      )}
    </div>
  );
};

export default SubscriptionsManagement;
