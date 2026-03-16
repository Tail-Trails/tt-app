export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Trail {
  id: string;
  date: number;
  distance: number;
  duration: number;
  coordinates: Coordinate[];
  name?: string;
  // For new creates, the client should send `urls` (array of image URLs uploaded beforehand).
  // The backend returns `images` for saved trails. `photo` is kept for backward compatibility.
  photo?: string;
  urls?: string[];
  images?: string[];
  city?: string;
  country?: string;
  description?: string;
  tags?: string[];
  elevation?: number;
  surfaceType?: string;
  difficulty?: string;
  location?: string;
  pace?: string;
  speed?: number;
  maxElevation?: number;
  user_id?: string;
  rating: number;
  review?: string;
  environment_tags?: string[];
  // Review inputs from the mobile UI
  dogTraffic?: number;
  footTraffic?: number;
  paths?: number;
  exposure?: number;
  offLeash?: boolean;
  wildlife?: boolean;
  createdAt?: string | Date | number;
  // Optional client/backend-provided fields
  path?: number[][];
  startLatitude?: number;
  startLongitude?: number;
  distanceFromUser?: number;
  dogMatchScore: number;
}
