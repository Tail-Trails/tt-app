import React, { useEffect, useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export const [AccountContext, useAccount] = createContextHook(() => {
  const { user, session } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAccount = useCallback(async () => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/account/me`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      } else {
        console.error('Failed to fetch account:', response.status);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error fetching account:', error);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  const updateAccount = useCallback(async (updates: Partial<Pick<UserProfile, 'name' | 'image'>>) => {
    if (!session?.accessToken) throw new Error('No active session');

    try {
      const response = await fetch(`${API_URL}/account/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.[0]?.msg || 'Failed to update account');
      }

      const data = await response.json();
      setUserProfile(data);
      return data;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }, [session?.accessToken]);

  const deleteAccount = useCallback(async () => {
    if (!session?.accessToken) throw new Error('No active session');

    try {
      const response = await fetch(`${API_URL}/account/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.[0]?.msg || 'Failed to delete account');
      }

      setUserProfile(null);
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchAccount();
    } else {
      setUserProfile(null);
      setIsLoading(false);
    }
  }, [session?.accessToken, fetchAccount]);

  return useMemo(() => ({
    userProfile,
    isLoading,
    refreshAccount: fetchAccount,
    updateAccount,
    deleteAccount,
  }), [userProfile, isLoading, fetchAccount, updateAccount, deleteAccount]);
});
