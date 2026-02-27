import React from "react";
import { NavLink } from "react-router-dom"

const navItems = [
    { to: "/", label: "Home" },
    { to: "/create-goal", label: "Create Goal" },
    { to: "/calendar", label: "Calendar" },
    { to: "/upload", label: "Upload Picture" },
];

export default function Nav() {
    return (
        <>
            <nav>
                <ul>
                    {navItems.map((item) => (
                        <li key={item.to}>
                            <NavLink to={item.to} end>{item.label}</NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}