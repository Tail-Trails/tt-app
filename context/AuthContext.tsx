import React, { useEffect, useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
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

  const requestOtp = useCallback(async (email: string) => {
    console.log('Requesting OTP for:', email);
    const response = await fetch(`${API_URL}/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.[0]?.msg || 'Failed to request OTP');
    }

    return true;
  }, []);

  const verifyOtp = useCallback(async (email: string, otpCode: string) => {
    console.log('Verifying OTP for:', email);
    const response = await fetch(`${API_URL}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.[0]?.msg || 'Invalid OTP code');
    }

    const data: Session = await response.json();
    setSession(data);
    setUser(data.user);
    await AsyncStorage.setItem('session', JSON.stringify(data));
    
    return data;
  }, []);

  const requestRegistration = useCallback(async (email: string, name: string) => {
    console.log('Requesting registration for:', email);
    const response = await fetch(`${API_URL}/otp/register-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.[0]?.msg || 'Failed to request registration');
    }

    return true;
  }, []);

  const verifyRegistration = useCallback(async (email: string, otpCode: string) => {
    console.log('Verifying registration for:', email);
    const response = await fetch(`${API_URL}/otp/register-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.[0]?.msg || 'Invalid OTP code');
    }

    const data: Session = await response.json();
    setSession(data);
    setUser(data.user);
    await AsyncStorage.setItem('session', JSON.stringify(data));
    
    return data;
  }, []);

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
    requestOtp,
    verifyOtp,
    requestRegistration,
    verifyRegistration,
    signOut,
    isAuthenticated: !!session,
  }), [session, user, isLoading, requestOtp, verifyOtp, requestRegistration, verifyRegistration, signOut]);
});

