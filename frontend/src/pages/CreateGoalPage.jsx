import React, { useState, useContext } from "react";
import Layout from "../components/Layout.jsx";
import "../styles/createGoal.css";
import { AppContext } from "../state/AppContext.jsx";

export default function CreateGoalPage() {
    const { goals, createGoal, updateGoal, deleteGoal, finishGoal, uploadFile } = useContext(AppContext);
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [deadline, setDeadline] = useState("");
    const [status, setStatus] = useState(null);
    const [editing, setEditing] = useState(null);
    const visibleGoals = (goals || []).filter(g => !g.completed);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!title.trim()) return;
        setStatus('saving');
            try {
                const g = await createGoal({ title: title.trim(), notes: notes.trim(), deadline: deadline || null });
            setTitle("");
            setNotes("");
            setDeadline('');
            setStatus('saved');
            setTimeout(() => setStatus(null), 1500);
        } catch (err) {
            setStatus('error:' + (err.message || 'failed'));
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this goal?')) return;
        try {
            await deleteGoal(id);
        } catch (err) {
            alert('Delete failed: ' + (err.message || 'error'));
        }
    }

    function startEdit(g) {
        setEditing(g);
        setTitle(g.title || '');
        setNotes(g.notes || '');
        setDeadline(g.deadline || '');
    }

    async function handleEditSave(e) {
        e.preventDefault();
        if (!editing) return;
        setStatus('saving');
            try {
            await updateGoal(editing.id, { title: title.trim(), notes: notes.trim(), deadline: deadline || null });
            setEditing(null);
            setTitle('');
            setNotes('');
            setDeadline('');
            setStatus('saved');
            setTimeout(() => setStatus(null), 1500);
        } catch (err) {
            setStatus('error:' + (err.message || 'failed'));
        }
    }

    async function handleFinish(id) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const f = e.target.files && e.target.files[0];
            if (!f) return;
            setStatus('uploading');
            try {
                const up = await uploadFile(f);
                const defaultDate = new Date().toISOString().slice(0,10);
                const inputDate = window.prompt('Enter completion date (YYYY-MM-DD) or leave blank for today:', defaultDate);
                if (inputDate === null) { setStatus(null); return; }
                const chosen = (inputDate.trim() === '') ? defaultDate : inputDate.trim();
                if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(chosen)) { throw new Error('invalid date format'); }
                await finishGoal(id, { imageUrl: up.url, date: chosen });
                setStatus('saved');
                setTimeout(() => setStatus(null), 1500);
            } catch (err) {
                setStatus('error:' + (err.message || 'failed'));
            }
        };
        input.click();
    }

    return (
        <Layout title="Create Goal">
            <form onSubmit={editing ? handleEditSave : handleSubmit} aria-labelledby="goalFormLabel">
                <h2 id="goalFormLabel">{editing ? 'Edit Goal' : 'New Goal'}</h2>
                <label htmlFor="goalTitle">Goal name</label>
                <input id="goalTitle" name="goalTitle" value={title} onChange={(e) => setTitle(e.target.value)} type="text" required aria-required="true" />
                <label htmlFor="goalNotes">Notes</label>
                <textarea id="goalNotes" name="goalNotes" rows="4" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                <label htmlFor="goalDeadline">Deadline</label>
                <input id="goalDeadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                <button type="submit">{editing ? 'Save changes' : 'Save goal'}</button>
                {editing && <button type="button" onClick={() => { setEditing(null); setTitle(''); setNotes(''); setDeadline(''); }}>Cancel</button>}
            </form>

            <div aria-live="polite" style={{ minHeight: 24, marginTop: 8 }}>{status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : (status && status.startsWith('error:') ? status.replace('error:', 'Error: ') : null)}</div>

            <section style={{ marginTop: 16 }}>
                <h3>Your goals</h3>
                {visibleGoals.length === 0 ? (
                    <p>No goals yet.</p>
                ) : (
                    <ul>
                        {visibleGoals.map((g) => (
                            <li key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <strong>{g.title}</strong>
                                    <div style={{ fontSize: 13 }}>{g.notes}</div>
                                    {g.deadline && <div style={{ fontSize: 12, color: '#666' }}>Deadline: {g.deadline}</div>}
                                    <div style={{ marginTop: 6 }}>
                                        {g.imageUrl ? (
                                            <>
                                                <img
                                                    src={g.imageUrl}
                                                    alt={g.title}
                                                    style={{ maxWidth: 120, maxHeight: 90, borderRadius: 8 }}
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const placeholder = e.currentTarget.nextElementSibling;
                                                        if (placeholder) placeholder.style.display = 'block';
                                                    }}
                                                />
                                                <div style={{ display: 'none', fontSize: 12, color: '#666' }}>Image unavailable</div>
                                            </>
                                        ) : (
                                            <div style={{ fontSize: 12, color: '#666' }}>No image uploaded</div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <button type="button" onClick={() => startEdit(g)} aria-label={`Edit ${g.title}`}>Edit</button>
                                    <button type="button" onClick={() => handleDelete(g.id)} aria-label={`Delete ${g.title}`}>Delete</button>
                                    <button type="button" onClick={() => handleFinish(g.id)} aria-label={`Finish ${g.title}`}>Finish</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </Layout>
    )
}