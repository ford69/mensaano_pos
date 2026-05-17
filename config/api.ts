// API Configuration
// For local development:
// - Use 'http://localhost:4000/api' if testing on emulator/simulator
// - Use 'http://YOUR_LOCAL_IP:4000/api' if testing on physical device
//   (Find your local IP: macOS: System Settings > Network, or run: ipconfig getifaddr en0)

const isDev = __DEV__;

// Set to true to use local backend, false for production
const USE_LOCAL_BACKEND = false;

const LOCAL_API_URL = 'http://localhost:4000/api'; // Use for emulator/simulator
// For physical device testing, use your local IP:
// const LOCAL_API_URL = 'http://192.168.100.128:4000/api';

const PRODUCTION_API_URL = 'https://api.mensaanogh.com/api';

export const API_URL = (isDev && USE_LOCAL_BACKEND) ? LOCAL_API_URL : PRODUCTION_API_URL;

