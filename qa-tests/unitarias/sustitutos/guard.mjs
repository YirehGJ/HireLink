// Sustituto de src/lib/server/guard.ts: el real importa Sentry y Firebase Admin, que no hacen falta aquí.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
