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
  dogTolerance?: number; // 1-100
  nervousAroundPeople?: boolean;
  offleashReliability?: number; // 1-100
  stimulationTolerance?: number; // 1-100
  highPreyDrive?: boolean;
  walkingNeed?: number; // 1-100
  sensitiveToHeat?: boolean;
  created_at?: string;
  updated_at?: string;
}
