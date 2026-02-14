import { Effect } from 'effect';

const KEYS = {
  CTRL_C: '\u0003',
  BACKSPACE: '\u0008',
  DELETE: '\u007f',
};

export const prompt = (promptText: string): Effect.Effect<string, never, never> =>
  Effect.gen(function* () {
    yield* Effect.sync(() => process.stdout.write(promptText));
    let onData: (data: Buffer) => void;

    return yield* Effect.acquireUseRelease(
      Effect.sync(() => {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        return process.stdin;
      }),
      (stdin) =>
        Effect.async<string>((resume) => {
          let inputBuffer = '';

          onData = (key: string | Buffer) => {
            const keyStr = key.toString();

            if (keyStr === KEYS.CTRL_C) {
              process.exit();
            }

            if (['\r', '\n'].includes(keyStr)) {
              process.stdout.write('\n');
              resume(Effect.succeed(inputBuffer));
              return;
            }

            if ([KEYS.BACKSPACE, KEYS.DELETE].includes(keyStr)) {
              if (inputBuffer.length > 0) {
                inputBuffer = inputBuffer.slice(0, -1);
                process.stdout.write('\b \b');
              }
              return;
            }

            inputBuffer += keyStr;
            process.stdout.write(keyStr);
          };

          stdin.on('data', onData);

          return Effect.sync(() => {
            stdin.removeListener('data', onData);
          });
        }),
      (stdin) =>
        Effect.sync(() => {
          if (onData) {
            stdin.removeListener('data', onData);
          }
          stdin.setRawMode(false);
          stdin.pause();
        }),
    );
  });
