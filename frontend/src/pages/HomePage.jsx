import React, { useContext } from "react";
import Layout from "../components/Layout.jsx";
import "../styles/home.css"
import { AppContext } from "../state/AppContext.jsx";

export default function HomePage() {
    const { goals, deleteGoal, finishGoal, uploadFile, user } = useContext(AppContext);

    async function handleDelete(id, title) {
        if (!confirm(`Delete goal "${title}"?`)) return;
        try {
            await deleteGoal(id);
        } catch (e) {
            alert('Delete failed: ' + (e.message || 'error'));
        }
    }

    const streak = (user || {}).streakCount || 0;

    return (
        <Layout title="Disciplinary">
            <h2>Streak: {streak}</h2>
            <h3>Current Goals</h3>
            <ul>
                {goals.map((g) => (
                    <li key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <strong>{g.title}</strong>
                            <div style={{ fontSize: 13 }}>{g.notes}</div>
                            {g.deadline && <div style={{ fontSize: 12, color: '#666' }}>Deadline: {g.deadline}</div>}
                            {g.imageUrl && <div style={{ marginTop: 6 }}><img src={g.imageUrl} alt={g.title} style={{ maxWidth: 120, maxHeight: 90, borderRadius: 8 }} /></div>}
                        </div>
                        <div>
                            <button onClick={() => window.location.href = '/create-goal'} aria-label={`Edit ${g.title}`}>Edit</button>
                            <button onClick={() => handleDelete(g.id, g.title)} aria-label={`Delete ${g.title}`}>Delete</button>
                            <button onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = async (e) => {
                                    const f = e.target.files && e.target.files[0];
                                    if (!f) return;
                                    try {
                                        const up = await uploadFile(f);
                                        const today = new Date().toISOString().slice(0,10);
                                        await finishGoal(g.id, { imageUrl: up.url, date: today });
                                    } catch (err) {
                                        alert('Finish failed: ' + (err.message || 'error'));
                                    }
                                };
                                input.click();
                            }} aria-label={`Finish ${g.title}`}>Finish</button>
                        </div>
                    </li>
                ))}
            </ul>
        </Layout>
    );
}