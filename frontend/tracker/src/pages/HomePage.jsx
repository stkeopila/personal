import React from "react";

import Layout from "../components/Layout";
import "../styles/home.css"

export default function HomePage() {
    return (
        <Layout title="Disciplinary">
            <h2>Streak</h2>
            <h3>Current Goals</h3>
            <ul>
                <li> Goal 1</li>
                <li> Goal 2</li>
                <li> Goal 3</li>

            </ul>
        </Layout>
    );
}