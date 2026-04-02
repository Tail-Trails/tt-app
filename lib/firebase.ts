import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Shared config (use Expo env vars for web builds)
const _runtimeExtra = ((Constants as any).expoConfig?.extra) || ((Constants as any).manifest?.extra) || {};

const firebaseConfig = {
  apiKey: 'AIzaSyBZzdwvQQiDUTAJEwd9hnWAyYLHIjLl7jg',
  authDomain: 'tail-trails.firebaseapp.com',
  projectId: 'tail-trails',
  storageBucket: 'tail-trails.firebasestorage.app',
  messagingSenderId: '447944956309',
  appId: '1:447944956309:web:7967f07356acd5e912be9c',
};

console.log('Firebase config:', firebaseConfig);

// Exports kept stable for the app code which expects these names:
// - `firebaseAuth` (an auth instance, may be ignored by native wrappers)
// - `signInWithEmailAndPassword(auth, email, password)`
// - `createUserWithEmailAndPassword(auth, email, password)`
// - `updateProfile(user, profile)`

let firebaseAuth: any = null;
let _impl: 'web' | 'native' | null = null;

// Web implementation using Firebase JS SDK (modular)
async function setupWeb() {
  const { initializeApp, getApps } = await import('firebase/app');
  const {
    getAuth,
    signInWithEmailAndPassword: webSignIn,
    createUserWithEmailAndPassword: webCreateUser,
    updateProfile: webUpdateProfile,
  } = await import('firebase/auth');

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  firebaseAuth = auth;
  _impl = 'web';

  return {
    signInWithEmailAndPassword: (authParam: any, email: string, password: string) =>
      webSignIn(authParam || auth, email, password),
    createUserWithEmailAndPassword: (authParam: any, email: string, password: string) =>
      webCreateUser(authParam || auth, email, password),
    updateProfile: (user: any, profile: Record<string, any>) => webUpdateProfile(user, profile),
    // Sign in to Firebase using a Google token (accessToken or idToken).
    // Returns { idToken: string, user }
    signInWithGoogle: async (_authParam: any, accessToken?: string, idToken?: string) => {
      const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
      const credential = GoogleAuthProvider.credential(idToken || null, accessToken || null);
      const cred = await signInWithCredential(_authParam || auth, credential as any);
      const token = await cred.user.getIdToken();
      return { idToken: token, user: cred.user };
    },
  };
}

// Native implementation using @react-native-firebase
async function setupNative() {
  // @react-native-firebase/app and /auth are native modules and should not be
  // statically imported on web builds. Use dynamic require to avoid bundling them for web.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const firebaseApp = require('@react-native-firebase/app');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const authModule = require('@react-native-firebase/auth');

  // authModule is a function that returns the auth singleton when called
  const nativeAuth = typeof authModule === 'function' ? authModule() : authModule.default ? authModule.default() : authModule();

  firebaseAuth = nativeAuth;
  _impl = 'native';

  return {
    signInWithEmailAndPassword: async (_authParam: any, email: string, password: string) => {
      // RN Firebase returns a promise; currentUser is available afterwards
      await nativeAuth.signInWithEmailAndPassword(email, password);
      return { user: nativeAuth.currentUser };
    },
    createUserWithEmailAndPassword: async (_authParam: any, email: string, password: string) => {
      await nativeAuth.createUserWithEmailAndPassword(email, password);
      return { user: nativeAuth.currentUser };
    },
    updateProfile: async (user: any, profile: Record<string, any>) => {
      // nativeAuth.currentUser may be the right user reference; user may also be provided
      const u = user || nativeAuth.currentUser;
      if (!u) throw new Error('No authenticated user to update');
      // RN Firebase exposes updateProfile on the user object
      // It returns a Promise
      return u.updateProfile(profile);
    },
    // Sign in to Firebase using Google token (accessToken or idToken)
    // Replace your existing signInWithGoogle inside setupNative with this:
    signInWithGoogle: async (_authParam: any, idToken?: string, accessToken?: string) => {
      // 1. Get the provider from the auth module
      // Note: Most modern versions of RN Firebase use authModule.GoogleAuthProvider
      const GoogleAuthProvider = authModule.GoogleAuthProvider;

      if (!idToken) throw new Error('ID Token is required for Google Sign-In');

      // 2. Create the credential using ONLY the idToken
      // This avoids the "malformed" error caused by empty accessTokens
      const credential = GoogleAuthProvider.credential(idToken);

      // 3. Sign in
      try {
        const userCredential = await nativeAuth.signInWithCredential(credential);
        const user = userCredential.user;

        if (!user) throw new Error('Failed to sign in with Google');

        // 4. Get the Firebase JWT to return to your backend logic
        const firebaseToken = await user.getIdToken();
        return { idToken: firebaseToken, user };
      } catch (error: any) {
        console.error('Native Firebase Auth Error:', error);
        throw error;
      }
    },
  };
}

// Initialize appropriate implementation lazily and expose wrapper functions
let cached: Promise<{
  signInWithEmailAndPassword: (a: any, e: string, p: string) => Promise<any>;
  createUserWithEmailAndPassword: (a: any, e: string, p: string) => Promise<any>;
  updateProfile: (u: any, p: Record<string, any>) => Promise<any>;
  signInWithGoogle: (a: any, accessToken?: string, idToken?: string) => Promise<{ idToken: string; user: any }>;
}> | null = null;

function ensureInit() {
  if (cached) return cached;
  // Use web implementation when running in a web environment to avoid
  // requiring native-only @react-native-firebase modules which will throw
  // at runtime (we provide a shim for those when accidentally imported).
  if (Platform.OS === 'web') {
    cached = setupWeb();
  } else {
    cached = setupNative();
  }
  return cached;
}

// Public wrappers used by the app
export async function signInWithEmailAndPassword(authParam: any, email: string, password: string) {
  const impl = await ensureInit();
  return impl.signInWithEmailAndPassword(authParam, email, password);
}

export async function createUserWithEmailAndPassword(authParam: any, email: string, password: string) {
  const impl = await ensureInit();
  return impl.createUserWithEmailAndPassword(authParam, email, password);
}

export async function updateProfile(user: any, profile: Record<string, any>) {
  const impl = await ensureInit();
  return impl.updateProfile(user, profile);
}

// Sign in to Firebase using Google tokens and return { idToken, user }
export async function signInWithGoogle(authParam: any, accessToken?: string, idToken?: string) {
  const impl = await ensureInit();
  if (!impl.signInWithGoogle) throw new Error('Google sign-in not supported by this implementation');
  return impl.signInWithGoogle(authParam, accessToken, idToken);
}

// Synchronous accessor for auth instance. Consumers may pass this to web wrappers.
export function getFirebaseAuth() {
  // If not initialized yet, initialize synchronously-ish by triggering init (but it's async).
  // Callers should import this and pass it into our wrappers (we also accept undefined).
  if (!firebaseAuth) {
    // Kick off initialization but do not await here so callers don't block.
    // This may be undefined for a short time; wrappers handle undefined by using internal auth.
    ensureInit().catch(() => { });
  }
  return firebaseAuth;
}

export default {
  getFirebaseAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
};