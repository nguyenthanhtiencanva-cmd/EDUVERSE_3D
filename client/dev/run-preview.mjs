// A separate cache keeps this review server independent of other Vite sessions.
import { createServer } from 'vite';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const server = await createServer({
  cacheDir: join(tmpdir(), `eduverse-review-${process.pid}`),
  server: { host: '127.0.0.1', port: 3000, strictPort: true },
});
await server.listen();
server.printUrls();
