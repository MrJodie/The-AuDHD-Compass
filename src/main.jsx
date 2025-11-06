import React from "react";
const firebaseConfig = {
  apiKey: "AIzaSyBW9VXbx-ay4AHtfjwhhUYZbXAP2zeg6aA",
  authDomain: "the-audhd-compass.firebaseapp.com",
  projectId: "the-audhd-compass",
  storageBucket: "the-audhd-compass.firebasestorage.app",
  messagingSenderId: "914395451965",
  appId: "1:914395451965:web:090b487d400487280ad054",
  measurementId: "G-QYXW4VCD99"
};

// 👇 This makes it visible to your App.jsx’s Firebase logic
window.__firebase_config = JSON.stringify(firebaseConfig);

import { createRoot } from "react-dom/client";
import App from "./app.jsx"; // adjust path if app.jsx is elsewhere

// Mount React app
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
