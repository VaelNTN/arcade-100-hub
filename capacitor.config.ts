import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arcade100hub.game',
  appName: 'Arcade 100+ Hub',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
