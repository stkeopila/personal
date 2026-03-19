import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'register failed');
      }
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Register">
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <label htmlFor="username">Username</label>
        <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button type="submit">Create account</button>
        {error && <p style={{ color: 'crimson', marginTop: 8 }}>{error}</p>}
      </form>
    </Layout>
  );
}
