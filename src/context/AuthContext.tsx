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

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username: string;
  bio: string;
  walletBalance: number;
  isVerified: boolean;
  role: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isLoginModalOpen: boolean;
  isOnboardingOpen: boolean;
  pendingUser: FirebaseUser | null;
  loginWithGoogle: () => Promise<void>;
  completeOnboarding: (username: string, bio: string) => Promise<void>;
  logout: () => Promise<void>;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  closeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
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
  const closeOnboarding = () => {
    setIsOnboardingOpen(false);
    setPendingUser(null);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;
      
      const userDocRef = doc(db, 'users', loggedUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        // Old user - just login
        setProfile(docSnap.data() as UserProfile);
        console.log("Existing user logged in");
        closeLoginModal();
      } else {
        // New user - trigger onboarding
        console.log("New user detected, opening onboarding");
        setPendingUser(loggedUser);
        closeLoginModal();
        setIsOnboardingOpen(true);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const completeOnboarding = async (username: string, bio: string) => {
    if (!pendingUser) return;

    const newProfile: UserProfile = {
      uid: pendingUser.uid,
      email: pendingUser.email,
      displayName: pendingUser.displayName,
      photoURL: pendingUser.photoURL,
      username: username.startsWith('@') ? username : `@${username}`,
      bio: bio,
      walletBalance: 0,
      isVerified: false,
      role: 'user',
    };

    try {
      await setDoc(doc(db, 'users', pendingUser.uid), newProfile);
      setProfile(newProfile);
      console.log("New user profile created in Firestore");
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
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
      isOnboardingOpen,
      pendingUser,
      loginWithGoogle, 
      completeOnboarding,
      logout,
      openLoginModal,
      closeLoginModal,
      closeOnboarding
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
