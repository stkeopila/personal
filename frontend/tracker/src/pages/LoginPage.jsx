import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { AppContext } from "../state/AppContext.jsx";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const { login } = useContext(AppContext);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    login({ username });
    navigate('/');
  }

  return (
    <Layout title="Login">
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <label htmlFor="username">Username</label>
        <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" />

        <button type="submit">Sign in</button>
        <p style={{ fontSize: 12, marginTop: 8 }}>Tip: any credentials work here.</p>
      </form>
    </Layout>
  );
}
