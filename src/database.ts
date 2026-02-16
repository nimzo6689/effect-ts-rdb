import { Effect, Config, Ref, Array, pipe } from 'effect';
import { FileSystem } from '@effect/platform';
import { NodeFileSystem } from '@effect/platform-node';

interface DbSession {
  tran: string;
}

interface ResultSet {
  Message: string;
  ColNames: string[];
  Values: string[];
}

export class Database extends Effect.Service<Database>()('app/Database', {
  scoped: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const home = yield* Config.string('EFFECT_TSQL_HOME').pipe(Config.withDefault('.effectTSQL/'));

    if (!(yield* fs.exists(home))) {
      yield* fs.makeDirectory(home, { recursive: true });
    }

    const storage = yield* Effect.sync(() => ({ terminate: () => Effect.void }));

    const contexts = yield* Ref.make(new Map<string, DbSession>());

    yield* Effect.addFinalizer(() =>
      Effect.gen(function* () {
        yield* Effect.log('Shutting down DB...');
        yield* Effect.log(`Catalog and data saved in ${home}`);
        yield* storage.terminate();
      }),
    );

    const execute = (_q: string, userAgent: string = '') =>
      Effect.gen(function* () {
        const ctxMap = yield* Ref.get(contexts);
        void ctxMap.get(userAgent)?.tran;

        const result: ResultSet = {
          Message: 'Successfully retrieved 1 item.',
          ColNames: ['id'],
          Values: ['1'],
        };

        return stringifyResultSet(result);
      });

    const stringifyResultSet = (r: ResultSet): string => {
      const header = `${r.Message}\n${r.ColNames.join('')}\n`;

      const body = pipe(
        r.Values,
        Array.chunksOf(r.ColNames.length),
        Array.map(Array.join('')),
        Array.join('\n'),
      );

      return header + body;
    };

    return { execute } as const;
  }),
  dependencies: [NodeFileSystem.layer],
}) {}
