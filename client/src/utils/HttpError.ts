import { Json } from '@/types/Json';

export class HttpError extends Error {
  status: number;
  details?: Json;

  constructor(message: string, status: number, details?: Json) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
