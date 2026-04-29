import React, { useEffect, useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string
}

export interface Session {
  user: User;
  accessToken: string;
  tokenType: string;
}

export const [AuthContext, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedSession = await AsyncStorage.getItem('session');
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          setSession(parsedSession);
          setUser(parsedSession.user);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const signInWithToken = useCallback(async (tokenResponse: { accessToken: string; tokenType?: string; user?: User }) => {
    // Accept token response from webauthn auth verify endpoint and persist session
    const sessionObj: Session = {
      accessToken: tokenResponse.accessToken,
      tokenType: tokenResponse.tokenType || 'bearer',
      user: (tokenResponse.user as User) || (user as User),
    } as Session;
    setSession(sessionObj);
    setUser(sessionObj.user);
    await AsyncStorage.setItem('session', JSON.stringify(sessionObj));
    return sessionObj;
  }, [user]);

  const signOut = useCallback(async () => {
    console.log('Signing out user');
    setSession(null);
    setUser(null);
    await AsyncStorage.removeItem('session');
  }, []);

  return useMemo(() => ({
    session,
    user,
    isLoading,
    signInWithToken,
    signOut,
    isAuthenticated: !!session,
  }), [session, user, isLoading, signInWithToken, signOut]);
});

