import { useEffect, useCallback, useState, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/context/AuthContext';
import { Trail } from '@/types/trail';
import { API_URL } from '@/lib/api';
import { getBestAvailableLocation } from '@/utils/location';
import * as Location from 'expo-location';

export const [TrailsContext, useTrails] = createContextHook(() => {
  const { user, session } = useAuth();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [savedTrails, setSavedTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavedLoading, setIsSavedLoading] = useState<boolean>(true);

  const loadTrails = useCallback(async () => {
    // Only load trails for the authenticated user using /trail/me.
    // Do not call the root `/trail` endpoint.
    if (!session?.accessToken) {
      setTrails([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Loading my trails for user:', user?.id);
      // Ensure we have foreground location permission and a location before calling /trail/me
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted; skipping /trail/me fetch');
        setTrails([]);
        setIsLoading(false);
        return;
      }

      // Try to include user's current location so backend can return distances
      let url = `${API_URL}/trail/me`;
      try {
        const loc = await getBestAvailableLocation();
        if (loc && loc.coords) {
          const lat = encodeURIComponent(String(loc.coords.latitude));
          const lng = encodeURIComponent(String(loc.coords.longitude));
          url += `?latitude=${lat}&longitude=${lng}`;
        } else {
          console.warn('No location available; calling /trail/me without coords');
        }
      } catch (err) {
        console.warn('Failed to get location for /trail/me call:', err);
      }

      const resp = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });
      if (resp.ok) {
        const text = await resp.text();
        let data: any = [];
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error('TrailsContext.loadTrails: failed to parse JSON', err);
        }
        setTrails(data || []);
      } else {
        console.error('Failed to load my trails:', resp.status);
        setTrails([]);
      }
    } catch (error) {
      console.error('Failed to load trails:', error);
      setTrails([]);
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
      // Ensure we have foreground location permission and a location before calling /trail/me
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted; skipping /trail/me fetch');
        setSavedTrails([]);
        setIsSavedLoading(false);
        return;
      }

      let url = `${API_URL}/trail/me`;
      try {
        const loc = await getBestAvailableLocation();
        if (loc && loc.coords) {
          const lat = encodeURIComponent(String(loc.coords.latitude));
          const lng = encodeURIComponent(String(loc.coords.longitude));
          url += `?latitude=${lat}&longitude=${lng}`;
        } else {
          console.warn('No location available; calling /trail/me without coords');
        }
      } catch (err) {
        console.warn('Failed to get location for /trail/me call:', err);
      }

      const resp = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });
      if (resp.ok) {
        const text = await resp.text();
        let data: any = [];
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error('TrailsContext.loadSavedTrails: failed to parse JSON', err);
        }
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
        // New review fields from the mobile UI
        dogTraffic: (trail as any).dogTraffic,
        footTraffic: (trail as any).footTraffic,
        paths: (trail as any).paths,
        exposure: (trail as any).exposure,
        offLeash: (trail as any).offLeash,
        wildlife: (trail as any).wildlife
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

  const saveFollowTrail = useCallback(async (
    sourceTrailId: string,
    trail: Trail,
    review: { rating: number; content: string },
    photos: string[] = []
  ) => {
    if (!user) {
      console.error('No user logged in');
      throw new Error('Must be logged in to save followed trails');
    }
    if (!session?.accessToken) {
      console.error('No session/access token available');
      throw new Error('Must be logged in to save followed trails');
    }

    const coordsToPath = (coords: { latitude: number; longitude: number }[] | undefined) => {
      if (!coords || coords.length === 0) return [] as number[][];
      return coords.map(c => [c.longitude, c.latitude]);
    };

    const trailData: any = {
      name: trail.name,
      description: trail.description,
      distance: trail.distance,
      duration: trail.duration,
      path: trail.path || coordsToPath(trail.coordinates),
      tags: trail.tags,
      pace: trail.pace,
      speed: trail.speed,
      maxElevation: trail.maxElevation,
      dogTraffic: trail.dogTraffic,
      footTraffic: trail.footTraffic,
      paths: trail.paths,
      exposure: trail.exposure,
      offLeash: trail.offLeash,
      wildlife: trail.wildlife,
      isOriginal: false,
      originalTrailId: sourceTrailId,
      isPublic: true,
      rating: trail.rating,
      reviewCount: trail.reviewCount,
      startLatitude: trail.startLatitude ?? trail.coordinates?.[0]?.latitude,
      startLongitude: trail.startLongitude ?? trail.coordinates?.[0]?.longitude,
    };

    const providedImages = Array.isArray(photos) ? photos : [];
    const hostedUrls: string[] = [];
    const localFiles: any[] = [];

    for (const item of providedImages) {
      if (!item) continue;
      if (typeof item === 'string' && item.startsWith('http')) {
        hostedUrls.push(item);
      } else if (typeof item === 'string') {
        const uri = item;
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1] || `trail_${Date.now()}.jpg`;
        const extMatch = fileName.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        // @ts-ignore
        localFiles.push({ uri, name: fileName, type: mimeType });
      }
    }

    let resp: Response;
    if (localFiles.length > 0) {
      const form = new FormData();
      const trailPayload = { ...trailData, urls: hostedUrls };
      form.append('trail', JSON.stringify(trailPayload));
      form.append('review', JSON.stringify(review));
      for (const file of localFiles) {
        // @ts-ignore
        form.append('files', file as any);
      }

      resp = await fetch(`${API_URL}/trail/me/follow-trail/${sourceTrailId}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: form as any,
      });
    } else {
      resp = await fetch(`${API_URL}/trail/me/follow-trail/${sourceTrailId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          review,
          trail_data: {
            ...trailData,
            urls: hostedUrls,
          },
        }),
      });
    }

    if (!resp.ok) {
      const err = await resp.text().catch(() => '');
      console.error('Failed to save followed trail:', resp.status, err);
      throw new Error(err || 'Failed to save followed trail');
    }

    const data = await resp.json();
    setTrails((prev: Trail[]) => [data, ...prev]);
    return data as Trail;
  }, [session, user]);

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
  }, [session?.accessToken]);

  const getTrailById = useCallback(async (id: string): Promise<Trail | undefined> => {
    // const found = trails.find((t: Trail) => t.id === id);
    // if (found) return found;

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
  }, [session]);

  const loadNearbyTrails = useCallback(async (latitude?: number, longitude?: number, distanceKm: number = 35) => {
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

  const loadForYouTrails = useCallback(async (latitude?: number, longitude?: number, distanceKm: number = 10) => {
    try {
      if (!session?.accessToken) return [] as Trail[];

      // Ensure we have coordinates
      let lat = latitude;
      let lng = longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        try {
          const loc = await getBestAvailableLocation();
          if (loc && loc.coords) {
            lat = loc.coords.latitude;
            lng = loc.coords.longitude;
          } else {
            console.warn('No location available for /trail/for-you');
            return [] as Trail[];
          }
        } catch (err) {
          console.warn('Failed to get location for /trail/for-you call:', err);
          return [] as Trail[];
        }
      }

      const resp = await fetch(`${API_URL}/trail/for-you?latitude=${encodeURIComponent(lat as number)}&longitude=${encodeURIComponent(lng as number)}&distance_km=${encodeURIComponent(distanceKm)}`,
        { headers: { 'Authorization': `Bearer ${session.accessToken}` } }
      );
      if (resp.ok) {
        const data = await resp.json();
        return data as Trail[];
      }
      console.error('/trail/for-you failed:', resp.status);
      return [] as Trail[];
    } catch (err) {
      console.error('Error loading for-you trails:', err);
      return [] as Trail[];
    }
  }, [session]);

  const loadTrailsByTag = useCallback(async (chosenTag: string, latitude?: number, longitude?: number, distanceKm: number = 10) => {
    try {
      if (!session?.accessToken) return [] as Trail[];

      let lat = latitude;
      let lng = longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        try {
          const loc = await getBestAvailableLocation();
          if (loc && loc.coords) {
            lat = loc.coords.latitude;
            lng = loc.coords.longitude;
          } else {
            console.warn('No location available for /trail/tag');
            return [] as Trail[];
          }
        } catch (err) {
          console.warn('Failed to get location for /trail/tag call:', err);
          return [] as Trail[];
        }
      }

      const q = `latitude=${encodeURIComponent(lat as number)}&longitude=${encodeURIComponent(lng as number)}&chosen_tag=${encodeURIComponent(chosenTag)}&distance_km=${encodeURIComponent(distanceKm)}`;
      const resp = await fetch(`${API_URL}/trail/tag?${q}`, { headers: { 'Authorization': `Bearer ${session.accessToken}` } });
      if (resp.ok) {
        const data = await resp.json();
        return data as Trail[];
      }
      // console.error('/trail/tag failed:', resp.status);
      return [] as Trail[];
    } catch (err) {
      console.error('Error loading tag trails:', err);
      return [] as Trail[];
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
      console.log('Updating trail image(s) via API:', id);
      if (!session?.accessToken) throw new Error('Not authenticated');

      const uris = Array.isArray(photoOrUrls) ? photoOrUrls : [photoOrUrls];

      const form = new FormData();
      for (const uri of uris) {
        if (!uri) continue;
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1] || `trail_${Date.now()}.jpg`;
        const extMatch = fileName.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        // @ts-ignore — RN FormData accepts { uri, name, type }
        form.append('files', { uri, name: fileName, type: mimeType } as any);
      }

      const resp = await fetch(`${API_URL}/trail/${id}/images`, {
        method: 'PUT',
        headers: {
          // NOTE: Do NOT set Content-Type; fetch sets the multipart boundary automatically
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: form as any,
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Failed to update image(s)');
      }
      const updated = await resp.json();
      setTrails((prev: Trail[]) => prev.map((t: Trail) => (t.id === id ? updated : t)));
    } catch (error) {
      console.error('Failed to update trail image(s):', error);
      throw error;
    }
  }, [session]);

  const deleteTrailImage = useCallback(async (trailId: string, imageId: string) => {
    try {
      console.log('Deleting trail image via API:', trailId, imageId);
      if (!session?.accessToken) throw new Error('Not authenticated');

      const resp = await fetch(`${API_URL}/trail/${trailId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (resp.status !== 204) {
        const txt = await resp.text().catch(() => '');
        throw new Error(txt || 'Failed to delete image');
      }

      setTrails((prev: Trail[]) => prev.map((trail: any) => {
        if (trail.id !== trailId) return trail;
        const nextImages = Array.isArray(trail.images)
          ? trail.images.filter((image: any) => {
            if (!image) return false;
            if (typeof image === 'string') return true;
            return image.id !== imageId;
          })
          : trail.images;
        return { ...trail, images: nextImages };
      }));
    } catch (error) {
      console.error('Failed to delete trail image:', error);
      throw error;
    }
  }, [session]);

  const updateTrailDetails = useCallback(async (id: string, updates: {
    name?: string;
    description?: string;
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
  }, [session?.accessToken]);

  const getTrailWithUser = useCallback(async (id: string) => {
    try {
      console.log('Loading trail with user data via API:', id);
      const headers: Record<string, string> = {};
      if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }

      const resp = await fetch(`${API_URL}/trail/${id}`, {
        headers,
      });
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
  }, [session]);

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
    saveFollowTrail,
    deleteTrail,
    getTrailById,
    updateTrailName,
    updateTrailPhoto,
    deleteTrailImage,
    updateTrailDetails,
    loadNearbyTrails,
    loadForYouTrails,
    loadTrailsByTag,
    saveTrailBookmark,
    removeTrailBookmark,
    isTrailSaved,
    getTrailWithUser,
  }), [trails, savedTrails, isLoading, isSavedLoading, saveTrail, saveFollowTrail, deleteTrail, getTrailById, updateTrailName, updateTrailPhoto, deleteTrailImage, updateTrailDetails, loadNearbyTrails, loadForYouTrails, loadTrailsByTag, saveTrailBookmark, removeTrailBookmark, isTrailSaved, getTrailWithUser]);
  // include new loaders in dependency list
});

