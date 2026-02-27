import React, { useContext } from "react";
import Layout from "../components/Layout";
import "../styles/home.css"
import { AppContext } from "../state/AppContext.jsx";

export default function HomePage() {
    const { goals } = useContext(AppContext);

    return (
        <Layout title="Disciplinary">
            <h2>Streak</h2>
            <h3>Current Goals</h3>
            <ul>
                {goals.map((g) => (
                    <li key={g.id}><strong>{g.title}</strong> — {g.notes}</li>
                ))}
            </ul>
        </Layout>
    );
}