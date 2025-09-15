import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import StudentLoginPage from './pages/StudentLoginPage';
import TeacherLoginPage from './pages/TeacherLoginPage';
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from './pages/DashboardPage';
import CreateClassroomPage from './pages/CreateClassroomPage';
import JoinClassroomPage from './pages/JoinClassroomPage';
import ClassroomPage from './pages/ClassroomPage';
import ProfilePage from './pages/ProfilePage';
import { ClassroomProvider } from './contexts/ClassroomContext';
import ConnectionPage from './pages/Connection';
export default function App() {
    return (
        <ClassroomProvider>
            <Header />
            <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/login-student" element={<StudentLoginPage />} />
                <Route path="/login-teacher" element={<TeacherLoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/ble" element={<ConnectionPage />} />
                <Route path="/create-classroom" element={<CreateClassroomPage />} />
                <Route path="/join-classroom" element={<JoinClassroomPage />} />
                <Route path="/classroom/:classroomId" element={<ClassroomPage />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Routes>
        </ClassroomProvider>
    );
}
