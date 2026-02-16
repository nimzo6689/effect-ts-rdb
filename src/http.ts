import { Effect } from 'effect';
import { HttpRouter, HttpServer, HttpServerRequest, HttpServerResponse } from '@effect/platform';
import { Database } from './database.js';

export const server = HttpRouter.empty.pipe(
  HttpRouter.post(
    '/',
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const sql = yield* request.text;
      const db = yield* Database;
      const result = yield* db.execute(sql);
      return HttpServerResponse.text(result);
    }),
  ),
  HttpServer.serve(),
  HttpServer.withLogAddress,
);
