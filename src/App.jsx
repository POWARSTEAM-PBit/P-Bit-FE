import React from 'react';
import Header from "./components/Header.jsx";

export default function App() {
    return (
        <>
            <Header />
            <div style={{ padding: '2rem' }}>
                <h1>Welcome to MyApp</h1>
                <p>Hi! This is your starting page content.</p>
            </div>
        </>
    );
}
