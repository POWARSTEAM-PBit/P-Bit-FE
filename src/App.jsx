import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import StudentLoginPage from './pages/StudentLoginPage';
import TeacherLoginPage from './pages/TeacherLoginPage';
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import CreateClassroomPage from './pages/CreateClassroomPage';
import JoinClassroomPage from './pages/JoinClassroomPage';
import ClassroomPage from './pages/ClassroomPage';
import ProfilePage from './pages/ProfilePage';
import { ClassroomProvider } from './contexts/ClassroomContext';
import { AuthProvider } from './hooks/useAuth';
import ConnectionPage from './pages/Connection';
import LinkDevice from './pages/LinkDevicePage';

export default function App() {
  const location = useLocation();
  const hideHeaderRoutes = ['/login-student', '/login-teacher', '/register'];

  return (
    <AuthProvider>
      <ClassroomProvider>
        {!hideHeaderRoutes.includes(location.pathname) && <Header />}

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login-student" element={<StudentLoginPage />} />
          <Route path="/login-teacher" element={<TeacherLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/ble" element={<ConnectionPage />} />
          <Route path="/create-classroom" element={<CreateClassroomPage />} />
          <Route path="/link-device" element={<LinkDevice />} />
          <Route path="/join-classroom" element={<JoinClassroomPage />} />
          <Route path="/classroom/:classroomId" element={<ClassroomPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </ClassroomProvider>
    </AuthProvider>
  );
}
