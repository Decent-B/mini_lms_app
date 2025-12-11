import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { Student, Parent, Class } from '../../types';

interface TimeSlot {
  start: number; // minutes from midnight
  end: number;
}

interface ClassWithPosition extends Class {
  timeSlot: TimeSlot;
  color: string;
  offsetIndex: number;
  totalOverlaps: number;
}

const StudentsManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);
  const [studentClasses, setStudentClasses] = useState<{ [key: number]: Class[] }>({});
  const [loadingClasses, setLoadingClasses] = useState<{ [key: number]: boolean }>({});
  
  // Add student modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    parent_id: '',
    dob: '',
    gender: '',
    current_grade: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timetable configuration
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const startHour = 8; // 8 AM
  const endHour = 19; // 7 PM
  const hourHeight = 80; // pixels per hour

  useEffect(() => {
    fetchStudents();
    fetchParents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get<Student[]>('/students');
      setStudents(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchParents = async () => {
    try {
      const response = await api.get<Parent[]>('/parents');
      setParents(response.data);
    } catch (err: any) {
      console.error('Failed to fetch parents:', err);
    }
  };

  const fetchStudentClasses = async (studentId: number) => {
    if (studentClasses[studentId]) {
      // Already fetched, just toggle
      setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
      return;
    }

    try {
      setLoadingClasses({ ...loadingClasses, [studentId]: true });
      const response = await api.get<Class[]>(`/students/${studentId}/classes`);
      setStudentClasses({ ...studentClasses, [studentId]: response.data });
      setExpandedStudentId(studentId);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch student classes');
    } finally {
      setLoadingClasses({ ...loadingClasses, [studentId]: false });
    }
  };

  const handleDeleteStudent = async (studentId: number, studentName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/students/${studentId}`);
      setStudents(students.filter(s => s.id !== studentId));
      // Clean up expanded state if this student was expanded
      if (expandedStudentId === studentId) {
        setExpandedStudentId(null);
      }
      // Clean up classes data
      const newClassesData = { ...studentClasses };
      delete newClassesData[studentId];
      setStudentClasses(newClassesData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete student');
    }
  };

  const handleToggleSchedule = (studentId: number) => {
    if (expandedStudentId === studentId) {
      setExpandedStudentId(null);
    } else {
      fetchStudentClasses(studentId);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const studentData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : undefined,
        dob: formData.dob || undefined,
        gender: formData.gender || undefined,
        current_grade: formData.current_grade || undefined,
      };

      const response = await api.post<Student>('/students', studentData);
      setStudents([...students, response.data]);
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        parent_id: '',
        dob: '',
        gender: '',
        current_grade: '',
      });
      setError(null);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      parent_id: '',
      dob: '',
      gender: '',
      current_grade: '',
    });
    setFormError(null);
  };

  // Parse time slot "HH:MM-HH:MM" into minutes from midnight
  const parseTimeSlot = (timeSlot: string): TimeSlot | null => {
    if (!timeSlot) return null;
    
    const match = timeSlot.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const [, startHourStr, startMin, endHourStr, endMin] = match;
    return {
      start: parseInt(startHourStr) * 60 + parseInt(startMin),
      end: parseInt(endHourStr) * 60 + parseInt(endMin),
    };
  };

  // Generate color from subject name using hash
  const generateColor = (subject: string): string => {
    if (!subject) return '#94a3b8'; // default slate color

    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate pastel colors by keeping saturation and lightness in a good range
    const hue = Math.abs(hash % 360);
    const saturation = 65 + (Math.abs(hash) % 15); // 65-80%
    const lightness = 55 + (Math.abs(hash >> 8) % 15); // 55-70%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Detect overlapping classes for a given day
  const detectOverlaps = (dayClasses: ClassWithPosition[]): ClassWithPosition[] => {
    const sorted = [...dayClasses].sort((a, b) => a.timeSlot.start - b.timeSlot.start);
    const groups: ClassWithPosition[][] = [];

    for (const classItem of sorted) {
      let addedToGroup = false;

      // Try to add to existing group
      for (const group of groups) {
        const overlapsWithAny = group.some(existingClass => {
          return !(
            existingClass.timeSlot.end <= classItem.timeSlot.start ||
            classItem.timeSlot.end <= existingClass.timeSlot.start
          );
        });

        if (overlapsWithAny) {
          group.push(classItem);
          addedToGroup = true;
          break;
        }
      }

      // Create new group if doesn't overlap with existing groups
      if (!addedToGroup) {
        groups.push([classItem]);
      }
    }

    // Assign offset and total overlaps for each class
    const result: ClassWithPosition[] = [];
    for (const group of groups) {
      const totalOverlaps = group.length;
      group.forEach((classItem, index) => {
        result.push({
          ...classItem,
          offsetIndex: index,
          totalOverlaps: totalOverlaps,
        });
      });
    }

    return result;
  };

  // Get classes for a specific day
  const getClassesByDay = (day: string, classes: Class[]): ClassWithPosition[] => {
    const dayClasses = classes
      .filter(c => c.day_of_week === day)
      .map(c => {
        const timeSlot = parseTimeSlot(c.time_slot || '');
        if (!timeSlot) return null;

        return {
          ...c,
          timeSlot,
          color: generateColor(c.subject || ''),
          offsetIndex: 0,
          totalOverlaps: 1,
        } as ClassWithPosition;
      })
      .filter((c): c is ClassWithPosition => c !== null);

    return detectOverlaps(dayClasses);
  };

  // Calculate position styles for a class
  const getClassStyle = (classItem: ClassWithPosition) => {
    const topPosition = ((classItem.timeSlot.start - startHour * 60) / 60) * hourHeight;
    const height = ((classItem.timeSlot.end - classItem.timeSlot.start) / 60) * hourHeight;
    
    // Only reduce width if this class is part of an overlap group
    const widthPercent = classItem.totalOverlaps > 1 ? 100 / classItem.totalOverlaps : 100;
    const leftPercent = classItem.offsetIndex * widthPercent;

    return {
      top: `${topPosition}px`,
      height: `${height - 4}px`,
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      backgroundColor: classItem.color,
    };
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
          <h2 className="text-3xl font-bold text-slate-800">Students Management</h2>
          <p className="text-slate-600 mt-1">Manage student accounts and view their schedules</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Students List */}
      {students.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <p className="text-slate-600 text-lg">No students found. Add your first student!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition hover:shadow-md"
            >
              {/* Student Header */}
              <div className="flex items-center justify-between p-5">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleToggleSchedule(student.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {student.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800">{student.user.name}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-600 mt-1">
                        <span>📧 {student.user.email}</span>
                        {student.current_grade && <span>📚 {student.current_grade}</span>}
                        {student.dob && <span>🎂 {new Date(student.dob).toLocaleDateString()}</span>}
                        {student.gender && <span>👤 {student.gender}</span>}
                      </div>
                    </div>
                    <button
                      className={`ml-4 transition-transform ${
                        expandedStudentId === student.id ? 'rotate-180' : ''
                      }`}
                    >
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteStudent(student.id, student.user.name)}
                  className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Delete student"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Expandable Schedule */}
              {expandedStudentId === student.id && (
                <div className="border-t border-slate-200 p-5 bg-slate-50">
                  {loadingClasses[student.id] ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : !studentClasses[student.id] || studentClasses[student.id].length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No classes registered</p>
                  ) : (
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-slate-800 mb-4">
                        Class Schedule ({studentClasses[student.id].length} classes)
                      </h4>

                      {/* Weekly Timetable */}
                      <div className="overflow-x-auto">
                        <div className="flex min-w-[800px]">
                          {/* Time column */}
                          <div className="w-16 flex-shrink-0 border-r border-slate-200">
                            <div className="h-12 border-b border-slate-200"></div>
                            <div style={{ height: `${(endHour - startHour) * hourHeight}px` }} className="relative">
                              {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
                                <div
                                  key={i}
                                  className="absolute w-full text-xs text-slate-500 text-right pr-2"
                                  style={{ top: `${i * hourHeight - 8}px` }}
                                >
                                  {String(startHour + i).padStart(2, '0')}:00
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Day columns */}
                          {weekDays.map(day => {
                            const dayClasses = getClassesByDay(day, studentClasses[student.id]);

                            return (
                              <div key={day} className="flex-1 min-w-0">
                                {/* Day header */}
                                <div className="h-12 border-b border-r border-slate-200 flex items-center justify-center bg-slate-50">
                                  <span className="font-semibold text-slate-700 text-sm">{day}</span>
                                </div>

                                {/* Day content */}
                                <div
                                  className="relative border-r border-slate-200 last:border-r-0"
                                  style={{ height: `${(endHour - startHour) * hourHeight}px` }}
                                >
                                  {/* Hour grid lines */}
                                  {Array.from({ length: endHour - startHour }, (_, i) => (
                                    <div
                                      key={i}
                                      className="absolute w-full border-t border-slate-200"
                                      style={{ top: `${i * hourHeight}px` }}
                                    />
                                  ))}

                                  {/* Classes */}
                                  {dayClasses.map(classItem => (
                                    <div
                                      key={classItem.id}
                                      className="absolute px-2 py-2 rounded-lg shadow-sm overflow-hidden"
                                      style={getClassStyle(classItem)}
                                    >
                                      <div className="text-white text-xs font-semibold truncate">
                                        {classItem.name}
                                      </div>
                                      <div className="text-white text-xs opacity-90 truncate">
                                        {classItem.teacher_name}
                                      </div>
                                      <div className="text-white text-xs opacity-80 mt-1">
                                        {classItem.time_slot}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Add New Student</h3>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddStudent}>
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
                    placeholder="Jane Doe"
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
                    placeholder="jane.doe@example.com"
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
                    Parent
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a parent (optional)</option>
                    {parents.map(parent => (
                      <option key={parent.id} value={parent.id}>
                        {parent.user.name} ({parent.user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select gender (optional)</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Current Grade
                  </label>
                  <input
                    type="text"
                    value={formData.current_grade}
                    onChange={(e) => setFormData({ ...formData, current_grade: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Grade 8"
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsManagement;

