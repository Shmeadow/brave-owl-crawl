import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { toast } from 'sonner';

// Define interfaces for environment variables
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let firebaseInitialized = false;

export function initializeFirebaseClient() {
  if (firebaseInitialized) {
    return { app, db, auth };
  }

  const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

  if (!firebaseConfigString) {
    console.error("Firebase client not initialized: NEXT_PUBLIC_FIREBASE_CONFIG is missing.");
    if (typeof window !== 'undefined') {
      toast.error("Firebase configuration is missing. Flashcards will not load.");
    }
    return { app: null, db: null, auth: null };
  }

  try {
    const config: FirebaseConfig = JSON.parse(firebaseConfigString);
    
    app = initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);
    firebaseInitialized = true;
    console.log("Firebase client initialized successfully.");
    return { app, db, auth };
  } catch (error) {
    console.error("Error initializing Firebase client:", error);
    if (typeof window !== 'undefined') {
      toast.error("Failed to initialize Firebase. Check console for details.");
    }
    return { app: null, db: null, auth: null };
  }
}

// Export the initialized instances (will be null if initialization failed)
const { app: firebaseApp, db: firestoreDb, auth: firebaseAuth } = initializeFirebaseClient();

export { firebaseApp as app, firestoreDb as db, firebaseAuth as auth };