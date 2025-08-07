
// Import polyfills first - order matters!
import 'react-native-polyfill-globals/auto';
import 'react-native-url-polyfill/auto';

// Add stream polyfill
import { Buffer } from '@craftzdog/react-native-buffer';
import * as process from 'process';

// Make Buffer and process globally available
global.Buffer = Buffer;
global.process = process;

// Add console logging to verify polyfills are loaded
console.log('Polyfills loaded');
console.log('Buffer available:', typeof Buffer !== 'undefined');
console.log('URL available:', typeof URL !== 'undefined');
console.log('process available:', typeof process !== 'undefined');

// Then import the app entry point
import 'expo-router/entry';
