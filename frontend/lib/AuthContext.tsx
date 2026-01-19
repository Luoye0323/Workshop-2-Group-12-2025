'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';
import { setAuthToken, removeAuthToken } from './api';
import { api } from './api';
import type { UserProfile } from './types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user profile from backend/Firestore
  const fetchUserProfile = async (firebaseUser: User): Promise<void> => {
    try {
      const userProfile = await api.users.me();
      setUserProfile(userProfile);
      console.log('✅ User profile loaded:', userProfile);
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
      
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthToken(token);
          console.log('🔑 Auth token set');
          
          await fetchUserProfile(user);
          
          refreshInterval = setInterval(async () => {
            try {
              const newToken = await user.getIdToken(true);
              setAuthToken(newToken);
              console.log('🔄 Token refreshed');
            } catch (error) {
              console.error('Error refreshing token:', error);
            }
          }, 50 * 60 * 1000);
          
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      } else {
        removeAuthToken();
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, displayName: string): Promise<void> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (result.user) {
      await updateProfile(result.user, { displayName });
    }
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    removeAuthToken();
    setUserProfile(null);
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await fetchUserProfile(user);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    login,
    signup,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}