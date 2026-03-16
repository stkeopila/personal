import React, { useContext } from "react";
import Header from "./Header.jsx";
import { AppContext } from "../state/AppContext.jsx";

export default function Layout({ title, children }) {
    const { loading, error } = useContext(AppContext);
    return (
        <>
            <Header title={title} />
            {loading && <div style={{ background: '#fffae6', padding: 8, textAlign: 'center' }}>Loading...</div>}
            {error && <div style={{ background: '#ffe6e6', color: '#900', padding: 8, textAlign: 'center' }}>Error: {error}</div>}
            <main className="container">{children}</main>
            <footer />
        </>
    );
}