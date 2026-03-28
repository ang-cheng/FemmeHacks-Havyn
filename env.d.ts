declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
    /** LAN IP for the dev machine (no protocol), e.g. 192.168.1.10 — used when EXPO_PUBLIC_API_URL is unset */
    EXPO_PUBLIC_IP_ADDRESS?: string;
  }
}
