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

export interface Collectible {
  name: string;
  description?: string;
  image_url?: string;
}

export const [AccountContext, useAccount] = createContextHook(() => {
  const { user, session } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [collectibleSvgs, setCollectibleSvgs] = useState<(string | null)[]>([]);

  const fetchCollectibles = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const resp = await fetch(`${API_URL}/account/collectibles`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!resp.ok) return;
      const data = await resp.json();
      const items: Collectible[] = Array.isArray(data) ? data : [];
      setCollectibles(items);

      const urls = items
        .map((item) => item?.image_url)
        .filter((url): url is string => typeof url === 'string');

      const svgs: (string | null)[] = new Array(urls.length).fill(null);
      await Promise.all(
        urls.map(async (u, i) => {
          try {
            const r = await fetch(u);
            if (!r.ok) return;
            svgs[i] = await r.text();
          } catch {
            // ignore
          }
        })
      );
      setCollectibleSvgs(svgs);
    } catch {
      // ignore
    }
  }, [session?.accessToken]);

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
      fetchCollectibles();
    } else {
      setUserProfile(null);
      setCollectibles([]);
      setCollectibleSvgs([]);
      setIsLoading(false);
    }
  }, [session?.accessToken, fetchAccount, fetchCollectibles]);

  return useMemo(() => ({
    userProfile,
    isLoading,
    collectibles,
    collectibleSvgs,
    refreshAccount: fetchAccount,
    refreshCollectibles: fetchCollectibles,
    updateAccount,
    deleteAccount,
  }), [userProfile, isLoading, collectibles, collectibleSvgs, fetchAccount, fetchCollectibles, updateAccount, deleteAccount]);
});
