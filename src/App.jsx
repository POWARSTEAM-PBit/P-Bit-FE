import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import StudentLoginPage from './pages/StudentLoginPage';
import TeacherLoginPage from './pages/TeacherLoginPage';
import RegisterPage from "./pages/RegisterPage";
import CreateClass from './pages/CreateClass';

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/login-student" element={<StudentLoginPage />} />
        <Route path="/login-teacher" element={<TeacherLoginPage />} />
        <Route path="/register" element={<RegisterPage />} /> 
        <Route path="/create-class" element={<CreateClass />} /> 
      </Routes>
    </>
  );
}
