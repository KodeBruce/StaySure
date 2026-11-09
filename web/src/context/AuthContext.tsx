import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  profile: UserProfile;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, role?: UserRole) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Thabo M.",
  university: "University of the Witwatersrand",
  band: "b3",
  budget: 3500,
  funding: "nsfas",
  priorities: ["affordability", "safety", "campus", "wifi"],
  income: 4500
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('student');
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState<boolean>(true);

  // Load profile from Firestore or local storage
  const loadUserProfile = async (uid: string) => {
    if (!isFirebaseConfigured) return;
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.profile) setProfile(data.profile);
        if (data.role) setRole(data.role);
      }
    } catch (e) {
      console.warn("Failed to load user profile:", e);
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Demo mode fallback
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserProfile(currentUser.uid);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured) return;
    const res = await signInWithEmailAndPassword(auth, email, pass);
    await loadUserProfile(res.user.uid);
  };

  const signUpWithEmail = async (email: string, pass: string, assignedRole: UserRole = 'student') => {
    if (!isFirebaseConfigured) return;
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const userRef = doc(db, 'users', res.user.uid);
    await setDoc(userRef, {
      email,
      role: assignedRole,
      profile: DEFAULT_PROFILE,
      createdAt: new Date().toISOString()
    });
    setRole(assignedRole);
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) return;
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const userRef = doc(db, 'users', res.user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        email: res.user.email,
        role: 'student',
        profile: { ...DEFAULT_PROFILE, name: res.user.displayName || DEFAULT_PROFILE.name },
        createdAt: new Date().toISOString()
      });
    } else {
      await loadUserProfile(res.user.uid);
    }
  };

  const signOut = async () => {
    if (isFirebaseConfigured) {
      await fbSignOut(auth);
    }
    setUser(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const updated = { ...profile, ...data };
    setProfile(updated);

    if (user && isFirebaseConfigured) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { profile: updated }, { merge: true });
      } catch (err) {
        console.error("Failed to sync profile update to Firestore:", err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      profile,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

