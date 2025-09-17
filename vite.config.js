        import { defineConfig } from 'vite';
        import react from '@vitejs/plugin-react';
        import fs from 'fs';

        export default defineConfig({
          server: {
            https: {
              key: fs.readFileSync('./ssl/192.168.1.44-key.pem'),
              cert: fs.readFileSync('./ssl/192.168.1.44.pem'),
            },
          },
          plugins: [react()],
        });