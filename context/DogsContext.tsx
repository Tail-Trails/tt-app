import React, { useEffect, useState, useMemo, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/context/AuthContext';
import { DogProfile } from '@/types/dog-profile';
import { API_URL } from '@/lib/api';

export const [DogsContext, useDogs] = createContextHook(() => {
  const { user, session, isLoading: isAuthLoading } = useAuth();
  const [dogProfiles, setDogProfiles] = useState<DogProfile[]>([]);
  const [activeDogId, setActiveDogId] = useState<string | null>(null);
  const [isDogProfileLoading, setIsDogProfileLoading] = useState<boolean>(true);

  const dogProfile = useMemo(() => 
    dogProfiles.find(d => d.id === activeDogId) || dogProfiles[0] || null
  , [dogProfiles, activeDogId]);

  const loadDogProfiles = useCallback(async (userId: string, token: string) => {
    console.log('Loading dog profiles for user:', userId);
    setIsDogProfileLoading(true);
    try {
      // We assume GET /dog returns the list of dogs for the current user
      // This endpoint is needed to discover the dog IDs
      const response = await fetch(`${API_URL}/dog`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setDogProfiles(data);
          if (data.length > 0 && !activeDogId) {
            setActiveDogId(data[0].id);
          }
        } else if (data && typeof data === 'object') {
          setDogProfiles([data]);
          setActiveDogId(data.id);
        } else {
          setDogProfiles([]);
        }
      } else {
        setDogProfiles([]);
      }
    } catch (error) {
      console.error('Error loading dog profiles:', error);
      setDogProfiles([]);
    } finally {
      setIsDogProfileLoading(false);
    }
  }, [activeDogId]);

  const refreshDogProfile = useCallback(async () => {
    if (user && session) {
      await loadDogProfiles(user.id, session.accessToken);
    }
  }, [user, session, loadDogProfiles]);

  useEffect(() => {
    // Don't decide dog profile loading state until auth has finished initializing.
    if (isAuthLoading) return;

    if (user && session) {
      loadDogProfiles(user.id, session.accessToken);
    } else {
      setDogProfiles([]);
      setIsDogProfileLoading(false);
    }
  }, [user, session, loadDogProfiles, isAuthLoading]);

  const createDogProfile = useCallback(async (profile: Omit<DogProfile, 'id' | 'created_at' | 'updated_at'>) => {
    if (!session) throw new Error('No session');
    
    const response = await fetch(`${API_URL}/dog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.[0]?.msg || 'Failed to create dog profile');
    }

    const data = await response.json();
    setDogProfiles(prev => [...prev, data]);
    setActiveDogId(data.id);
    return data;
  }, [session]);

  const updateDogProfile = useCallback(async (profile: DogProfile) => {
    if (!session) throw new Error('No session');
    if (!profile.id) throw new Error('Dog ID is required for update');
    
    const response = await fetch(`${API_URL}/dog/${profile.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.[0]?.msg || 'Failed to update dog profile');
    }

    const data = await response.json();
    setDogProfiles(prev => prev.map(d => d.id === data.id ? data : d));
    return data;
  }, [session]);

  return useMemo(() => ({
    dogProfile,
    dogProfiles,
    activeDogId,
    setActiveDogId,
    isDogProfileLoading,
    hasDogProfile: dogProfiles.length > 0,
    refreshDogProfile,
    createDogProfile,
    updateDogProfile,
  }), [dogProfile, dogProfiles, activeDogId, isDogProfileLoading, refreshDogProfile, createDogProfile, updateDogProfile]);
});
