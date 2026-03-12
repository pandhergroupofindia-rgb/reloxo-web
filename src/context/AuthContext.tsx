"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: any;
  loading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isOnboardingOpen: boolean;
  tempUser: FirebaseUser | null;
  completeOnboarding: (username: string, bio: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [tempUser, setTempUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUser({ ...currentUser, ...userDoc.data() });
          } else {
            setTempUser(currentUser);
            setIsOnboardingOpen(true);
          }
        } catch (error: any) {
          alert("Database Error: " + error.message);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      const docRef = doc(db, "users", loggedInUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUser({ ...loggedInUser, ...docSnap.data() });
        setIsLoginModalOpen(false);
        alert("Welcome back to Reloxo! 🔥");
      } else {
        setTempUser(loggedInUser);
        setIsLoginModalOpen(false);
        setIsOnboardingOpen(true);
      }
    } catch (error: any) {
      alert("Login Error: " + error.message);
    }
  };

  const completeOnboarding = async (username: string, bio: string) => {
    if (!tempUser) return;
    try {
      const userData = {
        uid: tempUser.uid,
        email: tempUser.email,
        displayName: tempUser.displayName,
        photoURL: tempUser.photoURL,
        username: username || `@user_${tempUser.uid.substring(0,5)}`,
        bio: bio || "",
        walletBalance: 0,
        isVerified: false,
        role: "user"
      };
      await setDoc(doc(db, "users", tempUser.uid), userData);
      setUser({ ...tempUser, ...userData });
      setIsOnboardingOpen(false);
      setTempUser(null);
      alert("Profile Created Successfully! 🎉");
    } catch (error: any) {
      alert("Profile Save Error: " + error.message);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      isLoginModalOpen, openLoginModal: () => setIsLoginModalOpen(true), closeLoginModal: () => setIsLoginModalOpen(false),
      isOnboardingOpen, tempUser, completeOnboarding, loginWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
