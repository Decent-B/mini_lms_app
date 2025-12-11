import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RootRedirect from './components/RootRedirect';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import ParentsManagement from './components/admin/ParentsManagement';
import StudentsManagement from './components/admin/StudentsManagement';
import ClassesManagement from './components/admin/ClassesManagement';
import SubscriptionsManagement from './components/admin/SubscriptionsManagement';
import StudentDashboard from './components/dashboard/StudentDashboard';
import ParentDashboard from './components/dashboard/ParentDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            
            {/* Admin Panel - Staff Only */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/parents" replace />} />
              <Route path="parents" element={<ParentsManagement />} />
              <Route path="students" element={<StudentsManagement />} />
              <Route path="classes" element={<ClassesManagement />} />
              <Route path="subscriptions" element={<SubscriptionsManagement />} />
            </Route>

            {/* Student Dashboard - Student Only */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <div className="min-h-screen bg-slate-50 py-8 px-4">
                    <StudentDashboard />
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Parent Dashboard - Parent Only */}
            <Route
              path="/parent/dashboard"
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <div className="min-h-screen bg-slate-50 py-8 px-4">
                    <ParentDashboard />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
