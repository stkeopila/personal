import React, { useState, useContext } from "react";
import Layout from "../components/Layout"
import "../styles/calendar.css"
import { AppContext } from "../state/AppContext.jsx";

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function CalendarPage() {
    const { events = {}, addEvent } = useContext(AppContext);
    const [selectedDay, setSelectedDay] = useState(null);
    const [note, setNote] = useState("");

    function dateKey(day) {
        return `2026-02-${String(day).padStart(2, "0")}`;
    }

    function handleDayClick(day) {
        setSelectedDay(day);
        setNote("");
    }

    function handleAddNote() {
        if (!selectedDay) return;
        const key = dateKey(selectedDay);
        addEvent(key, { id: Date.now(), text: note || "(no text)" });
        setNote("");
    }

    return (
        <Layout title="Calendar">
            <section className="calendar">
                <div className="calendar__title">February 2026</div>

                <div className="calendar__grid">
                    <div className="calendar__dow">Sun</div>
                    <div className="calendar__dow">Mon</div>
                    <div className="calendar__dow">Tue</div>
                    <div className="calendar__dow">Wed</div>
                    <div className="calendar__dow">Thu</div>
                    <div className="calendar__dow">Fri</div>
                    <div className="calendar__dow">Sat</div>

                    {DAYS.map((d) => {
                        const key = dateKey(d);
                        const dayEvents = events[key] || [];
                        return (
                            <div key={d} className={`calendar__day ${selectedDay === d ? "selected" : ""}`} onClick={() => handleDayClick(d)} style={{ position: "relative", cursor: "pointer" }}>
                                <div>{d}</div>
                                {dayEvents.length > 0 && <div className="calendar__badge">{dayEvents.length}</div>}
                            </div>
                        );
                    })}
                </div>

                <aside style={{ marginTop: 12 }}>
                    {selectedDay ? (
                        <div>
                            <h4>Selected: February {selectedDay}, 2026</h4>
                            <div>
                                <input placeholder="Add note" value={note} onChange={(e) => setNote(e.target.value)} />
                                <button onClick={handleAddNote} style={{ marginLeft: 8 }}>Add</button>
                            </div>

                            <div style={{ marginTop: 8 }}>
                                <strong>Events</strong>
                                <ul>
                                    {(events[dateKey(selectedDay)] || []).map((ev) => (
                                        <li key={ev.id}>{ev.text}</li>
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