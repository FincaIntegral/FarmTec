import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { STATUS_CODES } from 'http';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const isObjectResponse =
      exceptionResponse !== null && typeof exceptionResponse === 'object';

    const body = isObjectResponse
      ? (exceptionResponse as Record<string, unknown>)
      : null;

    const message =
      body?.message ??
      (typeof exceptionResponse === 'string' ? exceptionResponse : null) ??
      (exception instanceof Error ? exception.message : null) ??
      'Error interno del servidor';

    // Las excepciones de Nest sin mensaje custom (ej. new UnauthorizedException())
    // no incluyen "error" en su respuesta — se completa con la frase estándar HTTP.
    const error =
      (body?.error as string) ??
      STATUS_CODES[statusCode] ??
      'Internal Server Error';

    response.status(statusCode).json({ statusCode, message, error });
  }
}
