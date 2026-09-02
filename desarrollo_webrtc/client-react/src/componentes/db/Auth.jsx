import React, { useState, useEffect, useContext, createContext } from 'react';
import { auth } from './Config';


const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const signUp = async (email, password, username) => {
    try {
      const response = await auth.createUserWithEmailAndPassword(email, password);
      await response.user.updateProfile({ displayName: username });
      await response.user.sendEmailVerification();
      return response;
    } catch (error) {
      console.log(error);
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await auth.signInWithEmailAndPassword(email, password);
      const emailVerified = response.user.emailVerified;
      if (!emailVerified) {
        throw new Error('Please verify your email.');
      }
      setCurrentUser(response.user);
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.emailVerified) {
        setCurrentUser(user);
      }else {
        setCurrentUser(null);
      }
      setIsAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  const values = {
    currentUser,
    isAuthChecked,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};
export { AuthContext };