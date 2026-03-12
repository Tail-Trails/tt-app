export type DogSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

export const DOG_SIZES: DogSize[] = ['XS', 'S', 'M', 'L', 'XL'];

// personality tags removed — replaced by explicit trait fields

// recall_reliability removed — traits drive onboarding instead

export interface Vaccine {
  name: string;
  date: string;
}

export interface DogProfile {
  id?: string;
  user_id: string;
  name: string;
  nickname?: string;
  size: DogSize;
  age: number;
  dob: string;
  image?: string;
  vaccines?: Vaccine[];
  // New trait fields (optional)
  dog_tolerance?: number; // 1-100
  nervous_around_people?: boolean;
  offleash_reliability?: number; // 1-100
  stimulation_tolerance?: number; // 1-100
  high_prey_drive?: boolean;
  walking_need?: number; // 1-100
  sensitive_to_heat?: boolean;
  created_at?: string;
  updated_at?: string;
}
