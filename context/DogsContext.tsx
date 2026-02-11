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
    // If photo is a local URI (not a remote URL), we first create the dog without the photo,
    // then upload the photo with the returned dog ID and update the dog with the uploaded URL.
    let createPayload: any = { ...profile };
    const isLocalPhoto = typeof profile.photo === 'string' && profile.photo && !profile.photo.startsWith('http');
    if (isLocalPhoto) {
      createPayload.photo = undefined;
    }

    const response = await fetch(`${API_URL}/dog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
      body: JSON.stringify(createPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.[0]?.msg || 'Failed to create dog profile');
    }

    const data = await response.json();
    setDogProfiles(prev => [...prev, data]);
    setActiveDogId(data.id);
    // If we had a local photo, upload it now and patch the dog with the returned URL
    if (isLocalPhoto && typeof profile.photo === 'string') {
      try {
        const uri = profile.photo as string;
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1] || `dog_${Date.now()}.jpg`;
        const extMatch = fileName.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

        const form = new FormData();
        // @ts-ignore
        form.append('file', { uri, name: fileName, type: mimeType });
        form.append('filename', fileName);
        form.append('dog_id', data.id);
        form.append('trail_id', '');
        form.append('user_id', '');

        const uploadResp = await fetch(`${API_URL}/uploads`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'accept': 'application/json',
          },
          body: form as any,
        });

        if (!uploadResp.ok) {
          console.error('Dog photo upload failed during create:', await uploadResp.text());
        } else {
          const uploadData = await uploadResp.json();
          const publicUrl = uploadData.public_url || uploadData.publicUrl || uploadData.url;
          if (publicUrl) {
            // Patch dog with new photo URL
            const patchResp = await fetch(`${API_URL}/dog/${data.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`,
              },
              body: JSON.stringify({ ...data, photo: publicUrl }),
            });

            if (patchResp.ok) {
              const patched = await patchResp.json();
              setDogProfiles(prev => prev.map(d => d.id === patched.id ? patched : d));
            } else {
              console.error('Failed to patch dog with uploaded photo');
            }
          }
        }
      } catch (err) {
        console.error('Error uploading dog photo after create:', err);
      }
    }

    return data;
  }, [session]);

  const updateDogProfile = useCallback(async (profile: DogProfile) => {
    if (!session) throw new Error('No session');
    if (!profile.id) throw new Error('Dog ID is required for update');
    // If photo is a local URI, upload it first with dog_id, then update the profile with the returned URL
    let profileToSend = { ...profile } as any;
    if (typeof profile.photo === 'string' && profile.photo && !profile.photo.startsWith('http')) {
      try {
        const uri = profile.photo as string;
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1] || `dog_${Date.now()}.jpg`;
        const extMatch = fileName.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

        const form = new FormData();
        // @ts-ignore
        form.append('file', { uri, name: fileName, type: mimeType });
        form.append('filename', fileName);
        form.append('dog_id', profile.id);
        form.append('trail_id', '');
        form.append('user_id', '');

        const uploadResp = await fetch(`${API_URL}/uploads`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'accept': 'application/json',
          },
          body: form as any,
        });

        if (!uploadResp.ok) {
          const errText = await uploadResp.text();
          throw new Error(`Upload failed: ${uploadResp.status} ${errText}`);
        }

        const uploadData = await uploadResp.json();
        const publicUrl = uploadData.public_url || uploadData.publicUrl || uploadData.url;
        if (!publicUrl) throw new Error('Upload did not return a public URL');
        profileToSend.photo = publicUrl;
      } catch (err) {
        console.error('Error uploading dog photo during update:', err);
        throw err;
      }
    }

    const response = await fetch(`${API_URL}/dog/${profile.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
      body: JSON.stringify(profileToSend),
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
