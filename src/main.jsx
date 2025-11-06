import React from "react";
import "./index.css";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";

// ✅ Load Firebase config from window (injected by index.html)
const firebaseConfig =
  typeof window !== "undefined" && window.__firebase_config
    ? JSON.parse(window.__firebase_config)
    : {};

if (!firebaseConfig.apiKey) {
  console.error("❌ Firebase config missing! Check index.html <script> block.");
} else {
  console.log("✅ Firebase config loaded successfully in main.jsx");
}

// Mount the app
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
