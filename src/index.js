/**
 * @fileoverview Main entry point for the WisdomAI frontend application.
 * Renders the root React component into the DOM.
 */

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";

/**
 * Renders the WisdomAI application into the DOM.
 * Uses React.StrictMode for additional development checks.
 */
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
