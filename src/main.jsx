import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx"; // adjust path if App.jsx is elsewhere

// Mount React app
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
