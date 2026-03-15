import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx"
import CreateGoalPage from "./pages/CreateGoalPage.jsx"
import UploadPicturePage from "./pages/UploadPicturePage.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import { AppProvider } from "./state/AppContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

export default function App() {
    return (
        <>
            <AppProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/create-goal" element={<CreateGoalPage />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/upload" element={<UploadPicturePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                    </Routes>
                </BrowserRouter>
            </AppProvider>
        </>
    );
}