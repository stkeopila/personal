import React, { createContext, useState, useEffect } from "react";

export const AppContext = createContext(null);

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

  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  const login = async ({ username, password }) => {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'login failed');
    }
    const data = await res.json();
    const { token, user: profile } = data;
    sessionStorage.setItem('jwt', token);
    setUser(profile);
    return profile;
  };

  const logout = () => setUser(null);

  const doLogout = () => {
    sessionStorage.removeItem('jwt');
    setUser(null);
  }

  const toggleDark = () => setDarkMode((v) => !v);

  useEffect(() => {
    const cls = document.documentElement.classList;
    if (darkMode) cls.add("dark"); else cls.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    const token = sessionStorage.getItem('jwt');
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const profile = await res.json();
        setUser(profile);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  return (
    <AppContext.Provider value={{ goals, addGoal, events, addEvent, user, login, logout: doLogout, darkMode, toggleDark }}>
      {children}
    </AppContext.Provider>
  );
}
