import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { AppContext } from "../state/AppContext.jsx";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useContext(AppContext);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await login({ username, password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  }

  return (
    <Layout title="Login">
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <label htmlFor="username">Username</label>
        <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button type="submit">Sign in</button>
        {error && <p style={{ color: 'crimson', marginTop: 8 }}>{error}</p>}
        <p style={{ fontSize: 13, marginTop: 8 }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </Layout>
  );
}
