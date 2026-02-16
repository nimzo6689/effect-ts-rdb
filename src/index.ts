import { Effect, Layer } from 'effect';
import { NodeHttpClient, NodeHttpServer, NodeRuntime, NodeTerminal } from '@effect/platform-node';
import { createServer } from 'node:http';
import { Database } from './database.js';
import { client } from './cli/repl.js';
import { server } from './http.js';

const httpServerPort = 32198;

const main = Effect.gen(function* () {
  const args = process.argv.slice(2);

  if (args.includes('--server')) {
    return yield* Layer.launch(
      Layer.provide(
        server,
        Layer.merge(
          NodeHttpServer.layer(() => createServer(), { port: httpServerPort }),
          Database.Default,
        ),
      ),
    );
  } else {
    return yield* client(httpServerPort).pipe(
      Effect.provide(Layer.mergeAll(NodeTerminal.layer, NodeHttpClient.layerUndici)),
    );
  }
});

NodeRuntime.runMain(main);
