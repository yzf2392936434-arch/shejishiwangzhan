import { createTailwindPresetOfSimple } from '@lark-apaas/fullstack-presets';

export default {
  darkMode: 'class',
  presets: [createTailwindPresetOfSimple()],
  content: [
    './client/src/**/*.{ts,tsx,css}',
  ],
  plugins: [],
}