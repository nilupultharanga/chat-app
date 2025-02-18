// Import the necessary functions from Firebase SDKs
import { initializeApp } from "firebase/app";
import { 
    createUserWithEmailAndPassword, 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut 
} from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";

// Firebase Configuration
const firebaseConfig = {
    // apiKey: "AIzaSyAfq6vJ6GGg_OW3Rcv8aLKssuaS4XuHA9Y",
    // authDomain: "chat-app-7c64c.firebaseapp.com",
    // projectId: "chat-app-7c64c",
    // storageBucket: "chat-app-7c64c.appspot.com", // Corrected Firebase Storage URL
    // messagingSenderId: "990500352274",
    // appId: "1:990500352274:web:d15e1058aa683d3ec083cb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Signup Function
const signup = async (username, email, password) => {
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;

        await setDoc(doc(db, "users", user.uid), {
            id: user.uid,
            username: username.toLowerCase(),
            email,
            name: "",
            avatar: "",
            bio: "Hey, there! I am using Chat App",
            lastSeen: Date.now()
        });

        await setDoc(doc(db, "chats", user.uid), {
            chatsData: []
        });

    } catch (error) {
        console.error("Signup Error:", error);
        toast.error(error.code.replace("auth/", "").split("-").join(" "));
    }
};

// Login Function
const login = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error("Login Error:", error);
        toast.error(error.code.replace("auth/", "").split("-").join(" "));
    }
};

// Logout Function
const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Error:", error);
        toast.error(error.code.replace("auth/", "").split("-").join(" "));
    }
};

// Export Authentication Functions & Firebase Instances
export { signup, login, logout, auth, db };
