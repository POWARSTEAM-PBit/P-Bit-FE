import React from 'react';
import Header from "./components/Header.jsx";
import Register from "./pages/Register.jsx"; // 新增的注册页
export default function App() {
  return (
    <>
      <Header />
      <div style={{padding: 12, color: 'yellow'}}>APP from NEW App.jsx</div>
      <Register />
    </>
  );
}
