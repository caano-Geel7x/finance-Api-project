import { HttpError } from '../utils/HttpError.js';

export function validateBody(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      next(new HttpError(400, 'Invalid request body'));
      return;
    }

    request.body = result.data;
    next();
  };
}
