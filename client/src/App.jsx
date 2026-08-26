import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import { ProtectedRoute, AdminRoute, StudentRoute } from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import LanguageSelectionPage from './pages/student/LanguageSelectionPage';
import AssessmentPage from './pages/student/AssessmentPage';
import ResultsPage from './pages/student/ResultsPage';
import LeaderboardPage from './pages/student/LeaderboardPage';
import ProfilePage from './pages/student/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import QuestionManagementPage from './pages/admin/QuestionManagementPage';
import StudentsPage from './pages/admin/StudentsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import SettingsPage from './pages/admin/SettingsPage';

// Layout wrapper to conditionally show navbar
const Layout = ({ children }) => {
  const location = useLocation();
  // Hide navbar on assessment screen to avoid distraction/cheating
  const showNavbar = !location.pathname.startsWith('/assessment/');

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Student Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <StudentRoute>
                    <StudentDashboard />
                  </StudentRoute>
                }
              />
              <Route
                path="/languages"
                element={
                  <StudentRoute>
                    <LanguageSelectionPage />
                  </StudentRoute>
                }
              />
              <Route
                path="/assessment/:language"
                element={
                  <StudentRoute>
                    <AssessmentPage />
                  </StudentRoute>
                }
              />
              <Route
                path="/results/:id"
                element={<ProtectedRoute><ResultsPage /></ProtectedRoute>}
              />
              <Route
                path="/leaderboard"
                element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>}
              />
              <Route
                path="/profile"
                element={
                  <StudentRoute>
                    <ProfilePage />
                  </StudentRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/questions"
                element={
                  <AdminRoute>
                    <QuestionManagementPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <AdminRoute>
                    <StudentsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <AdminRoute>
                    <AnalyticsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <AdminRoute>
                    <SettingsPage />
                  </AdminRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </Router>
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
