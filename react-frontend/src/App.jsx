import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import StudentLogin from "./components/Login/StudentLogin";
import TeacherLogin from "./components/Login/TeacherLogin";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StudentLogin />} />
        <Route path="/teacher" element={<TeacherLogin />} />
      </Routes>
    </Router>
  );
}

export default App;
