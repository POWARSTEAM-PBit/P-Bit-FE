// Core React + Router
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Shared UI / Context
import Header from './components/Header/Header';
import StudentLoginPage from './pages/StudentLoginPage';
import TeacherLoginPage from './pages/TeacherLoginPage';
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from './pages/DashboardPage';
import CreateClassroomPage from './pages/CreateClassroomPage';
import JoinClassroomPage from './pages/JoinClassroomPage';
import ClassroomPage from './pages/ClassroomPage';
import DeviceViewPage from './pages/DeviceViewPage';
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
                            <Route path="/classroom/:classroomId/device/:deviceId" element={<DeviceViewPage />} />
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
// import { ClassroomProvider } from './contexts/ClassroomContext';

// // ==== Lazy pages (loaded only when visited) ====
// const StudentLoginPage     = lazy(() => import('./pages/StudentLoginPage'));
// const TeacherLoginPage     = lazy(() => import('./pages/TeacherLoginPage'));
// const RegisterPage         = lazy(() => import('./pages/RegisterPage'));
// const DataDashboardPage    = lazy(() => import('./pages/DataDashboardView')); 
// const CreateClassroomPage  = lazy(() => import('./pages/CreateClassroomPage'));
// const JoinClassroomPage    = lazy(() => import('./pages/JoinClassroomPage'));
// const ClassroomPage        = lazy(() => import('./pages/ClassroomPage'));
// const ProfilePage          = lazy(() => import('./pages/ProfilePage'));
// const ConnectionPage       = lazy(() => import('./pages/Connection'));

// export default function App() {
//   return (
//     <ClassroomProvider>
//       {/* Always visible header */}
//       <Header />

//       {/* While a lazy page is loading, show a tiny fallback */}
//       <Suspense fallback={<div style={{ padding: 20 }}>Loading…</div>}>
//         <Routes>
//           {/* Default -> IoT dashboard */}
//           <Route path="/" element={<DataDashboardPage />} />
//           <Route path="/dashboard" element={<DataDashboardPage />} />

//           {/* Auth */}
//           <Route path="/login-student" element={<StudentLoginPage />} />
//           <Route path="/login-teacher" element={<TeacherLoginPage />} />
//           <Route path="/register" element={<RegisterPage />} />

//           {/* Classrooms */}
//           <Route path="/create-classroom" element={<CreateClassroomPage />} />
//           <Route path="/join-classroom" element={<JoinClassroomPage />} />
//           <Route path="/classroom/:classroomId" element={<ClassroomPage />} />

//           {/* Misc */}
//           <Route path="/profile" element={<ProfilePage />} />
//           <Route path="/ble" element={<ConnectionPage />} />
//         </Routes>
//       </Suspense>
//     </ClassroomProvider>
//   );
// }
