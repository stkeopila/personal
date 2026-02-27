import React from "react";
import Nav from "./Nav"

export default function Header({ title }) {
    return (
        <>
            <header>
                <h1>{title}</h1>
                <Nav />
            </header>
        </>
    )
}