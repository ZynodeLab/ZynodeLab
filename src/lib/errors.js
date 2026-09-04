export class ZynodeError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'ZynodeError';
    this.code = code;
    this.details = details;
  }
}
