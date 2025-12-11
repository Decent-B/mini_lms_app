import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import type { Parent, Student, Class, Subscription } from '../../types';

interface ParentWithChildren extends Parent {
  students: Student[];
}

interface TimeSlot {
  start: number;
  end: number;
}

interface ClassWithPosition extends Class {
  timeSlot: TimeSlot;
  color: string;
  offsetIndex: number;
  totalOverlaps: number;
}

const ParentDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [parent, setParent] = useState<ParentWithChildren | null>(null);
  const [studentClasses, setStudentClasses] = useState<{ [key: number]: Class[] }>({});
  const [studentSubscriptions, setStudentSubscriptions] = useState<{ [key: number]: Subscription[] }>({});
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const startHour = 8;
  const endHour = 19;
  const hourHeight = 80;

  useEffect(() => {
    fetchParentData();
  }, []);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      const parentRes = await api.get<ParentWithChildren>('/parents/me');
      setParent(parentRes.data);

      // Fetch classes and subscriptions for all children
      const classesPromises = parentRes.data.students.map(student =>
        api.get<Class[]>(`/students/${student.id}/classes`)
          .then(res => ({ studentId: student.id, classes: res.data }))
      );
      
      const subscriptionsPromises = parentRes.data.students.map(student =>
        api.get<Subscription[]>(`/students/${student.id}/subscriptions`)
          .then(res => ({ studentId: student.id, subscriptions: res.data }))
      );

      const classesResults = await Promise.all(classesPromises);
      const subscriptionsResults = await Promise.all(subscriptionsPromises);

      const classesMap: { [key: number]: Class[] } = {};
      classesResults.forEach(result => {
        classesMap[result.studentId] = result.classes;
      });
      setStudentClasses(classesMap);

      const subscriptionsMap: { [key: number]: Subscription[] } = {};
      subscriptionsResults.forEach(result => {
        subscriptionsMap[result.studentId] = result.subscriptions;
      });
      setStudentSubscriptions(subscriptionsMap);

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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

  const generateColor = (subject: string): string => {
    if (!subject) return '#94a3b8';
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    const saturation = 65 + (Math.abs(hash) % 15);
    const lightness = 55 + (Math.abs(hash >> 8) % 15);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const detectOverlaps = (dayClasses: ClassWithPosition[]): ClassWithPosition[] => {
    const sorted = [...dayClasses].sort((a, b) => a.timeSlot.start - b.timeSlot.start);
    const groups: ClassWithPosition[][] = [];

    for (const classItem of sorted) {
      let addedToGroup = false;
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
      if (!addedToGroup) {
        groups.push([classItem]);
      }
    }

    const result: ClassWithPosition[] = [];
    for (const group of groups) {
      const totalOverlaps = group.length;
      group.forEach((classItem, index) => {
        result.push({ ...classItem, offsetIndex: index, totalOverlaps: totalOverlaps });
      });
    }
    return result;
  };

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

  const getClassStyle = (classItem: ClassWithPosition) => {
    const topPosition = ((classItem.timeSlot.start - startHour * 60) / 60) * hourHeight;
    const height = ((classItem.timeSlot.end - classItem.timeSlot.start) / 60) * hourHeight;
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

  if (!parent) {
    return (
      <div className="text-center py-12 text-red-600">
        Failed to load parent information
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Parent Info Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 mb-6 text-white">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-4xl shadow-lg">
            {parent.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Welcome, {parent.user.name}!</h1>
            <div className="flex gap-8 text-blue-100">
              <div><span className="font-semibold">Email:</span> {parent.user.email}</div>
              {parent.phone && <div><span className="font-semibold">Phone:</span> {parent.phone}</div>}
              <div><span className="font-semibold">Children:</span> {parent.students.length}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-white text-blue-600 rounded-lg shadow-lg hover:bg-blue-50 transition duration-300 transform hover:scale-105 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Children Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">My Children</h2>
        
        {parent.students.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <p className="text-slate-600 text-lg">No children registered</p>
          </div>
        ) : (
          <div className="space-y-4">
            {parent.students.map((student) => (
              <div key={student.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Student Header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => setExpandedStudentId(expandedStudentId === student.id ? null : student.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      {student.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{student.user.name}</h3>
                      <div className="flex gap-4 text-sm text-slate-600 mt-1">
                        <span>📧 {student.user.email}</span>
                        {student.current_grade && <span>📚 {student.current_grade}</span>}
                        {student.dob && <span>🎂 {new Date(student.dob).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    className={`transition-transform ${
                      expandedStudentId === student.id ? 'rotate-180' : ''
                    }`}
                  >
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Expanded Content */}
                {expandedStudentId === student.id && (
                  <div className="border-t border-slate-200 p-6 bg-slate-50">
                    {/* Class Schedule */}
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-slate-800 mb-4">
                        Class Schedule ({studentClasses[student.id]?.length || 0} classes)
                      </h4>
                      
                      {!studentClasses[student.id] || studentClasses[student.id].length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No classes registered</p>
                      ) : (
                        <div className="bg-white rounded-lg p-4 overflow-x-auto">
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
                              const dayClasses = getClassesByDay(day, studentClasses[student.id] || []);

                              return (
                                <div key={day} className="flex-1 min-w-0">
                                  <div className="h-12 border-b border-r border-slate-200 flex items-center justify-center bg-slate-50">
                                    <span className="font-semibold text-slate-700 text-sm">{day}</span>
                                  </div>
                                  <div
                                    className="relative border-r border-slate-200 last:border-r-0"
                                    style={{ height: `${(endHour - startHour) * hourHeight}px` }}
                                  >
                                    {Array.from({ length: endHour - startHour }, (_, i) => (
                                      <div
                                        key={i}
                                        className="absolute w-full border-t border-slate-200"
                                        style={{ top: `${i * hourHeight}px` }}
                                      />
                                    ))}
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
                      )}
                    </div>

                    {/* Subscriptions */}
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 mb-4">
                        Subscriptions ({studentSubscriptions[student.id]?.length || 0})
                      </h4>
                      
                      {!studentSubscriptions[student.id] || studentSubscriptions[student.id].length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No active subscriptions</p>
                      ) : (
                        <div className="grid gap-3">
                          {studentSubscriptions[student.id].map((subscription) => (
                            <div
                              key={subscription.id}
                              className={`rounded-lg p-4 border transition ${
                                subscription.is_active
                                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                                  : 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-bold text-slate-800">{subscription.package_name}</h5>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      subscription.is_active
                                        ? 'bg-green-500 text-white'
                                        : 'bg-slate-400 text-white'
                                    }`}>
                                      {subscription.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                                    <div><span className="font-semibold">Start:</span> {new Date(subscription.start_date).toLocaleDateString()}</div>
                                    <div><span className="font-semibold">End:</span> {new Date(subscription.end_date).toLocaleDateString()}</div>
                                    <div><span className="font-semibold">Total:</span> {subscription.total_sessions}</div>
                                    <div><span className="font-semibold">Used:</span> {subscription.used_sessions}</div>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          subscription.is_active ? 'bg-green-500' : 'bg-slate-400'
                                        }`}
                                        style={{ width: `${(subscription.used_sessions / subscription.total_sessions) * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-slate-600 font-semibold">{subscription.remaining_sessions} left</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
