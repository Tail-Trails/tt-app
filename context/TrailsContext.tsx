import React, { useEffect, useCallback, useState, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/context/AuthContext';
import { Trail } from '@/types/trail';
import { API_URL } from '@/lib/api';

export const [TrailsContext, useTrails] = createContextHook(() => {
  const { user, session } = useAuth();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [savedTrails, setSavedTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavedLoading, setIsSavedLoading] = useState<boolean>(true);

  const loadTrails = useCallback(async () => {
    if (!user || !session) {
      // even unauthenticated users can fetch public trails
      try {
        const resp = await fetch(`${API_URL}/trail`);
        if (resp.ok) {
          const data = await resp.json();
          setTrails(data || []);
        } else {
          console.error('Failed to load trails (public):', resp.status);
          setTrails([]);
        }
      } catch (err) {
        console.error('Failed to load trails:', err);
        setTrails([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      console.log('Loading trails for user:', user.id);
      const resp = await fetch(`${API_URL}/trail`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        setTrails(data || []);
      } else {
        console.error('Failed to load trails:', resp.status);
        setTrails([]);
      }
    } catch (error) {
      console.error('Failed to load trails:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, session]);

  const loadSavedTrails = useCallback(async () => {
    // The API currently exposes /trail/me for the current user's trails.
    if (!session?.accessToken) {
      setSavedTrails([]);
      setIsSavedLoading(false);
      return;
    }

    try {
      console.log('Loading my trails for user:', user?.id);
      const resp = await fetch(`${API_URL}/trail/me`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        setSavedTrails(data || []);
      } else {
        console.error('Failed to load my trails:', resp.status);
        setSavedTrails([]);
      }
    } catch (error) {
      console.error('Failed to load saved trails:', error);
      setSavedTrails([]);
    } finally {
      setIsSavedLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    loadTrails();
    loadSavedTrails();
  }, [loadTrails, loadSavedTrails]);

  const saveTrail = useCallback(async (trail: Trail) => {
    if (!user) {
      console.error('No user logged in');
      throw new Error('Must be logged in to save trails');
    }
    if (!session?.accessToken) {
      console.error('No session/access token available');
      throw new Error('Must be logged in to save trails');
    }
    try {
      console.log('Saving trail for user via API:', user.id);

      // Prepare a path array (lon, lat) expected by backend
      const coordsToPath = (coords: { latitude: number; longitude: number }[] | undefined) => {
        if (!coords || coords.length === 0) return [] as number[][];
        return coords.map(c => [c.longitude, c.latitude]);
      };

      const body: any = {
        name: trail.name,
        distance: trail.distance,
        duration: trail.duration,
        path: coordsToPath((trail as any).coordinates),
        photo: (trail as any).photo,
        city: trail.city,
        country: trail.country,
        description: (trail as any).description,
        tags: (trail as any).tags,
        elevation: (trail as any).elevation,
        surface_type: (trail as any).surfaceType,
        difficulty: (trail as any).difficulty,
        location: (trail as any).location,
        pace: trail.pace,
        speed: trail.speed,
        max_elevation: trail.maxElevation,
        rating: trail.rating,
        review: trail.review,
        environment_tags: (trail as any).environment_tags,
      };

      const accessToken = session.accessToken;
      // If photo is a local URI or a File object, create the trail first without photo,
      // then upload the file to /uploads with `trail_id` and patch the trail with the returned URL.
      const isLocalStringPhoto = typeof body.photo === 'string' && body.photo && !body.photo.startsWith('http');
      const isFilePhoto = typeof body.photo === 'object' && body.photo !== null; // e.g. File on web

      const createBody = { ...body };
      if (isLocalStringPhoto || isFilePhoto) {
        createBody.photo = undefined;
      }

      const resp = await fetch(`${API_URL}/trail/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(createBody),
      });

      if (!resp.ok) {
        const err = await resp.text();
        console.error('Failed to save trail via API:', resp.status, err);
        throw new Error('Failed to save trail');
      }

      const data = await resp.json();
      // Assume API returns created trail that matches our Trail type
      setTrails((prev: Trail[]) => [data, ...prev]);

      // If we had a local photo, upload it now and patch the trail with the returned URL
      if (isLocalStringPhoto || isFilePhoto) {
        try {
          // Build form data for upload
          const form = new FormData();
          if (isFilePhoto) {
            // web File object
            // @ts-ignore
            form.append('file', body.photo);
            // @ts-ignore
            form.append('filename', body.photo.name || `trail_${Date.now()}.jpg`);
          } else {
            const uri = body.photo as string;
            const uriParts = uri.split('/');
            const fileName = uriParts[uriParts.length - 1] || `trail_${Date.now()}.jpg`;
            const extMatch = fileName.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
            const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
            const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
            // @ts-ignore
            form.append('file', { uri, name: fileName, type: mimeType });
            form.append('filename', fileName);
          }

          form.append('trail_id', data.id);
          form.append('dog_id', '');
          form.append('user_id', '');

          const uploadResp = await fetch(`${API_URL}/uploads`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'accept': 'application/json',
            },
            body: form as any,
          });

          if (!uploadResp.ok) {
            console.error('Trail photo upload failed during create:', await uploadResp.text());
          } else {
            const uploadData = await uploadResp.json();
            const publicUrl = uploadData.public_url || uploadData.publicUrl || uploadData.url;
            if (publicUrl) {
              // Patch trail with new photo URL
              const patchResp = await fetch(`${API_URL}/trail/${data.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ ...data, photo: publicUrl }),
              });

              if (patchResp.ok) {
                const patched = await patchResp.json();
                setTrails(prev => prev.map(t => t.id === patched.id ? patched : t));
              } else {
                console.error('Failed to patch trail with uploaded photo');
              }
            }
          }
        } catch (err) {
          console.error('Error uploading trail photo after create:', err);
        }
      }

      return data as Trail;
    } catch (error) {
      console.error('Failed to save trail:', error);
      throw error;
    }
  }, [user, session]);

  const deleteTrail = useCallback(async (id: string) => {
    try {
      console.log('Deleting trail via API:', id);
      if (!session?.accessToken) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/trail/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.accessToken}` },
      });
      if (resp.status === 204) {
        setTrails((prev: Trail[]) => prev.filter((t: Trail) => t.id !== id));
      } else {
        const body = await resp.text();
        console.error('Failed to delete trail:', resp.status, body);
        throw new Error('Failed to delete trail');
      }
    } catch (error) {
      console.error('Failed to delete trail:', error);
      throw error;
    }
  }, [session]);

  const getTrailById = useCallback((id: string): Trail | undefined => {
    const found = trails.find((t: Trail) => t.id === id);
    if (found) return found;

    // If not in state, try fetching from API synchronously is not possible here — keep demo fallback
    if (id === 'demo-trail') {
      return {
        id: 'demo-trail',
        name: 'Scenic Coastal Walk',
        distance: 5.2,
        duration: 3600,
        coordinates: [
          { latitude: 50.81999932593175, longitude: -0.1443926504884132 },
          { latitude: 50.81982005377856, longitude: -0.14389605957015306 },
          { latitude: 50.8195735534442, longitude: -0.14290287773496857 },
          { latitude: 50.81976403108945, longitude: -0.14245949298612004 },
          { latitude: 50.819651985510006, longitude: -0.1415904588798469 },
          { latitude: 50.819360665744455, longitude: -0.141129338740825 },
          { latitude: 50.81955114425804, longitude: -0.14054407087405707 },
          { latitude: 50.8194278935438, longitude: -0.1397814491065219 },
          { latitude: 50.819282233189426, longitude: -0.1389301503892284 },
          { latitude: 50.819696803774036, longitude: -0.13903656272921694 },
          { latitude: 50.81999932593175, longitude: -0.13919618123853184 },
          { latitude: 50.82010016621547, longitude: -0.13853997181101363 },
          { latitude: 50.82041389015009, longitude: -0.138220734792327 },
          { latitude: 50.82055954697452, longitude: -0.13852223642078343 },
          { latitude: 50.82086206354296, longitude: -0.13829167635185513 },
        ],
        city: 'Brighton',
        country: 'UK',
        difficulty: 'Easy',
        pace: '11:32',
        maxElevation: 45,
        date: Date.now(),
        environment_tags: ['Beach', 'Sunny', 'Paved'],
        rating: 4.5,
        review: 'A beautiful walk along the seafront. Very dog friendly!',
      };
    }
    return undefined;
  }, [trails]);

  const loadNearbyTrails = useCallback(async (latitude?: number, longitude?: number, distanceKm: number = 10) => {
    try {
      console.log('Loading nearby trails:', { latitude, longitude, distanceKm });

      // If latitude/longitude provided and we have a session, call the backend nearby endpoint
      if (typeof latitude === 'number' && typeof longitude === 'number' && session?.accessToken) {
        try {
          const resp = await fetch(
            `${API_URL}/trail/nearby?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&distance_km=${encodeURIComponent(distanceKm)}`,
            {
              headers: { 'Authorization': `Bearer ${session.accessToken}` },
            }
          );
          if (resp.ok) {
            const data = await resp.json();
            return data as Trail[];
          }

          if (resp.status === 404) {
            // No nearby trails found — return empty list
            console.warn('Nearby trails endpoint returned 404 (no trails)');
            return [];
          }

          console.error('Failed to load nearby trails from API:', resp.status);
          return [];
        } catch (err) {
          console.error('Error calling nearby trails API:', err);
          return [];
        }
      }

      // If we don't have coords or session (unauthenticated), return empty array
      return [];
    } catch (error) {
      console.error('Failed to load nearby trails:', error);
      return [];
    }
  }, [session]);

  const updateTrailName = useCallback(async (id: string, name: string) => {
    try {
      console.log('Updating trail name via API:', id, name);
      if (!session?.accessToken) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/trail/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.accessToken}` },
        body: JSON.stringify({ name }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Failed to update');
      }
      const updated = await resp.json();
      setTrails((prev: Trail[]) => prev.map((t: Trail) => (t.id === id ? updated : t)));
    } catch (error) {
      console.error('Failed to update trail name:', error);
      throw error;
    }
  }, [session]);

  const updateTrailPhoto = useCallback(async (id: string, photo: string) => {
    try {
      console.log('Updating trail photo via API:', id);
      if (!session?.accessToken) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/trail/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.accessToken}` },
        body: JSON.stringify({ photo }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Failed to update photo');
      }
      const updated = await resp.json();
      setTrails((prev: Trail[]) => prev.map((t: Trail) => (t.id === id ? updated : t)));
    } catch (error) {
      console.error('Failed to update trail photo:', error);
      throw error;
    }
  }, [session]);

  const updateTrailDetails = useCallback(async (id: string, updates: {
    rating?: number;
    review?: string;
    environment_tags?: string[];
    difficulty?: string;
  }) => {
    try {
      console.log('Updating trail details via API:', id, updates);
      if (!session?.accessToken) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/trail/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.accessToken}` },
        body: JSON.stringify(updates),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Failed to update details');
      }
      const updated = await resp.json();
      setTrails((prev: Trail[]) => prev.map((t: Trail) => (t.id === id ? updated : t)));
    } catch (error) {
      console.error('Failed to update trail details:', error);
      throw error;
    }
  }, []);

  const getTrailWithUser = useCallback(async (id: string) => {
    try {
      console.log('Loading trail with user data via API:', id);
      const resp = await fetch(`${API_URL}/trail/${id}`);
      if (!resp.ok) {
        console.error('Failed to fetch trail:', resp.status);
        return undefined;
      }
      const data = await resp.json();
      return data as Trail;
    } catch (error) {
      console.error('Failed to load trail with user:', error);
      return undefined;
    }
  }, []);

  const saveTrailBookmark = useCallback(async (trailId: string) => {
    if (!user) {
      console.error('No user logged in');
      throw new Error('Must be logged in to save trails');
    }

    try {
      console.log('Saving trail bookmark:', trailId);
      // TODO: Implement bookmark with your backend
      const trail = trails.find((t: Trail) => t.id === trailId);
      if (trail) {
        setSavedTrails((prev: Trail[]) => [trail, ...prev]);
      }
    } catch (error) {
      console.error('Failed to save trail bookmark:', error);
      throw error;
    }
  }, [user, trails]);

  const removeTrailBookmark = useCallback(async (trailId: string) => {
    if (!user) {
      console.error('No user logged in');
      throw new Error('Must be logged in to remove saved trails');
    }

    try {
      console.log('Removing trail bookmark:', trailId);
      // TODO: Implement remove bookmark with your backend
      setSavedTrails((prev: Trail[]) => prev.filter((t: Trail) => t.id !== trailId));
    } catch (error) {
      console.error('Failed to remove trail bookmark:', error);
      throw error;
    }
  }, [user]);

  const isTrailSaved = useCallback((trailId: string): boolean => {
    return savedTrails.some((t: Trail) => t.id === trailId);
  }, [savedTrails]);


  return useMemo(() => ({
    trails,
    savedTrails,
    isLoading,
    isSavedLoading,
    saveTrail,
    deleteTrail,
    getTrailById,
    updateTrailName,
    updateTrailPhoto,
    updateTrailDetails,
    loadNearbyTrails,
    saveTrailBookmark,
    removeTrailBookmark,
    isTrailSaved,
    getTrailWithUser,
  }), [trails, savedTrails, isLoading, isSavedLoading, saveTrail, deleteTrail, getTrailById, updateTrailName, updateTrailPhoto, updateTrailDetails, loadNearbyTrails, saveTrailBookmark, removeTrailBookmark, isTrailSaved, getTrailWithUser]);
});

