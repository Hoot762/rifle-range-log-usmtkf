
// Import polyfills first - order matters!
import 'react-native-polyfill-globals/auto';
import 'react-native-url-polyfill/auto';

// Add console logging to verify polyfills are loaded
console.log('Polyfills loaded');
console.log('Buffer available:', typeof Buffer !== 'undefined');
console.log('URL available:', typeof URL !== 'undefined');

// Then import the app entry point
import 'expo-router/entry';
