import { HttpError } from '../utils/HttpError.js';

export function validateRequest(schema, source) {
  return (request, _response, next) => {
    const result = schema.safeParse(request[source]);

    if (!result.success) {
      next(new HttpError(400, `Invalid request ${source}`));
      return;
    }

    request[`validated${source[0].toUpperCase()}${source.slice(1)}`] = result.data;
    next();
  };
}
