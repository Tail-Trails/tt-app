// On web, allow a runtime global (injected by index.html or hosting) to override process.env.
declare const global: any;
const runtimeUrl = typeof window !== 'undefined' ? (window as any).__EXPO_PUBLIC_API_URL__ : undefined;
export const API_URL = runtimeUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

// Helpful at runtime to know which endpoint is being used.
console.log('Current API URL:', API_URL);