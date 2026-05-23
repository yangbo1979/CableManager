import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.networkcabinet',
  appName: 'network-cabinet-app',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
