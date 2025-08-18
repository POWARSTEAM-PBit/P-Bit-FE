<<<<<<< Updated upstream
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import StudentLoginPage from './pages/StudentLoginPage';
import TeacherLoginPage from './pages/TeacherLoginPage';
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/login-student" element={<StudentLoginPage />} />
        <Route path="/login-teacher" element={<TeacherLoginPage />} />
        <Route path="/register" element={<RegisterPage />} /> 
      </Routes>
    </>
  );
=======
// import React from 'react';
// import Header from "./components/Header.jsx";

// export default function App() {
//     return (
//         <>
//             <Header />
//             <div style={{ padding: '2rem' }}>
//                 <h1>Welcome to MyApp</h1>
//                 <p>Hi! This is your starting page content.</p>
//             </div>
//         </>
//     );
// }


import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return <AppRoutes />;
>>>>>>> Stashed changes
}
