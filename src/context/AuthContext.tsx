import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (userId: string, newRole: UserRole) => Promise<void>;
  previewRoleOverride: UserRole | null;
  setPreviewRoleOverride: (role: UserRole | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewRoleOverride, setPreviewRoleOverride] = useState<UserRole | null>(null);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);

        try {
          const docSnap = await getDoc(userRef);
          const isBootstrapAdmin = firebaseUser.email?.toLowerCase() === 'cappuchino.mp@gmail.com';
          const defaultRole: UserRole = isBootstrapAdmin ? 'manager' : 'reception';

          if (!docSnap.exists()) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'ผู้ใช้งาน',
              photoURL: firebaseUser.photoURL || '',
              role: defaultRole,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          } else {
            const data = docSnap.data() as UserProfile;
            // Ensure bootstrap manager always has manager role
            if (isBootstrapAdmin && data.role !== 'manager') {
              await updateDoc(userRef, { role: 'manager', updatedAt: new Date().toISOString() });
              setUserProfile({ ...data, role: 'manager' });
            } else {
              setUserProfile(data);
            }
          }

          // Real-time listener for current user's role and profile changes
          unsubscribeDoc = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.data() as UserProfile);
            }
          }, (err) => {
            handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
          });

        } catch (err) {
          console.error('Error fetching/creating user profile:', err);
          setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้งาน');
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setPreviewRoleOverride(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      const msg = err instanceof Error ? err.message : 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setPreviewRoleOverride(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const updateRole = async (userId: string, newRole: UserRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const effectiveRole: UserRole = previewRoleOverride || userProfile?.role || 'reception';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role: effectiveRole,
        loading,
        error,
        signInWithGoogle,
        logout,
        updateRole,
        previewRoleOverride,
        setPreviewRoleOverride,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
