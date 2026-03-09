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
        path: coordsToPath(trail.coordinates),
        photo: trail.photo,
        photos: (trail as any).photos,
        urls: (trail as any).urls,
        city: trail.city,
        country: trail.country,
        description: trail.description,
        tags: trail.tags,
        elevation: trail.elevation,
        surface_type: trail.surfaceType,
        difficulty: trail.difficulty,
        location: trail.location,
        pace: trail.pace,
        speed: trail.speed,
        max_elevation: trail.maxElevation,
        rating: trail.rating,
        review: trail.review,
        environment_tags: trail.environment_tags,
      };

      const accessToken = session.accessToken;
      // If `urls` contains local URI strings or File objects, upload them first to /uploads
      const createBody = { ...body };

      // Collect any image inputs passed in `urls` or `photos` fields.
      const providedImages: any[] = [];
      if (Array.isArray((createBody as any).urls)) providedImages.push(...(createBody as any).urls);
      if (Array.isArray((createBody as any).photos)) providedImages.push(...(createBody as any).photos);

      // Separate hosted URLs from local file URIs / file objects
      const hostedUrls: string[] = [];
      const localFiles: any[] = [];
      for (const item of providedImages) {
        if (!item) continue;
        if (typeof item === 'string' && item.startsWith('http')) {
          hostedUrls.push(item);
        } else if (typeof item === 'string') {
          // local URI string from RN image picker
          const uri = item;
          const uriParts = uri.split('/');
          const fileName = uriParts[uriParts.length - 1] || `trail_${Date.now()}.jpg`;
          const extMatch = fileName.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
          const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
          const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
          // @ts-ignore
          localFiles.push({ uri, name: fileName, type: mimeType });
        } else if (typeof item === 'object') {
          // already a file-like object
          localFiles.push(item);
        }
      }

      // If we have local files, send multipart/form-data to the endpoint and include hosted URLs as repeated `urls` fields
      let resp: Response;
      if (localFiles.length > 0) {
        const form = new FormData();

        // Build a single JSON payload for the trail and include hosted URLs
        const trailPayload: any = { ...createBody };
        if (hostedUrls.length > 0) trailPayload.urls = hostedUrls;

        // Ensure path is a JSON array of [lon, lat] tuples (numbers)
        if (!trailPayload.path) trailPayload.path = [];

        // Attach the JSON trail under the `trail` form field as required by backend
        // Append the trail payload as a JSON string field (backend expects a string)
        form.append('trail', JSON.stringify(trailPayload));

        // Append files under the `files` key (backend expects `files: list[UploadFile]`)
        for (const f of localFiles) {
          // @ts-ignore
          form.append('files', f as any);
        }

        // Use the upload-specific endpoint when sending files
        resp = await fetch(`${API_URL}/trail/me/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            // NOTE: Do NOT set Content-Type; fetch will set multipart boundary
          },
          body: form as any,
        });
      } else {
        // No local files to send — fall back to JSON body. Include any hosted URLs.
        if (hostedUrls.length > 0) createBody.urls = hostedUrls;
        const jsonResp = await fetch(`${API_URL}/trail/me`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(createBody),
        });
        resp = jsonResp;
      }

      if (!resp.ok) {
        const err = await resp.text();
        console.error('Failed to save trail via API:', resp.status, err);
        throw new Error('Failed to save trail');
      }

      const data = await resp.json();
      setTrails((prev: Trail[]) => [data, ...prev]);

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

  const getTrailById = useCallback(async (id: string): Promise<Trail | undefined> => {
    const found = trails.find((t: Trail) => t.id === id);
    if (found) return found;

    // If not in state, try fetching from API
    try {
      console.log('Fetching trail by id from API:', id);
      const headers: any = {};
      if (session?.accessToken) headers['Authorization'] = `Bearer ${session.accessToken}`;
      const resp = await fetch(`${API_URL}/trail/${id}`, { headers });
      const data = await resp.json();
      if (data) {
        setTrails((prev: Trail[]) => [data, ...prev.filter(t => t.id !== data.id)]);
        return data as Trail;
      }
      return undefined;
    } catch (err) {
      console.error('Error fetching trail by id:', err);
      return undefined;
    }
  }, [trails, session]);

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

  const updateTrailPhoto = useCallback(async (id: string, photoOrUrls: string | string[]) => {
    try {
      console.log('Updating trail photo(s) via API:', id);
      if (!session?.accessToken) throw new Error('Not authenticated');

      const payload: any = {};
      if (Array.isArray(photoOrUrls)) {
        payload.urls = photoOrUrls;
      } else if (typeof photoOrUrls === 'string') {
        payload.urls = [photoOrUrls];
      }

      const resp = await fetch(`${API_URL}/trail/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.accessToken}` },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Failed to update photo(s)');
      }
      const updated = await resp.json();
      setTrails((prev: Trail[]) => prev.map((t: Trail) => (t.id === id ? updated : t)));
    } catch (error) {
      console.error('Failed to update trail photo(s):', error);
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

