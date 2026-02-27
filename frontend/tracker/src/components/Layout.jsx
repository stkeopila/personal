import React from "react";
import Header from "./Header" 

export default function Layour ({ title, children }) {
    return (
        <>
            <Header title={title}/>
            <main>{children}</main>
            <footer />
        </>
    );
}