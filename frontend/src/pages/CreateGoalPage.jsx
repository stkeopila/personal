import React, { useState, useContext } from "react";
import Layout from "../components/Layout.jsx";
import "../styles/createGoal.css";
import { AppContext } from "../state/AppContext.jsx";

export default function CreateGoalPage() {
    const { goals, createGoal, updateGoal, deleteGoal, finishGoal, uploadFile } = useContext(AppContext);
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [deadline, setDeadline] = useState("");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [status, setStatus] = useState(null);
    const [editing, setEditing] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!title.trim()) return;
        setStatus('saving');
        try {
            let imageUrl = null;
            if (file) {
                const up = await uploadFile(file);
                imageUrl = up.url;
            }
            const g = await createGoal({ title: title.trim(), notes: notes.trim(), deadline: deadline || null, imageUrl });
            setTitle("");
            setNotes("");
            setDeadline('');
            setFile(null);
            setPreview(null);
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
        setPreview(g.imageUrl || null);
    }

    async function handleEditSave(e) {
        e.preventDefault();
        if (!editing) return;
        setStatus('saving');
        try {
            let imageUrl = preview;
            if (file) {
                const up = await uploadFile(file);
                imageUrl = up.url;
            }
            await updateGoal(editing.id, { title: title.trim(), notes: notes.trim(), deadline: deadline || null, imageUrl });
            setEditing(null);
            setTitle('');
            setNotes('');
            setDeadline('');
            setFile(null);
            setPreview(null);
            setStatus('saved');
            setTimeout(() => setStatus(null), 1500);
        } catch (err) {
            setStatus('error:' + (err.message || 'failed'));
        }
    }

    function handleFileChange(e) {
        const f = e.target.files && e.target.files[0];
        if (!f) return setFile(null);
        setFile(f);
        try {
            const url = URL.createObjectURL(f);
            setPreview(url);
        } catch (e) {
            setPreview(null);
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
                const today = new Date().toISOString().slice(0,10);
                await finishGoal(id, { imageUrl: up.url, date: today });
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
                <label htmlFor="goalImage">Picture (optional)</label>
                <input id="goalImage" type="file" accept="image/*" onChange={handleFileChange} />
                {preview && <div style={{ marginTop: 8 }}><img src={preview} alt="preview" style={{ maxWidth: 160, maxHeight: 120, borderRadius: 8 }} /></div>}
                <button type="submit">{editing ? 'Save changes' : 'Save goal'}</button>
                {editing && <button type="button" onClick={() => { setEditing(null); setTitle(''); setNotes(''); setDeadline(''); setFile(null); setPreview(null); }}>Cancel</button>}
            </form>

            <div aria-live="polite" style={{ minHeight: 24, marginTop: 8 }}>{status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : (status && status.startsWith('error:') ? status.replace('error:', 'Error: ') : null)}</div>

            <section style={{ marginTop: 16 }}>
                <h3>Your goals</h3>
                {goals.length === 0 ? (
                    <p>No goals yet.</p>
                ) : (
                    <ul>
                        {goals.map((g) => (
                            <li key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <strong>{g.title}</strong>
                                    <div style={{ fontSize: 13 }}>{g.notes}</div>
                                    {g.deadline && <div style={{ fontSize: 12, color: '#666' }}>Deadline: {g.deadline}</div>}
                                    {g.imageUrl && <div style={{ marginTop: 6 }}><img src={g.imageUrl} alt={g.title} style={{ maxWidth: 120, maxHeight: 90, borderRadius: 8 }} /></div>}
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