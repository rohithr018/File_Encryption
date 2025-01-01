import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Create root element
const rootElement = document.getElementById("root");
if (!rootElement) {
    throw new Error("Root element not found. Ensure index.html contains a div with id='root'.");
}

// Render the application
createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);
