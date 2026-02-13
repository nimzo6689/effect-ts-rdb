import { Console, Effect, Layer } from 'effect';
import { NodeHttpClient, NodeHttpServer, NodeRuntime, NodeTerminal } from '@effect/platform-node';
import {
  HttpClient,
  HttpClientRequest,
  HttpRouter,
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
  Terminal,
} from '@effect/platform';
import { createServer } from 'node:http';

class Database extends Effect.Service<Database>()('app/Database', {
  effect: Effect.gen(function* () {
    yield* Console.log('Database initialized.');

    const execute = (query: string) => Effect.succeed(`Executed: ${query}`);

    return { execute };
  }),
}) {}

const router = HttpRouter.empty.pipe(
  HttpRouter.post(
    '/',
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const query = yield* request.text;
      const db = yield* Database;
      const result = yield* db.execute(query);
      return HttpServerResponse.text(result);
    }),
  ),
);

const showTitle = Effect.gen(function* () {
  const terminal = yield* Terminal.Terminal;
  yield* terminal.display(
    'effect-ts-rdb: An RDB implementation written in Effect-TS for learning purposes.\n',
  );
});

const client = Effect.gen(function* () {
  const terminal = yield* Terminal.Terminal;
  const httpClient = yield* HttpClient.HttpClient;

  yield* showTitle;

  return yield* Effect.forever(
    Effect.gen(function* () {
      yield* terminal.display('>> ');
      const q = yield* terminal.readLine;

      if (q.trim() === '') return;

      const responseText = yield* HttpClientRequest.post('http://localhost:32198/').pipe(
        HttpClientRequest.bodyText(q),
        httpClient.execute,
        Effect.flatMap((res) => res.text),
        Effect.catchAll((err) => Effect.succeed(`Error: ${err}`)),
      );

      yield* terminal.display(`${responseText}\n`);
    }),
  );
});

const app = router.pipe(HttpServer.serve(), HttpServer.withLogAddress);
const ServerLive = NodeHttpServer.layer(() => createServer(), { port: 32198 });

const main = Effect.gen(function* () {
  const args = process.argv.slice(2);

  if (args.includes('--server')) {
    return yield* Layer.launch(Layer.provide(app, Layer.merge(ServerLive, Database.Default)));
  } else {
    return yield* client;
  }
});

NodeRuntime.runMain(
  main.pipe(Effect.provide(Layer.mergeAll(NodeTerminal.layer, NodeHttpClient.layerUndici))),
);
