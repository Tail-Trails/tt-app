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
  photo?: string;
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
  rating?: number;
  review?: string;
  environment_tags?: string[];
  createdAt?: string | Date | number;
}
