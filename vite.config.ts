import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { needsSourceGate } from './vite/needsSourceGate';

export default defineConfig({
  // needsSourceGate is the mechanical enforcement of CLAUDE.md hard rule 1. It
  // only applies to production builds and it fails them. See the file for why
  // it scans the emitted bundle rather than the source.
  plugins: [react(), tailwindcss(), needsSourceGate()],
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
});
