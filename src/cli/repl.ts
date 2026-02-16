import { Effect } from 'effect';
import { HttpClient, HttpClientRequest, Terminal } from '@effect/platform';
import { prompt } from './prompt.js';

export const client = (port: number) =>
  Effect.gen(function* () {
    const terminal = yield* Terminal.Terminal;
    const httpClient = yield* HttpClient.HttpClient;

    yield* terminal.display(
      'effect-ts-rdb: An RDB implementation written in Effect-TS for learning purposes.\n',
    );

    return yield* Effect.forever(
      Effect.gen(function* () {
        const sql = yield* prompt('>> ');

        if (sql.trim() === '') return;

        const responseText = yield* HttpClientRequest.post(`http://localhost:${port}/`).pipe(
          HttpClientRequest.bodyText(sql),
          httpClient.execute,
          Effect.flatMap((res) => res.text),
          Effect.catchAll((err) => Effect.succeed(`Error: ${err}`)),
        );

        yield* terminal.display(`${responseText}\n`);
      }),
    );
  });
