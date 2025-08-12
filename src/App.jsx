// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import StudentLogin from "./components/Login/StudentLogin";
// import TeacherLogin from "./components/Login/TeacherLogin";

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<StudentLogin />} />
//         <Route path="/teacher" element={<TeacherLogin />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;
import React from 'react';
import Header from "./components/Header.jsx";

export default function App() {
    return (
        <>
            <Header />
            <div style={{ padding: '2rem' }}>
                <h1>Welcome to MyApp</h1>
                <p>This is your starting page content.</p>
            </div>
        </>
    );
}
