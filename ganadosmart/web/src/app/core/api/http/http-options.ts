import { HttpHeaders, HttpParams } from '@angular/common/http';

export function buildHeaders(
  entries?: Readonly<Record<string, string | undefined>>
): HttpHeaders {
  let headers = new HttpHeaders();
  if (!entries) {
    return headers;
  }
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) {
      headers = headers.set(key, value);
    }
  }
  return headers;
}

export function buildParams(
  entries?: Readonly<Record<string, string | number | boolean | ReadonlyArray<string | number | boolean> | undefined>>
): HttpParams {
  let params = new HttpParams();
  if (!entries) {
    return params;
  }
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        for (const item of value) {
          params = params.append(key, String(item));
        }
      } else {
        params = params.set(key, String(value));
      }
    }
  }
  return params;
}

export interface HttpRequestOptions {
  readonly headers?: HttpHeaders;
  readonly params?: HttpParams;
  readonly observe?: 'body';
  readonly responseType?: 'json';
  readonly withCredentials?: boolean;
}

export function buildRequestOptions(
  overrides?: Readonly<HttpRequestOptions>
): HttpRequestOptions {
  return {
    observe: 'body',
    responseType: 'json',
    ...overrides,
  };
}