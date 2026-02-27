import React, { useState, useContext } from "react";
import Layout from "../components/Layout";
import "../styles/createGoal.css";
import { AppContext } from "../state/AppContext.jsx";

export default function CreateGoalPage() {
    const { goals, addGoal } = useContext(AppContext);
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");

    function handleSubmit(e) {
        e.preventDefault();
        if (!title.trim()) return;
        addGoal({ id: Date.now(), title: title.trim(), notes: notes.trim() });
        setTitle("");
        setNotes("");
    }

    return (
        <Layout title="Create Goal">
            <form onSubmit={handleSubmit}>
                <label htmlFor="goalTitle">Goal name</label>
                <input id="goalTitle" name="goalTitle" value={title} onChange={(e) => setTitle(e.target.value)} type="text" required />
                <label htmlFor="goalNotes">Notes</label>
                <textarea id="goalNotes" name="goalNotes" rows="4" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                <button type="submit">Save goal</button>
            </form>

            <section style={{ marginTop: 16 }}>
                <h3>Your goals</h3>
                {goals.length === 0 ? (
                    <p>No goals yet.</p>
                ) : (
                    <ul>
                        {goals.map((g) => (
                            <li key={g.id}><strong>{g.title}</strong>: {g.notes}</li>
                        ))}
                    </ul>
                )}
            </section>
        </Layout>
    )
}