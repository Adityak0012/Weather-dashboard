import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` makes the production build work from any sub-path,
// including GitHub Pages (https://<user>.github.io/<repo>/).
export default defineConfig({
  plugins: [react()],
  base: './',
});
