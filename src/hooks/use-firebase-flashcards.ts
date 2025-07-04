import { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, User } from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, query, getDocs, Firestore } from 'firebase/firestore';
import { toast } from 'sonner';
import { app, db, auth } from '@/lib/firebase'; // Import Firebase instances

export interface CardData {
  id: string;
  term: string;
  definition: string;
  correctCount: number; // Mastery level
}

interface UseFirebaseFlashcardsResult {
  flashcards: CardData[];
  loading: boolean;
  userId: string | null;
  firebaseError: boolean;
  addOrUpdateCard: (card: { id?: string; term: string; definition: string }) => void;
  deleteCard: (id: string) => void;
  updateCardCorrectCount: (cardId: string, increment: number) => void;
}

const APP_ARTIFACT_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ARTIFACT_ID || 'default-flashcard-app';
const INITIAL_AUTH_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_TOKEN || null;

export function useFirebaseFlashcards(): UseFirebaseFlashcardsResult {
  const [flashcards, setFlashcards] = useState<CardData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(false);
  const isAuthListenerActive = useRef(false);
  const isSnapshotListenerActive = useRef(false);

  // Firebase Initialization and Authentication
  useEffect(() => {
    if (!auth || !db || !app) {
      console.error("Firebase services (app, db, or auth) are not available. Cannot set up auth listener.");
      setFirebaseError(true);
      setLoading(false);
      return;
    }

    if (isAuthListenerActive.current) {
      return; // Prevent duplicate listener setup
    }

    isAuthListenerActive.current = true;
    console.log("Setting up Firebase auth listener...");

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        console.log("Firebase User authenticated:", user.uid);
      } else {
        console.log("No Firebase user found, attempting sign-in.");
        try {
          if (INITIAL_AUTH_TOKEN) {
            await signInWithCustomToken(auth, INITIAL_AUTH_TOKEN);
            console.log("Signed in with custom token.");
          } else {
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
          }
        } catch (error: any) {
          console.error("Firebase authentication error during sign-in:", error);
          toast.error("Firebase authentication failed: " + error.message);
          setFirebaseError(true);
        }
      }
      setLoading(false);
      console.log("Firebase auth state check complete. Loading set to false.");
    });

    return () => {
      console.log("Cleaning up Firebase auth listener.");
      unsubscribeAuth();
      isAuthListenerActive.current = false;
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Firestore Real-time Data Listener
  useEffect(() => {
    if (!userId || !db || !app) {
      console.log("Skipping Firestore data listener: userId, db, or app not ready.");
      return;
    }

    if (isSnapshotListenerActive.current) {
      return; // Prevent duplicate listener setup
    }

    isSnapshotListenerActive.current = true;
    console.log(`Setting up Firestore snapshot listener for user: ${userId} and app artifact: ${APP_ARTIFACT_ID}`);

    const flashcardsDocRef = doc(db, `artifacts/${APP_ARTIFACT_ID}/users/${userId}/flashcards`, 'main_set');

    const unsubscribeSnapshot = onSnapshot(flashcardsDocRef, (docSnap) => {
      console.log("Firestore snapshot received.");
      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedCards = Array.isArray(data.cards) ? data.cards.map((card: any) => ({
          ...card,
          correctCount: card.correctCount !== undefined ? card.correctCount : 0
        })) : [];
        setFlashcards(loadedCards);
        console.log("Flashcards loaded:", loadedCards.length, "cards.");
      } else {
        console.log("No flashcard set found at path, initializing empty set in state and creating document.");
        setFlashcards([]);
        setDoc(flashcardsDocRef, { cards: [] }, { merge: true })
          .then(() => console.log("Initial flashcard document created/merged successfully."))
          .catch(e => {
            console.error("Error creating initial flashcard document:", e);
            toast.error("Failed to initialize flashcard data.");
            setFirebaseError(true);
          });
      }
    }, (error: any) => {
      console.error("Error fetching flashcards from Firestore:", error);
      toast.error("Failed to load flashcards: " + error.message);
      setFirebaseError(true);
    });

    return () => {
      console.log("Cleaning up Firestore snapshot listener.");
      unsubscribeSnapshot();
      isSnapshotListenerActive.current = false;
    };
  }, [userId]); // Re-run if userId changes

  // Function to save flashcards to Firestore
  const saveFlashcards = useCallback(async (updatedCards: CardData[]) => {
    if (!userId || !db) {
      console.error("Cannot save: userId or db not initialized. Save aborted.");
      toast.error("Cannot save flashcards: Not authenticated or database not ready.");
      return;
    }
    const flashcardsDocRef = doc(db, `artifacts/${APP_ARTIFACT_ID}/users/${userId}/flashcards`, 'main_set');
    try {
      console.log("Attempting to save flashcards to Firestore...");
      await setDoc(flashcardsDocRef, { cards: updatedCards });
      console.log("Flashcards saved successfully.");
    } catch (e: any) {
      console.error("Error saving flashcards to Firestore:", e);
      toast.error("Failed to save flashcards: " + e.message);
      setFirebaseError(true);
    }
  }, [userId, db]);

  // Add/Update Flashcard
  const addOrUpdateCard = useCallback((card: { id?: string; term: string; definition: string }) => {
    setFlashcards(prevCards => {
      let updatedCards: CardData[];
      if (card.id) {
        // Update existing card, preserving correctCount
        updatedCards = prevCards.map(fc => fc.id === card.id ? { ...fc, term: card.term, definition: card.definition } : fc);
      } else {
        // Add new card with a unique ID and initial correctCount
        updatedCards = [...prevCards, { ...card, id: crypto.randomUUID(), correctCount: 0 }];
      }
      saveFlashcards(updatedCards);
      return updatedCards;
    });
  }, [saveFlashcards]);

  // Delete Flashcard
  const deleteCard = useCallback((id: string) => {
    setFlashcards(prevCards => {
      const updatedCards = prevCards.filter(card => card.id !== id);
      saveFlashcards(updatedCards);
      return updatedCards;
    });
  }, [saveFlashcards]);

  // Function to update a card's correctCount
  const updateCardCorrectCount = useCallback((cardId: string, increment: number) => {
    setFlashcards(prevCards => {
      const updatedCards = prevCards.map(card =>
        card.id === cardId ? { ...card, correctCount: Math.max(0, card.correctCount + increment) } : card
      );
      saveFlashcards(updatedCards);
      return updatedCards;
    });
  }, [saveFlashcards]);

  return {
    flashcards,
    loading,
    userId,
    firebaseError,
    addOrUpdateCard,
    deleteCard,
    updateCardCorrectCount,
  };
}