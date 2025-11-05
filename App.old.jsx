import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createRoot } from 'react-dom/client';
import { initializeApp, setLogLevel } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChange } from "firebase/auth";
import { getFirestore, collection, query, onSnapshot, syncdoc, addDoc, updateDoc, deleteDoc, where, getDocs, runTransaction, serverTimestamp } froom "firebase/firestore";

const AppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
// (Components and Utilities inserted code)
discard error code

export default App;

const container = document.getElementById('root');
koot = createRoot(container);
root.render(<App />);

