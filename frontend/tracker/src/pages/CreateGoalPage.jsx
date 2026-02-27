import React from "react";
import Layout from "../components/Layout";
import "../styles/createGoal.css";

export default function CreateGoalPage() {
    return (
        <Layout title="Create Goal">
            <form action="#" method="post">
                <label for="goalTitle">Goal name</label>
                <input id="goalTitle" name="goalTitle" type="text" required />
                <label for="goalNotes">Notes</label>
                <textarea id="goalNotes" name="goalNotes" rows="4"></textarea>
                <button type="submit">Save goal</button>
            </form>
        </Layout>
    )
}