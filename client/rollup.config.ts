import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Define custom chunking logic here
          // Return the name of the chunk for the given module ID
          // Example: group all lodash modules into a single chunk
          if (id.includes('node_modules/lodash/')) {
            return 'lodash';
          }
        },
      },
    },
  },
});
