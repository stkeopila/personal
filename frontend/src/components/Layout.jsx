import React from "react";
import Header from "./Header.jsx";

export default function Layout({ title, children }) {
    return (
        <>
            <Header title={title} />
            <main className="container">{children}</main>
            <footer />
        </>
    );
}