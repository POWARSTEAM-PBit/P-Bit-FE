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
}