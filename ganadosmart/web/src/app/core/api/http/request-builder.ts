import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiConfig } from '../config/api.config';
import { buildHeaders, buildParams } from './http-options';

@Injectable({ providedIn: 'root' })
export class RequestBuilder {
  resolveUrl(
    endpoint: string | ((...args: string[]) => string),
    pathParams?: Readonly<Record<string, string>>
  ): string {
    if (typeof endpoint === 'function') {
      const args = pathParams ? Object.values(pathParams) : [];
      const path = endpoint(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
      return `${apiConfig.baseUrl}${path}`;
    }
    let url = endpoint;
    if (pathParams) {
      for (const [key, value] of Object.entries(pathParams)) {
        url = url.replace(`:${key}`, value).replace(`{${key}}`, value);
      }
    }
    return `${apiConfig.baseUrl}${url}`;
  }

  buildQueryParams(queryParams?: Readonly<Record<string, unknown>>): HttpParams {
    return buildParams(queryParams as Record<string, string | number | boolean> | undefined);
  }

  buildHeaders(headers?: Readonly<Record<string, string | undefined>>): HttpHeaders {
    return buildHeaders(headers);
  }

  buildBody<T>(body?: T, isMultipart?: boolean): T | FormData {
    if (body instanceof FormData) {
      return body;
    }
    if (isMultipart && body && typeof body === 'object') {
      const formData = new FormData();
      for (const [key, value] of Object.entries(body as unknown as Record<string, unknown>)) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
      return formData;
    }
    return body as T;
  }
}