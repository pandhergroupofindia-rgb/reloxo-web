'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, databases, DATABASE_ID, COLLECTION_ID } from '../lib/appwrite';
import { ID } from 'appwrite';

interface AuthContextType {
  user: any;
  loading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isOnboardingOpen: boolean;
  tempUser: any;
  completeOnboarding: (username: string, bio: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const currentAccount = await account.get();
      try {
        const profileDoc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, currentAccount.$id);
        const profile = JSON.parse(profileDoc.profileData || '{}');
        setUser({ ...currentAccount, ...profile });
      } catch (e) {
        // Document doesn't exist, trigger onboarding
        setTempUser(currentAccount);
        setIsOnboardingOpen(true);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await account.createOAuth2Session(
        'google',
        window.location.origin,
        window.location.origin
      );
    } catch (error: any) {
      alert('Login Error: ' + error.message);
    }
  };

  const completeOnboarding = async (username: string, bio: string) => {
    if (!tempUser) return;
    try {
      const profile = {
        uid: tempUser.$id,
        email: tempUser.email,
        displayName: tempUser.name,
        username: username || `@user_${tempUser.$id.substring(0, 5)}`,
        bio: bio || '',
        walletBalance: 0,
        isVerified: false,
        role: 'user',
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        tempUser.$id,
        { profileData: JSON.stringify(profile) }
      );

      setUser({ ...tempUser, ...profile });
      setIsOnboardingOpen(false);
      setTempUser(null);
      alert('Profile Created Successfully! 🎉');
    } catch (error: any) {
      alert('Profile Save Error: ' + error.message);
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      window.location.reload();
    } catch (error: any) {
      alert('Logout Error: ' + error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        isOnboardingOpen,
        tempUser,
        completeOnboarding,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
