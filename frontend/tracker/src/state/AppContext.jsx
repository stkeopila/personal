import React, { createContext, useState, useEffect } from "react";

export const AppContext = createContext(null);

// Seed mock data (three goals + three events)
const initialGoals = [
  { id: 1, title: "Daily run", notes: "Run 3 miles" },
  { id: 2, title: "Read", notes: "Read 30 pages" },
  { id: 3, title: "Meditate", notes: "10 minutes" },
];

const initialEvents = {
  "2026-02-03": [{ id: 101, text: "Doctor appointment" }],
  "2026-02-14": [{ id: 102, text: "Valentine's dinner" }],
  "2026-02-20": [{ id: 103, text: "Project deadline" }],
};

export function AppProvider({ children }) {
  const [goals, setGoals] = useState(initialGoals);
  const [events, setEvents] = useState(initialEvents);
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const addGoal = (goal) => setGoals((prev) => [goal, ...prev]);

  const addEvent = (dateKey, event) => {
    setEvents((prev) => ({ ...prev, [dateKey]: [...(prev[dateKey] || []), event] }));
  };

  const login = ({ username }) => {
    const profile = { id: Date.now(), name: username || "Guest", email: `${username || "guest"}@example.com` };
    setUser(profile);
  };

  const logout = () => setUser(null);

  const toggleDark = () => setDarkMode((v) => !v);

  useEffect(() => {
    const cls = document.documentElement.classList;
    if (darkMode) cls.add("dark"); else cls.remove("dark");
  }, [darkMode]);

  return (
    <AppContext.Provider value={{ goals, addGoal, events, addEvent, user, login, logout, darkMode, toggleDark }}>
      {children}
    </AppContext.Provider>
  );
}
