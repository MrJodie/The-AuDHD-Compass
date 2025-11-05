import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createRoot } from 'react-dom/client';
import { initializeApp, setLogLevel } from "firebase/app";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged 
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
    serverTimestamp 
} from "firebase/firestore";

// --- GLOBAL VARIABLES (Provided by the Canvas Environment) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- CONSTANTS ---
const tabs = ['Discussions', 'Chat', 'Wiki'];
const DISCUSSION_CATEGORIES = [
    'Executive Functioning Hacks',
    'Sensory & Meltdown Management',
    'Medications & Treatments',
    'Late Diagnosis & Identity',
    'Social & Masking Strategies',
    'Hyperfixations & Special Interests',
    'Family & Relationships',
    'Scientific Research & News',
    'Emotional Regulation',
];

// --- COMPONENTS START ---
const useFirebase = () => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [appInitialized, setAppInitialized] = useState(false);

    useEffect(() => {
        if (!appInitialized && Object.keys(firebaseConfig).length > 0) {
            try {
                setLogLevel('debug');
                const app = initializeApp(firebaseConfig);
                const authInstance = getAuth(app);
                const dbInstance = getFirestore(app);

                setAuth(authInstance);
                setDb(dbInstance);

                const attemptSignIn = async () => {
                    let user = null;
                    
                    if (initialAuthToken) {
                        try {
                            const userCredential = await signInWithCustomToken(authInstance, initialAuthToken);
                            user = userCredential.user;
                            console.log("Firebase: Signed in with Custom Token.");
                        } catch (error) {
                            console.error("Firebase: Custom token sign-in failed. Falling back to anonymous.", error);
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
const CommentRenderer = React.memo(({ comment, allComments, db, userId, threadId }) => {
    const isOwner = comment.userId === userId;
    const [replyText, setReplyText] = useState('');
    const [showReplyForm, setShowReplyForm] = useState(false);

    const handlePostReply = async () => {
        if (!replyText.trim() || !threadId || !userId) return;

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/community_threads/${threadId}/comments`), {
                content: replyText.trim(),
                userId: userId,
                timestamp: serverTimestamp(),
                parentId: comment.id,
            });
            setReplyText('');
            setShowReplyForm(false);
        } catch (error) {
            console.error("Error posting reply:", error);
        }
    };

    const childComments = allComments.filter(c => c.parentId === comment.id);

    return (
        <div className="mt-2 pl-4 border-l-2 border-indigo-200">
            <div className={`p-3 rounded-lg shadow-sm ${isOwner ? 'bg-indigo-50 border border-indigo-300' : 'bg-white border border-gray-200'}`}>
                <p className="text-sm font-medium text-gray-800 break-words">{comment.content}</p>
                <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
                    <span className="font-mono text-xs">User: {comment.userId.substring(0, 8)}...</span>
                    <button 
                        onClick={() => setShowReplyForm(!showReplyForm)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold transition duration-150"
                    >
                        {showReplyForm ? 'Cancel Reply' : 'Reply'}
                    </button>
                </div>
            </div>

            {showReplyForm && (
                <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Replying to ${comment.userId.substring(0, 8)}...`}
                        rows="3"
                        className="w-full p-2 text-sm border border-indigo-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    ></textarea>
                    <button
                        onClick={handlePostReply}
                        className="mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition duration-200 shadow-md"
                    >
                        Post Reply
                    </button>
                </div>
            )}

            {childComments.length > 0 && (
                <div className="mt-4 space-y-2">
                    {childComments.sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)).map(child => (
                        <CommentRenderer 
                            key={child.id} 
                            comment={child} 
                            allComments={allComments} 
                            db={db} 
                            userId={userId} 
                            threadId={threadId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});
const CommentComposer = ({ db, userId, threadId }) => {
    const [content, setContent] = useState('');

    const handleSubmit = async () => {
        if (!content.trim()) return;

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/community_threads/${threadId}/comments`), {
                content: content.trim(),
                userId,
                timestamp: serverTimestamp(),
            });
            setContent('');
        } catch (error) {
            console.error("Error posting comment:", error);
        }
    };

    return (
        <div>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a comment..."
                rows="3"
                className="w-full p-2 border rounded-lg resize-none"
            />
            <button
                onClick={handleSubmit}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
                Post Comment
            </button>
        </div>
    );
};
const Discussions = ({ db, userId }) => {
    const [selectedCategory, setSelectedCategory] = useState(DISCUSSION_CATEGORIES[0]);
    const [threads, setThreads] = useState([]);
    const [allComments, setAllComments] = useState([]); // <-- changed from {} to []
    const [showNewThreadModal, setShowNewThreadModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [selectedThread, setSelectedThread] = useState(null);

    useEffect(() => {
        if (!db) return;

        const threadsRef = collection(db, `artifacts/${appId}/public/data/community_threads`);
        const q = query(threadsRef, where('category', '==', selectedCategory));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedThreads = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
            }));
            setThreads(fetchedThreads.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)));
        }, (error) => {
            console.error("Error fetching threads:", error);
        });

        return () => unsubscribe();
    }, [db, selectedCategory]);

    useEffect(() => {
        if (!db) return;

        const commentsRef = collection(db, `artifacts/${appId}/public/data/community_threads`);
        const q = query(commentsRef, where('parentId', '==', null));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
            }));
            setAllComments(fetchedComments.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)));
        }, (error) => {
            console.error("Error fetching comments:", error);
        });

        return () => unsubscribe();
    }, [db]);

    const handleNewThread = async () => {
        if (!newTitle.trim() || !newContent.trim()) return;

        try {
            const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/community_threads`), {
                title: newTitle.trim(),
                content: newContent.trim(),
                userId,
                timestamp: serverTimestamp(),
                category: selectedCategory,
            });
            console.log("New thread created with ID:", docRef.id);
            setNewTitle('');
            setNewContent('');
            setShowNewThreadModal(false);
        } catch (error) {
            console.error("Error creating new thread:", error);
        }
    };

    if (selectedThread) {
        const topLevelComments = allComments
            .filter(c => !c.parentId)
            .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));

        return (
            <div className="p-4 bg-gray-50 min-h-[70vh]">
                <button
                    onClick={() => setSelectedThread(null)}
                    className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center transition duration-150"
                >
                    &larr; Back to {selectedCategory}
                </button>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedThread.title}</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Posted by <span className="font-mono text-indigo-600">{selectedThread.userId.substring(0, 8)}...</span> on {selectedThread.timestamp?.toLocaleDateString()}
                    </p>
                    <div className="prose max-w-none text-gray-700 border-l-4 border-indigo-400 pl-4 py-2 bg-indigo-50/50 rounded-md">
                        <p className="whitespace-pre-wrap">{selectedThread.content}</p>
                    </div>
                </div>
                
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Comments ({topLevelComments.length})</h3>
                    <div className="space-y-4">
                        {topLevelComments.length === 0 && (
                            <p className="text-gray-500 text-sm italic">No comments yet. Be the first to comment!</p>
                        )}
                        {topLevelComments.map(comment => (
                            <CommentRenderer 
                                key={comment.id} 
                                comment={comment} 
                                allComments={allComments} 
                                db={db} 
                                userId={userId} 
                                threadId={selectedThread.id}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Post a Comment</h3>
                    <CommentComposer db={db} userId={userId} threadId={selectedThread.id} />
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedCategory}</h2>
                <button
                    onClick={() => setShowNewThreadModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-150"
                >
                    New Thread
                </button>
            </div>

            {threads.length === 0 ? (
                <div className="p-4 text-center text-gray-500 italic border border-gray-200 rounded-lg">
                    No threads found in this category. Start the conversation by creating a new thread!
                </div>
            ) : (
                <div className="space-y-4">
                    {threads.map(thread => (
                        <div 
                            key={thread.id} 
                            onClick={() => setSelectedThread(thread)} 
                            className="p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-150"
                        >
                            <h3 className="text-lg font-semibold text-gray-800">{thread.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Posted by <span className="font-mono text-indigo-600">{thread.userId.substring(0, 8)}...</span> on {thread.timestamp?.toLocaleDateString()}
                            </p>
                            <div className="mt-2 text-gray-700 text-sm line-clamp-3">
                                {thread.content}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showNewThreadModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">New Discussion Thread</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full p-3 border border-indigo-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter thread title"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                            <textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                className="w-full p-3 border border-indigo-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                rows="4"
                                placeholder="Enter thread content"
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowNewThreadModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 transition duration-150"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleNewThread}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-150"
                            >
                                Create Thread
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Complete Chat component implementation
const Chat = ({ db, userId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = React.useRef(null);

    // Scroll to the bottom of the chat list
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch messages on load and listen for real-time updates
    useEffect(() => {
        if (!db) return;

        const chatRef = collection(db, `artifacts/${appId}/public/data/chat`);
        const q = query(chatRef, where('timestamp', '!=', null));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
            }));
            fetchedMessages.sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
            setMessages(fetchedMessages);
            scrollToBottom();
        }, (error) => {
            console.error("Error fetching chat messages:", error);
        });

        return () => unsubscribe();
    }, [db]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/chat`), {
                content: newMessage.trim(),
                userId,
                timestamp: serverTimestamp(),
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <div className="h-[70vh] flex flex-col bg-gray-50 rounded-lg p-4">
            <div className="flex-1 overflow-y-auto mb-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`mb-2 ${msg.userId === userId ? 'text-right' : ''}`}>
                        <div className={`inline-block p-2 rounded-lg ${
                            msg.userId === userId ? 'bg-indigo-600 text-white' : 'bg-white border'
                        }`}>
                            <p>{msg.content}</p>
                            <span className="text-xs opacity-75">
                                {msg.userId.substring(0, 8)}...
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2">
                <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded-lg"
                />
                <button 
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

// Add basic Wiki component
const Wiki = ({ db, userId }) => {
    return (
        <div className="p-4 bg-gray-50 min-h-[70vh]">
            <h2 className="text-2xl font-bold mb-4">Wiki</h2>
            <p>Wiki feature coming soon...</p>
        </div>
    );
};

// 5. Main App Component
const App = () => {
    const [activeTab, setActiveTab] = useState('Discussions');
    const { db, userId, isAuthReady } = useFirebase();

    const renderContent = () => {
        if (!isAuthReady) {
            return (
                <div className="flex justify-center items-center h-full text-lg text-indigo-600">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                        Please ensure `__firebase_config` is valid JSON and that the security rules are published.
                    </p>
                </div>
            );
        }

        switch (activeTab) {
            case 'Discussions':
                return <Discussions db={db} userId={userId} />;
            case 'Chat':
                return <Chat db={db} userId={userId} />;
            case 'Wiki':
                return <Wiki db={db} userId={userId} />;
            default:
                return null;
        }
    };

    // App-level UI (tabs + content)
    return (
        <div className="min-h-screen p-6 bg-gray-100">
            <header className="max-w-6xl mx-auto mb-6">
                <h1 className="text-2xl font-bold text-indigo-700">AuDHD Compass</h1>
            </header>

            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm p-4">
                <nav className="flex space-x-2 mb-4">
                    {tabs.map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`px-4 py-2 rounded-lg font-medium ${activeTab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {t}
                        </button>
                    ))}
                </nav>

                <main>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};
export default App;

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);