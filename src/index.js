/**
 * @fileoverview Main entry point for the WisdomAI frontend application.
 * Renders the root React component into the DOM.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * Renders the WisdomAI application into the DOM.
 * Uses React.StrictMode for additional development checks.
 */
const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
