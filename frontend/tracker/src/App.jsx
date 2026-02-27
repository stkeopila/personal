import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx"
import CreateGoalPage from "./pages/CreateGoalPage.jsx"
import UploadPicturePage from "./pages/UploadPicturePage.jsx";
// import CalendarPage from "./pages/CalendarPage.jsx"
// import UploadPicturePage from "./pages/UploadPicturePage.jsx"

export default function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/create-goal" element={<CreateGoalPage />} />
                    {/* <Route path="/calendar" element={<CalendarPage />} /> */}
                    <Route path="/upload" element={<UploadPicturePage />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}