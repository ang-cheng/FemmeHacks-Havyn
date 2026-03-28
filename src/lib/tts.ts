import { API_BASE_URL } from '@/constants/api';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Calls POST /tts and returns base64-encoded MPEG audio for use in a data URI with expo-av.
 */
export async function fetchTtsBase64(text: string, voiceId: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `TTS request failed (${res.status})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return arrayBufferToBase64(arrayBuffer);
}
