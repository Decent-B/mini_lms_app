import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import type { Student, Class, Subscription } from '../../types';

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

const StudentDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
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
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [studentRes, classesRes, subscriptionsRes] = await Promise.all([
        api.get<Student>('/students/me'),
        api.get<Class[]>('/students/me/classes'),
        api.get<Subscription[]>('/students/me/subscriptions')
      ]);
      
      setStudent(studentRes.data);
      setClasses(classesRes.data);
      setSubscriptions(subscriptionsRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
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

  // Generate color from subject name
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

  // Detect overlapping classes
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
  const getClassesByDay = (day: string): ClassWithPosition[] => {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12 text-red-600">
        Failed to load student information
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Student Info */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-8 mb-6 text-white">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-purple-600 font-bold text-4xl shadow-lg">
            {student.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Welcome, {student.user.name}!</h1>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-purple-100">
              <div><span className="font-semibold">Email:</span> {student.user.email}</div>
              {student.current_grade && <div><span className="font-semibold">Grade:</span> {student.current_grade}</div>}
              {student.dob && <div><span className="font-semibold">Date of Birth:</span> {new Date(student.dob).toLocaleDateString()}</div>}
              {student.gender && <div><span className="font-semibold">Gender:</span> {student.gender}</div>}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-white text-purple-600 rounded-lg shadow-lg hover:bg-purple-50 transition duration-300 transform hover:scale-105 font-semibold"
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

      {/* Class Schedule Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">My Class Schedule</h2>
        
        {classes.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl">
            <p className="text-slate-600 text-lg">No classes registered yet</p>
          </div>
        ) : (
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
                const dayClasses = getClassesByDay(day);

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
        )}
      </div>

      {/* Subscriptions Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">My Subscriptions</h2>
        
        {subscriptions.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl">
            <p className="text-slate-600 text-lg">No active subscriptions</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className={`rounded-xl p-5 border-2 transition ${
                  subscription.is_active
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                    : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-slate-800">{subscription.package_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        subscription.is_active
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-400 text-white'
                      }`}>
                        {subscription.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                      <div>
                        <span className="font-semibold">Start Date:</span> {new Date(subscription.start_date).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-semibold">End Date:</span> {new Date(subscription.end_date).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-semibold">Total Sessions:</span> {subscription.total_sessions}
                      </div>
                      <div>
                        <span className="font-semibold">Used Sessions:</span> {subscription.used_sessions}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-slate-600 mb-1">
                        <span>Sessions Progress</span>
                        <span className="font-semibold">{subscription.remaining_sessions} remaining</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            subscription.is_active ? 'bg-green-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${(subscription.used_sessions / subscription.total_sessions) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
