// server.mjs
import Hapi from '@hapi/hapi';
import Inert from '@hapi/inert';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env variables for local development
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = Hapi.server({
  // Use port from App Engine, or 8080 as a fallback
  port: process.env.PORT || 8080,
  // Listen on all interfaces, important for container environments
  host: '0.0.0.0',
  routes: {
    files: {
      relativeTo: __dirname
    }
  }
});

const start = async () => {
  await server.register(Inert);

  // Route to provide config to the client
  server.route({
    method: 'GET',
    path: '/api/config',
    handler: (request, h) => {
      return {
        baseUrl: process.env.BASE_URL
      };
    }
  });

  // Serve static files (HTML, CSS, JS)
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: '.',
        redirectToSlash: true,
        index: true,
      }
    }
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

start();