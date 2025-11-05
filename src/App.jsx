import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { initializeApp, setLogLevel } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

// --- GLOBAL VARIABLES ---
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : {};
const initialAuthToken =
  typeof __initial_auth_token !== "undefined"
    ? __initial_auth_token
    : null;

// --- HOOK: Firebase Setup ---
const useFirebase = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);

  useEffect(() => {
    if (!appInitialized && Object.keys(firebaseConfig).length > 0) {
      try {
        setLogLevel("debug");
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);

        setAuth(authInstance);
        setDb(dbInstance);

        const attemptSignIn = async () => {
          let user = null;

          if (initialAuthToken) {
            try {
              const userCredential = await signInWithCustomToken(
                authInstance,
                initialAuthToken
              );
              user = userCredential.user;
              console.log("Firebase: Signed in with Custom Token.");
            } catch (error) {
              console.error(
                "Firebase: Custom token sign-in failed. Falling back to anonymous.",
                error
              );
            }
          }

          if (!user) {
            try {
              const userCredential = await signInAnonymously(authInstance);
              user = userCredential.user;
              console.log("Firebase: Signed in anonymously.");
            } catch (error) {
              console.error("Firebase: Anonymous sign-in failed.", error);
            }
          }

          onAuthStateChanged(authInstance, (user) => {
            if (user) {
              setUserId(user.uid);
            } else {
              setUserId(null);
            }
            setIsAuthReady(true);
          });
        };

        attemptSignIn();
        setAppInitialized(true);
      } catch (e) {
        console.error("Firebase initialization error:", e);
        setIsAuthReady(true);
      }
    }
  }, [appInitialized]);

  return { db, auth, userId, isAuthReady };
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const { db, userId, isAuthReady } = useFirebase();
  const [activeTab, setActiveTab] = useState("Discussions");

  const renderContent = useMemo(() => {
    if (!isAuthReady) {
      return (
        <div className="flex justify-center items-center h-full text-lg text-indigo-600">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0
                c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Connecting to AuDHD Compass Backend...
        </div>
      );
    }

    if (!db || !userId) {
      return (
        <div className="flex justify-center items-center h-full p-8 text-center bg-red-50 text-red-800 border-red-300 border rounded-xl">
          <p className="font-semibold">
            Connection Error: Could not initialize Firebase or retrieve User ID.
            Please ensure your Firebase config is valid.
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case "Discussions":
        return <div className="p-8 text-gray-700">Discussions Tab Placeholder</div>;
      case "Chat":
        return <div className="p-8 text-gray-700">Chat Tab Placeholder</div>;
      case "Wiki":
        return <div className="p-8 text-gray-700">Wiki Tab Placeholder</div>;
      default:
        return null;
    }
  }, [isAuthReady, db, userId, activeTab]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">The AuDHD Compass</h1>
        <nav className="mt-3 space-x-4">
          {["Discussions", "Chat", "Wiki"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === tab
                  ? "bg-white text-indigo-600 font-semibold"
                  : "bg-indigo-500 hover:bg-indigo-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 p-6">{renderContent}</main>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-3 text-sm text-gray-600 border-t">
        © {new Date().getFullYear()} The AuDHD Compass. All Rights Reserved.
      </footer>
    </div>
  );
};

// --- EXPORT & RENDER MOUNT ---
export default App;

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
