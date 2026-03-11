'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithRedirect, 
  getRedirectResult,
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
    let mounted = true;

    const handleAuth = async () => {
      try {
        // 1. Check for redirect result first
        const result = await getRedirectResult(auth);
        if (result?.user && mounted) {
          const loggedUser = result.user;
          const userDocRef = doc(db, 'users', loggedUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            const newProfile: UserProfile = {
              uid: loggedUser.uid,
              email: loggedUser.email,
              displayName: loggedUser.displayName,
              photoURL: loggedUser.photoURL,
              username: `@user_${loggedUser.uid.substring(0, 4)}`.toLowerCase(),
              walletBalance: 0,
              isVerified: false,
              role: 'user',
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          } else {
            setProfile(userDoc.data() as UserProfile);
          }
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
      }

      // 2. Setup standard auth state listener
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!mounted) return;
        
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

      return unsubscribe;
    };

    const authInitPromise = handleAuth();

    return () => {
      mounted = false;
      authInitPromise.then(unsub => unsub?.());
    };
  }, []);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Use redirect instead of popup for mobile compatibility
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Error initiating Google Redirect", error);
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
