import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Base URL for the Havyn Express server (TTS, etc.).
 *
 * Set in the project root `.env` (see `.env.example`):
 * - `EXPO_PUBLIC_API_URL` — full URL, or
 * - `EXPO_PUBLIC_IP_ADDRESS` — host only; port defaults to 3000
 *
 * In dev, if those are unset, we infer the host from Expo (same machine as Metro),
 * then fall back to the Android emulator host, then loopback.
 */
const DEFAULT_PORT = 3000;

function ipv4FromHostUri(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri || typeof hostUri !== 'string') {
    return null;
  }
  const host = hostUri.split(':')[0]?.trim();
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return host;
  }
  return null;
}

function resolveApiBaseUrl(): string {
  const fromEnvUrl = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnvUrl) {
    return fromEnvUrl.replace(/\/$/, '');
  }

  const fromEnvIp = process.env.EXPO_PUBLIC_IP_ADDRESS?.trim();
  if (fromEnvIp) {
    return `http://${fromEnvIp}:${DEFAULT_PORT}`;
  }

  if (__DEV__) {
    const fromManifest = ipv4FromHostUri();
    if (fromManifest) {
      return `http://${fromManifest}:${DEFAULT_PORT}`;
    }
    if (Platform.OS === 'android' && !Device.isDevice) {
      return `http://10.0.2.2:${DEFAULT_PORT}`;
    }
  }

  return `http://127.0.0.1:${DEFAULT_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
