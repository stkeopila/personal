import React, { useState, useContext, useMemo } from "react";
import Layout from "../components/Layout.jsx"
import "../styles/calendar.css"
import { AppContext } from "../state/AppContext.jsx";

const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function monthName(m) {
    return ["January","February","March","April","May","June","July","August","September","October","November","December"][m] || '';
}

export default function CalendarPage() {
    const { events = {}, createEvent } = useContext(AppContext);
    const today = new Date();
    const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDay, setSelectedDay] = useState(null);
    const [note, setNote] = useState("");

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
    const firstWeekday = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);

    function dateKey(day) {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    function handleDayClick(day) {
        setSelectedDay(day);
        setNote('');
    }

    async function handleAddNote() {
        if (!selectedDay) return;
        const key = dateKey(selectedDay);
        try {
            await createEvent({ date: key, text: note || '(no text)' });
            setNote('');
        } catch (e) {
            alert('Failed to add event: ' + (e.message || e));
        }
    }

    function gotoPrev() {
        setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
        setSelectedDay(null);
    }
    function gotoNext() {
        setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
        setSelectedDay(null);
    }

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <Layout title="Calendar">
            <section className="calendar">
                <div className="calendar__title">
                    <button onClick={gotoPrev} aria-label="Previous month">◀</button>
                    <span style={{ margin: '0 12px' }}>{monthName(month)} {year}</span>
                    <button onClick={gotoNext} aria-label="Next month">▶</button>
                </div>

                <div className="calendar__grid">
                    {WEEK_DAYS.map(d => <div key={d} className="calendar__dow">{d}</div>)}

                    {cells.map((cell, idx) => {
                        if (cell === null) return <div key={`b${idx}`} className="calendar__day empty" />;
                        const key = dateKey(cell);
                        const dayEvents = events[key] || [];
                        return (
                            <div key={key} className={`calendar__day ${selectedDay === cell ? "selected" : ""}`} onClick={() => handleDayClick(cell)} style={{ position: "relative", cursor: "pointer" }}>
                                <div>{cell}</div>
                                {dayEvents.length > 0 && <div className="calendar__badge">{dayEvents.length}</div>}
                            </div>
                        );
                    })}
                </div>

                <aside style={{ marginTop: 12 }}>
                    {selectedDay ? (
                        <div>
                            <h4>Selected: {monthName(month)} {selectedDay}, {year}</h4>
                            <div>
                                <input placeholder="Add note" value={note} onChange={(e) => setNote(e.target.value)} />
                                <button onClick={handleAddNote} style={{ marginLeft: 8 }}>Add</button>
                            </div>

                            <div style={{ marginTop: 8 }}>
                                <strong>Events</strong>
                                <ul>
                                    {(events[dateKey(selectedDay)] || []).map((ev) => (
                                        <li key={ev.id} style={{ marginBottom: 8 }}>
                                            <div>{ev.text}</div>
                                            {ev.imageUrl && <img src={ev.imageUrl} alt={ev.text} style={{ maxWidth: 200, display: 'block', marginTop: 6, borderRadius: 8 }} />}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <p>Click a day to view or add events.</p>
                    )}
                </aside>
            </section>
        </Layout>
    )
}