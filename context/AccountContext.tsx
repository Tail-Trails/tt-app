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
  // `preview_url` is a small image/thumbnail for initial display
  preview_url?: string;
  // `image_url` may point to the full image or a GLB/GLTF model
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

      // Create array aligned with `items` so collectibleSvgs[i] corresponds to items[i]
      const svgs: (string | null)[] = items.map(() => null);

      await Promise.all(
        items.map(async (item, idx) => {
          // Prefer `preview_url` for thumbnails; fall back to `image_url`.
          const preview = item?.preview_url;
          const modelUrl = item?.image_url;

          // If preview is provided, use it (fetch SVG or keep URL)
          if (preview) {
            try {
              const r = await fetch(preview);
              if (!r.ok) {
                svgs[idx] = preview; // fallback to URL
                return;
              }
              const contentType = (r.headers.get('content-type') || '').toLowerCase();
              if (contentType.includes('svg') || contentType.includes('xml') || preview.toLowerCase().endsWith('.svg')) {
                svgs[idx] = await r.text();
              } else {
                svgs[idx] = preview;
              }
            } catch {
              svgs[idx] = preview;
            }
            return;
          }

          // No preview; fall back to model/image URL
          if (!modelUrl) return;

          // If it's a model (GLB/GLTF) use the model URL so consumers can load it
          if (/\.gltf?$|\.glb($|\?|#)/i.test(modelUrl)) {
            svgs[idx] = modelUrl;
            return;
          }

          // Otherwise try fetching the image and store SVG text if appropriate
          try {
            const r = await fetch(modelUrl);
            if (!r.ok) {
              svgs[idx] = modelUrl; // fallback to URL
              return;
            }
            const contentType = (r.headers.get('content-type') || '').toLowerCase();
            if (contentType.includes('svg') || contentType.includes('xml') || modelUrl.toLowerCase().endsWith('.svg')) {
              svgs[idx] = await r.text();
            } else {
              svgs[idx] = modelUrl;
            }
          } catch {
            svgs[idx] = modelUrl;
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
