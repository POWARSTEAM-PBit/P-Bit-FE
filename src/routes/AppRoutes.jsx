import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import TeacherDashboard from "../pages/TeacherDashboard";
import CreateClass from "../pages/CreateClass.jsx";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      {/* fixed header */}
      <Header />
      <Routes>
        {/* main page redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* The Pages */}
        <Route path="/dashboard" element={<TeacherDashboard />} />
        <Route path="/create-class" element={<CreateClass />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}



