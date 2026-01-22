// On web, allow a runtime global (injected by index.html or hosting) to override process.env.
declare const global: any;
const runtimeUrl = typeof window !== 'undefined' ? (window as any).__EXPO_PUBLIC_API_URL__ : undefined;
export const API_URL = runtimeUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

// Helpful at runtime to know which endpoint is being used.
console.log('Current API URL:', API_URL);
// Helpers for base64url <-> ArrayBuffer conversions used by WebAuthn flows on web
export function base64UrlToBuffer(base64Url: string): Uint8Array {
	const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
	const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
	const rawLength = raw.length;
	const array = new Uint8Array(rawLength);
	for (let i = 0; i < rawLength; ++i) {
		array[i] = raw.charCodeAt(i);
	}
	return array;
}

export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
	const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	const b64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
	return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Frontend helpers to call WebAuthn-related backend endpoints
export async function webauthnRegisterOptions(email: string, name?: string) {
	const res = await fetch(`${API_URL}/webauthn/register/options`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, name }),
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.detail || 'Failed to get registration options');
	}
	return res.json();
}

export async function webauthnRegisterVerify(payload: Record<string, any>) {
	const res = await fetch(`${API_URL}/webauthn/register/verify`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.detail || 'Failed to verify registration');
	}
	return res.json();
}

export async function webauthnAuthOptions(email: string) {
	const res = await fetch(`${API_URL}/webauthn/auth/options`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email }),
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.detail || 'Failed to get auth options');
	}
	return res.json();
}

export async function webauthnAuthVerify(payload: Record<string, any>) {
	const res = await fetch(`${API_URL}/webauthn/auth/verify`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.detail || 'Failed to verify authentication');
	}
	return res.json();
}