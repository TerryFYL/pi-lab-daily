import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Use HashRouter for static deployments (GitHub Pages), BrowserRouter otherwise
const isStaticDeploy =
  window.location.hostname.includes("github.io") ||
  window.location.hostname.includes("pages.dev") ||
  import.meta.env.VITE_DEMO === "true";

const Router = isStaticDeploy ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
