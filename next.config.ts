import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    'react-native-web',
  ],
  webpack(config) {
    config.resolve.alias = { ...config.resolve.alias, 'react-native$': 'react-native-web' };
    Object.assign(config.resolve.alias, {
      'expo-audio': require.resolve('./shims/expo-audio.ts'),
      'expo-file-system': require.resolve('./shims/expo-file-system.ts'),
      'expo-speech': require.resolve('./shims/expo-speech.ts'),
      'expo-status-bar': require.resolve('./shims/expo-status-bar.tsx'),
      '@react-native-async-storage/async-storage': require.resolve('./shims/async-storage.ts'),
    });
    config.resolve.extensions = [
      '.web.tsx', '.web.ts', '.web.jsx', '.web.js', ...config.resolve.extensions,
    ];
    config.module.rules.push({
      test: /\.(mp3|wav)$/i,
      type: 'asset/resource',
    });
    return config;
  },
};

export default nextConfig;
