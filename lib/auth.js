import React, { useState, useEffect, useContext, createContext } from 'react';
import Router from 'next/router';
// import cookie from 'js-cookie';
import { onIdTokenChanged, getAuth, signInWithPopup, signInWithEmailAndPassword, GithubAuthProvider, signOut  } from "firebase/auth";
import firebase from './firebase';
// import { createUser } from './db';

const authContext = createContext();
const auth = getAuth();
const provider = new GithubAuthProvider();

export function AuthProvider({ children }) {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

export const useAuth = () => {
  return useContext(authContext);
};

function useProvideAuth() {
  const [user, setUser] = useState(null);
  console.log(user);
  const [loading, setLoading] = useState(true);

  const handleUser = async (rawUser) => {
    if (rawUser) {
      const user = await formatUser(rawUser);
      const { token, ...userWithoutToken } = user;

    //   createUser(user.uid, userWithoutToken);
      setUser(user);

    //   cookie.set('fast-feedback-auth', true, {
    //     expires: 1
    //   });

      setLoading(false);
      return user;
    } else {
      setUser(false);
    //   cookie.remove('fast-feedback-auth');

      setLoading(false);
      return false;
    }
  };

  const signinWithEmail = async (email, password) => {
    setLoading(true);
    const response = await signInWithEmailAndPassword(email, password);
      handleUser(response.user);
      Router.push('/sites');
  };

  const signinWithGitHub = async (redirect) => {
    setLoading(true);
    const result = await signInWithPopup(auth, provider);
      // This gives you a GitHub Access Token. You can use it to access the GitHub API.
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      handleUser(result.user);
      if (redirect) {
          Router.push(redirect);
      }
  };

  const signinWithGoogle = async (redirect) => {
    setLoading(true);
    const response = await signInWithPopup(auth, provider);
      handleUser(response.user);
      if (redirect) {
          Router.push(redirect);
      }
  };

  const signout = async () => {
    Router.push('/');
    try {
          await signOut(auth);
          handleUser(false);
      } catch (error) {
          // An error happened.
          console.log(error);
      }
      
  };

  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(handleUser);

    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    signinWithEmail,
    signinWithGitHub,
    signinWithGoogle,
    signout
  };
}

const getStripeRole = async () => {
  await auth.currentUser.getIdToken(true);
  const decodedToken = await auth.currentUser.getIdTokenResult();

  return decodedToken.claims.stripeRole || 'free';
};

const formatUser = async (user) => {
  const token = await user.getIdToken();
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    provider: user.providerData[0].providerId,
    photoUrl: user.photoURL,
    stripeRole: await getStripeRole(),
    token
  };
};