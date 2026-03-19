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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const addGoal = (goal) => setGoals((prev) => [goal, ...prev]);

  const addEvent = (dateKey, event) => {
    setEvents((prev) => ({ ...prev, [dateKey]: [...(prev[dateKey] || []), event] }));
  };

  const API = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;
  const API_BASE = API.replace(/\/api\/?$/, '');

  function normalizeImageUrl(url) {
    if (!url) return null;
    const raw = String(url).trim();
    const uploadsIdx = raw.lastIndexOf('/uploads/');
    if (uploadsIdx >= 0) {
      const tail = raw.slice(uploadsIdx);
      return API_BASE + '/api' + tail;
    }
    const winUploadsIdx = raw.toLowerCase().lastIndexOf('\\uploads\\');
    if (winUploadsIdx >= 0) {
      const tail = raw.slice(winUploadsIdx + 1).replace(/\\/g, '/');
      return `${API_BASE}/api/${tail}`;
    }
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      try {
        const u = new URL(raw);
        const currentHost = window.location.hostname;
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === currentHost) {
          if (u.pathname.startsWith('/uploads/')) return API_BASE + '/api' + u.pathname;
          if (u.pathname.startsWith('/api/uploads/')) return API_BASE + u.pathname;
          return API_BASE + u.pathname;
        }
      } catch (e) {
      }
      return raw;
    }
    if (raw.startsWith('/api/uploads/')) return API_BASE + raw;
    if (raw.startsWith('/uploads/')) return API_BASE + '/api' + raw;
    if (raw.startsWith('/')) return API_BASE + raw;
    if (raw.startsWith('uploads/')) return `${API_BASE}/api/${raw}`;
    return `${API_BASE}/${raw}`;
  }

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
    const { token } = data;
    sessionStorage.setItem('jwt', token);
    try {
      const meRes = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (meRes.ok) {
        const me = await meRes.json();
        setUser(me);
      } else {
        setUser({ id: data.user.id, username: data.user.username });
      }
      await fetchData(token);
    } catch (e) {
      setUser({ id: data.user.id, username: data.user.username });
    }
    return data.user;
  };

  const logout = () => setUser(null);

  const doLogout = () => {
    sessionStorage.removeItem('jwt');
    setUser(null);

    setGoals(initialGoals);
    setEvents(initialEvents);
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
        await fetchData(token);
      } catch (e) {
      }
    })();
  }, []);

  async function fetchData(token) {
    const t = token || sessionStorage.getItem('jwt');
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const [gRes, eRes] = await Promise.all([
        fetch(`${API}/goals`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API}/events`, { headers: { Authorization: `Bearer ${t}` } }),
      ]);
      if (!gRes.ok) throw new Error('failed to load goals');
      if (!eRes.ok) throw new Error('failed to load events');
      const goalsData = await gRes.json();
      const eventsData = await eRes.json();
      setGoals(goalsData.map(g => ({ id: g.id, title: g.title, notes: g.notes, deadline: g.deadline || null, imageUrl: normalizeImageUrl(g.imageUrl || null), completed: g.completed || false })));
      const eventsMap = {};
      eventsData.forEach(ev => {
        if (!eventsMap[ev.date]) eventsMap[ev.date] = [];
        eventsMap[ev.date].push({ id: ev.id, text: ev.text, imageUrl: normalizeImageUrl(ev.imageUrl || null), goalId: ev.goalId || null });
      });
      setEvents(eventsMap);
    } catch (e) {
      setError(e.message || 'failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const createGoal = async ({ title, notes, deadline, imageUrl }) => {
    const token = sessionStorage.getItem('jwt');
    if (!token) throw new Error('not authenticated');
    const res = await fetch(`${API}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, notes, deadline, imageUrl }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'create goal failed');
    }
    const g = await res.json();
    setGoals((prev) => [{ id: g.id, title: g.title, notes: g.notes, deadline: g.deadline || null, imageUrl: normalizeImageUrl(g.imageUrl || null) }, ...prev]);
      try { await refreshProfile(); } catch (e) {}
    return g;
  };

  const uploadFile = async (file) => {
    const token = sessionStorage.getItem('jwt');
    if (!token) throw new Error('not authenticated');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'upload failed');
    }
    return await res.json();
  };

  const deleteGoal = async (id) => {
    const token = sessionStorage.getItem('jwt');
    if (!token) throw new Error('not authenticated');
    const res = await fetch(`${API}/goals/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'delete failed');
    }
    setGoals((prev) => prev.filter(g => g.id !== id));
  };

  const updateGoal = async (id, { title, notes, deadline, imageUrl }) => {
    const token = sessionStorage.getItem('jwt');
    if (!token) throw new Error('not authenticated');
    const res = await fetch(`${API}/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, notes, deadline, imageUrl }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'update failed');
    }
    const g = await res.json();
    setGoals((prev) => prev.map(x => x.id === id ? { id: g.id, title: g.title, notes: g.notes, deadline: g.deadline || null, imageUrl: normalizeImageUrl(g.imageUrl || null), completed: g.completed } : x));
    return g;
  };

  const finishGoal = async (id, { imageUrl = null, date = null } = {}) => {
    const token = sessionStorage.getItem('jwt');
    if (!token) throw new Error('not authenticated');
    const res = await fetch(`${API}/goals/${id}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ imageUrl, date }) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'complete failed');
    }
    const g = await res.json();
    setGoals((prev) => prev.filter(x => x.id !== id));
    try { await refreshProfile(); } catch (e) {}
    try { await fetchData(); } catch (e) {}
    return g;
  };

    async function refreshProfile() {
      const token = sessionStorage.getItem('jwt');
      if (!token) return;
      try {
        const res = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const me = await res.json();
        setUser(me);
      } catch (e) {
      }
    }
  const createEvent = async ({ date, text }) => {
    const token = sessionStorage.getItem('jwt');
    if (!token) throw new Error('not authenticated');
    const res = await fetch(`${API}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ date, text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'create event failed');
    }
    const ev = await res.json();
    setEvents((prev) => ({ ...prev, [date]: [...(prev[date] || []), { id: ev.id, text: ev.text }] }));
    return ev;
  };

  return (
    <AppContext.Provider value={{ goals, createGoal, updateGoal, deleteGoal, finishGoal, uploadFile, events, createEvent, user, login, logout: doLogout, darkMode, toggleDark, loading, error }}>
      {children}
    </AppContext.Provider>
  );
}
