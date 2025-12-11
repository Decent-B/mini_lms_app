import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { Class, Student } from '../../types';
import EditClassModal from './EditClassModal';

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

interface ClassDetails extends Class {
  current_students: number;
  enrolled_students: Student[];
}

const ClassesManagement = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredClassId, setHoveredClassId] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedClass, setSelectedClass] = useState<ClassDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Add class modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    day_of_week: 'Monday',
    time_slot: '',
    teacher_name: '',
    max_students: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit class modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  // Student management state
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [addingStudent, setAddingStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const startHour = 8; // 8 AM
  const endHour = 19; // 7 PM
  const hourHeight = 80; // pixels per hour

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get<Class[]>('/classes');
      setClasses(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  // Parse time slot "HH:MM-HH:MM" into minutes from midnight
  const parseTimeSlot = (timeSlot: string): TimeSlot | null => {
    if (!timeSlot) return null;
    
    const match = timeSlot.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const [, startHour, startMin, endHour, endMin] = match;
    return {
      start: parseInt(startHour) * 60 + parseInt(startMin),
      end: parseInt(endHour) * 60 + parseInt(endMin),
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
    
    // Build overlap groups
    const overlapGroups: ClassWithPosition[][] = [];
    
    sorted.forEach((classItem) => {
      // Find which group(s) this class overlaps with
      let addedToGroup = false;
      
      for (const group of overlapGroups) {
        // Check if this class overlaps with any class in the group
        const overlapsWithGroup = group.some(
          groupClass => classItem.timeSlot.start < groupClass.timeSlot.end && 
                       classItem.timeSlot.end > groupClass.timeSlot.start
        );
        
        if (overlapsWithGroup) {
          group.push(classItem);
          addedToGroup = true;
          break;
        }
      }
      
      // If doesn't overlap with any existing group, create new group
      if (!addedToGroup) {
        overlapGroups.push([classItem]);
      }
    });
    
    // Assign offset indices within each group
    overlapGroups.forEach(group => {
      const groupSorted = [...group].sort((a, b) => a.timeSlot.start - b.timeSlot.start);
      
      groupSorted.forEach((classItem, index) => {
        let offsetIndex = 0;
        const overlapping: ClassWithPosition[] = [];

        // Check all previous classes in this group for overlaps
        for (let i = 0; i < index; i++) {
          const prevClass = groupSorted[i];
          if (prevClass.timeSlot.end > classItem.timeSlot.start) {
            overlapping.push(prevClass);
          }
        }

        // Find the first available offset index
        const usedOffsets = overlapping.map(c => c.offsetIndex);
        while (usedOffsets.includes(offsetIndex)) {
          offsetIndex++;
        }

        classItem.offsetIndex = offsetIndex;
      });
      
      // After all offset indices are assigned, set totalOverlaps for the entire group
      const maxOffset = Math.max(...group.map(c => c.offsetIndex), 0);
      const totalOverlaps = maxOffset + 1;
      group.forEach(classItem => {
        classItem.totalOverlaps = totalOverlaps;
      });
    });

    return sorted;
  };

  // Group classes by day with positioning info
  const getClassesByDay = (day: string): ClassWithPosition[] => {
    const dayClasses = classes
      .filter(c => c.day_of_week === day && c.time_slot)
      .map(c => {
        const timeSlot = parseTimeSlot(c.time_slot!);
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

  // Fetch class details with enrolled students
  const fetchClassDetails = async (classId: number) => {
    setLoadingDetails(true);
    try {
      // Fetch class info
      const classInfo = classes.find(c => c.id === classId);
      if (!classInfo) return;

      // Fetch enrolled students through registrations
      const response = await api.get<any[]>(`/classes/${classId}/registrations`);
      const enrolledStudents = response.data.map((reg: any) => reg.student);

      setSelectedClass({
        ...classInfo,
        current_students: enrolledStudents.length,
        enrolled_students: enrolledStudents,
      });
      setShowModal(true);
    } catch (err: any) {
      // If endpoint doesn't exist, show class info without students
      const classInfo = classes.find(c => c.id === classId);
      if (classInfo) {
        setSelectedClass({
          ...classInfo,
          current_students: 0,
          enrolled_students: [],
        });
        setShowModal(true);
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const classData = {
        name: formData.name,
        subject: formData.subject || null,
        day_of_week: formData.day_of_week || null,
        time_slot: formData.time_slot || null,
        teacher_name: formData.teacher_name || null,
        max_students: formData.max_students ? parseInt(formData.max_students) : null,
      };

      const response = await api.post<Class>('/classes', classData);
      setClasses([...classes, response.data]);
      setShowAddModal(false);
      setFormData({
        name: '',
        subject: '',
        day_of_week: 'Monday',
        time_slot: '',
        teacher_name: '',
        max_students: '',
      });
      setError(null);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to create class');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (classData: Class) => {
    setEditingClass(classData);
    setShowEditModal(true);
  };

  const handleEditClass = async (formData: any) => {
    if (!editingClass) return;

    try {
      const response = await api.patch(`/classes/${editingClass.id}`, formData);
      setClasses(classes.map(c => c.id === editingClass.id ? response.data : c));
      // Update selectedClass if it's the one being edited
      if (selectedClass && selectedClass.id === editingClass.id) {
        setSelectedClass({ ...selectedClass, ...response.data });
      }
      setShowEditModal(false);
      setEditingClass(null);
    } catch (err: any) {
      throw err; // Let the modal handle the error
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingClass(null);
  };

  // Fetch all students for adding to classes
  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        const response = await api.get<Student[]>('/students');
        setAllStudents(response.data);
      } catch (err) {
        console.error('Failed to fetch students:', err);
      }
    };
    fetchAllStudents();
  }, []);

  const handleAddStudentToClass = async () => {
    if (!selectedClass || !selectedStudentId) return;

    try {
      setAddingStudent(true);
      await api.post(`/classes/${selectedClass.id}/register`, { student_id: parseInt(selectedStudentId) });
      // Refresh class details
      await fetchClassDetails(selectedClass.id);
      setSelectedStudentId('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add student to class');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudentFromClass = async (studentId: number, studentName: string) => {
    if (!selectedClass) return;
    
    if (!window.confirm(`Remove ${studentName} from ${selectedClass.name}?`)) {
      return;
    }

    try {
      await api.delete(`/classes/${selectedClass.id}/registrations/${studentId}`);
      // Refresh class details
      await fetchClassDetails(selectedClass.id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove student from class');
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormData({
      name: '',
      subject: '',
      day_of_week: 'Monday',
      time_slot: '',
      teacher_name: '',
      max_students: '',
    });
    setFormError(null);
  };

  // Calculate position styles for a class
  const getClassStyle = (classItem: ClassWithPosition) => {
    const topPosition = ((classItem.timeSlot.start - startHour * 60) / 60) * hourHeight;
    const height = ((classItem.timeSlot.end - classItem.timeSlot.start) / 60) * hourHeight;
    
    // Only reduce width if this class is part of an overlap group
    const widthPercent = classItem.totalOverlaps > 1 ? 100 / classItem.totalOverlaps : 100;
    const leftPercent = classItem.offsetIndex * widthPercent;

    const isHovered = hoveredClassId === classItem.id;
    const isOverlapping = hoveredClassId !== null && hoveredClassId !== classItem.id;

    return {
      top: `${topPosition}px`,
      height: `${height - 4}px`,
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      backgroundColor: classItem.color,
      opacity: isOverlapping ? 0.4 : 1,
      zIndex: isHovered ? 50 : 10 + classItem.offsetIndex,
      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Classes Timetable</h2>
          <p className="text-slate-600 mt-1">View and manage class schedules across the week</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Class
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-slate-200">
          {/* Time column header */}
          <div className="w-20 flex-shrink-0 bg-slate-50 border-r border-slate-200">
            <div className="h-12 flex items-center justify-center font-semibold text-slate-700">
              Time
            </div>
          </div>

          {/* Day headers */}
          {weekDays.map(day => (
            <div key={day} className="flex-1 min-w-0 border-r border-slate-200 last:border-r-0">
              <div className="h-12 flex items-center justify-center font-semibold text-slate-700 bg-slate-50">
                {day}
              </div>
            </div>
          ))}
        </div>

        <div className="flex relative">
          {/* Time labels */}
          <div className="w-20 flex-shrink-0 border-r border-slate-200 bg-slate-50">
            {Array.from({ length: endHour - startHour }, (_, i) => {
              const hour = startHour + i;
              return (
                <div
                  key={hour}
                  className="border-t border-slate-200 text-xs text-slate-600 px-2 py-1"
                  style={{ height: `${hourHeight}px` }}
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
              );
            })}
          </div>

          {/* Day columns with classes */}
          {weekDays.map(day => {
            const dayClasses = getClassesByDay(day);

            return (
              <div
                key={day}
                className="flex-1 min-w-0 border-r border-slate-200 last:border-r-0 relative"
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
                    className="absolute px-2 py-2 rounded-lg shadow-md cursor-pointer transition-all duration-200 overflow-hidden"
                    style={getClassStyle(classItem)}
                    onMouseEnter={(e) => {
                      setHoveredClassId(classItem.id);
                      setTooltipPosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setTooltipPosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredClassId(null)}
                    onClick={() => fetchClassDetails(classItem.id)}
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
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredClassId && (
        <div
          className="fixed pointer-events-none z-50 bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl text-sm"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y + 10}px`,
          }}
        >
          {(() => {
            const hoveredClass = classes.find(c => c.id === hoveredClassId);
            if (!hoveredClass) return null;
            return (
              <div>
                <div className="font-semibold">{hoveredClass.name}</div>
                <div className="text-xs opacity-90 mt-1">
                  {hoveredClass.subject} • {hoveredClass.teacher_name}
                </div>
                <div className="text-xs opacity-80 mt-1">
                  {hoveredClass.day_of_week} {hoveredClass.time_slot}
                </div>
                <div className="text-xs opacity-70 mt-1 italic">Click for details</div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Class Details Modal */}
      {showModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-slate-800">{selectedClass.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(selectedClass)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                  title="Edit class"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {loadingDetails ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div>
                {/* Class Information */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Subject</label>
                    <p className="text-slate-800">{selectedClass.subject || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Teacher</label>
                    <p className="text-slate-800">{selectedClass.teacher_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Day</label>
                    <p className="text-slate-800">{selectedClass.day_of_week || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Time</label>
                    <p className="text-slate-800">{selectedClass.time_slot || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Capacity</label>
                    <p className="text-slate-800">
                      {selectedClass.current_students} / {selectedClass.max_students || '∞'} students
                    </p>
                  </div>
                </div>

                {/* Enrolled Students */}
                <div className="border-t border-slate-200 pt-6">
                  <h4 className="font-semibold text-slate-800 mb-4">
                    Enrolled Students ({selectedClass.current_students})
                  </h4>
                  
                  {selectedClass.enrolled_students.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No students enrolled yet</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedClass.enrolled_students.map((student) => (
                        <div
                          key={student.id}
                          className="bg-slate-50 p-3 rounded-lg flex items-center gap-3"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{student.user.name}</p>
                            <div className="flex gap-3 text-sm text-slate-600 mt-1">
                              <span>📧 {student.user.email}</span>
                              {student.current_grade && <span>📚 {student.current_grade}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveStudentFromClass(student.id, student.user.name)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Remove student from class"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Student to Class */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h5 className="text-sm font-semibold text-slate-700 mb-2">Add Student</h5>
                    <div className="flex gap-2">
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a student...</option>
                        {allStudents
                          .filter(s => !selectedClass.enrolled_students.some(es => es.id === s.id))
                          .map(student => (
                            <option key={student.id} value={student.id}>
                              {student.user.name}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={handleAddStudentToClass}
                        disabled={!selectedStudentId || addingStudent}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {addingStudent ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Add New Class</h3>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddClass}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Advanced Mathematics"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mathematics"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {weekDays.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Time Slot *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$"
                    value={formData.time_slot}
                    onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="09:00-10:30"
                    title="Time slot must be in HH:MM-HH:MM format (e.g., 09:00-10:30)"
                  />
                  <p className="mt-1 text-xs text-slate-500">Format: HH:MM-HH:MM (required)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Teacher Name
                  </label>
                  <input
                    type="text"
                    value={formData.teacher_name}
                    onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Prof. Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Max Students
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_students}
                    onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
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
                  {isSubmitting ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && editingClass && (
        <EditClassModal
          classData={editingClass}
          onClose={handleCloseEditModal}
          onSubmit={handleEditClass}
        />
      )}
    </div>
  );
};

export default ClassesManagement;
