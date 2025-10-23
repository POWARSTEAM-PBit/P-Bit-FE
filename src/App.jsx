import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import StudentLoginPage from './pages/StudentLoginPage';
import TeacherLoginPage from './pages/TeacherLoginPage';
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from './pages/DashboardPage';
import CreateClassroomPage from './pages/CreateClassroomPage';
import JoinClassroomPage from './pages/JoinClassroomPage';
import ClassroomPage from './pages/ClassroomPage';
import DeviceViewPage from './pages/DeviceViewPage';
import NewDeviceViewPage from './pages/NewDeviceViewPage';
import ProfilePage from './pages/ProfilePage';
import DirectPBitPage from './pages/DirectPBitPage';
import { ClassroomProvider } from './contexts/ClassroomContext';
import { AuthProvider } from './contexts/AuthContext';
import { DeviceProvider } from './contexts/DeviceContext';
import { GroupProvider } from './contexts/GroupContext';

export default function App() {
    return (
        <AuthProvider>
            <ClassroomProvider>
                <DeviceProvider>
                    <GroupProvider>
                        <Header />
                        <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/login-student" element={<StudentLoginPage />} />
                            <Route path="/login-teacher" element={<TeacherLoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/create-classroom" element={<CreateClassroomPage />} />
                            <Route path="/join-classroom" element={<JoinClassroomPage />} />
                            <Route path="/classroom/:classroomId" element={<ClassroomPage />} />
                            <Route path="/classroom/:classroomId/device/:deviceId" element={<NewDeviceViewPage />} />
                            <Route path="/device/:deviceId" element={<DeviceViewPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/pbit" element={<DirectPBitPage />} />
                            <Route path="/pbit/:macAddress" element={<DirectPBitPage />} />
                        </Routes>
                    </GroupProvider>
                </DeviceProvider>
            </ClassroomProvider>
        </AuthProvider>
    );
}
