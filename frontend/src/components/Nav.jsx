import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom"
import { AppContext } from "../state/AppContext.jsx";

const navItems = [
    { to: "/", label: "Home" },
    { to: "/create-goal", label: "Create Goal" },
    { to: "/calendar", label: "Calendar" },
    { to: "/upload", label: "Upload Picture" },
];

export default function Nav() {
    const { user, logout } = useContext(AppContext);
    const navigate = useNavigate();

    return (
        <>
            <nav>
                <ul style={{ display: "flex", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
                    {navItems.map((item) => (
                        <li key={item.to}>
                            <NavLink to={item.to} end>{item.label}</NavLink>
                        </li>
                    ))}
                    {!user ? (
                        <li>
                            <NavLink to="/login">Login</NavLink>
                        </li>
                    ) : (
                        <li>
                            <button onClick={() => { logout(); navigate('/'); }}>Logout</button>
                        </li>
                    )}
                </ul>
            </nav>
        </>
    );
}