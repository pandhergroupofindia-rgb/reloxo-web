'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username: string;
  walletBalance: number;
  isVerified: boolean;
  role: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isLoginModalOpen: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    // Listen for auth state changes to keep the session alive and sync profile
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;
      
      const userDocRef = doc(db, 'users', loggedUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        // Strictly create a new document if it doesn't exist
        const newProfile: UserProfile = {
          uid: loggedUser.uid,
          email: loggedUser.email,
          displayName: loggedUser.displayName,
          photoURL: loggedUser.photoURL,
          username: `@user_${loggedUser.uid.substring(0, 5)}`.toLowerCase(),
          walletBalance: 0,
          isVerified: false,
          role: 'user',
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
        console.log("New user created in Firestore");
      } else {
        setProfile(docSnap.data() as UserProfile);
        console.log("Existing user logged in");
      }
      
      closeLoginModal();
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isLoginModalOpen,
      loginWithGoogle, 
      logout,
      openLoginModal,
      closeLoginModal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
