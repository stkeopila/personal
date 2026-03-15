import React, { useContext } from "react";
import Nav from "./Nav.jsx"
import { AppContext } from "../state/AppContext.jsx";

export default function Header({ title }) {
    const { user, darkMode, toggleDark } = useContext(AppContext);

    return (
        <>
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <h1 style={{ margin: 0 }}>{title}</h1>
                    <Nav />
                </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button aria-pressed={darkMode} onClick={toggleDark} aria-label="Toggle dark mode">
                                    {darkMode ? "Light" : "Dark"} mode
                                </button>
                                {user ? <span>Signed in: {user.username || user.name || user.email}</span> : <span>Not signed in</span>}
                            </div>
            </header>
        </>
    )
}