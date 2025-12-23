export type DogSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

export const DOG_SIZES: DogSize[] = ['XS', 'S', 'M', 'L', 'XL'];

export const PERSONALITY_TAGS = [
  'Friendly',
  'Shy',
  'Energetic',
  'Calm',
  'Social',
  'Independent',
  'Playful',
  'Curious',
  'Barky',
  'Reactive',
  'Easily Triggered',
  'Gentle',
  'Protective',
  'Anxious',
  'Confident',
  'Food-Motivated',
  'Quiet',
  'Adventurous',
  'Lazy',
  'Affectionate',
  'Dominant',
  'Submissive',
  'Fearful',
  'Obedient',
  'Stubborn',
  'High-Prey-Drive',
  'Leash-Pulling',
  'Good-With-Dogs',
  'Good-With-Kids',
] as const;

export type PersonalityTag = typeof PERSONALITY_TAGS[number];

export type RecallReliability = 'Poor' | 'Fair' | 'Good' | 'Excellent';

export const RECALL_RELIABILITY_OPTIONS: RecallReliability[] = ['Poor', 'Fair', 'Good', 'Excellent'];

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
  photo?: string;
  personality_tags: string[];
  vaccines?: Vaccine[];
  recall_reliability?: RecallReliability;
  created_at?: string;
  updated_at?: string;
}
