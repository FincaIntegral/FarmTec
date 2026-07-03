import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, timeout, retry } from 'rxjs';
import { buildHeaders, buildParams, HttpRequestOptions } from './http-options';
import { RequestBuilder } from './request-builder';
import { apiConfig } from '../config/api.config';

export interface ApiClientRequestOptions extends HttpRequestOptions {
  readonly isMultipart?: boolean;
  readonly timeoutMs?: number;
  readonly retryCount?: number;
  readonly signal?: AbortSignal;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly builder = inject(RequestBuilder);

  private prepare<T>(
    endpoint: string | ((...args: string[]) => string),
    pathParams?: Readonly<Record<string, string>>,
    body?: T,
    options: ApiClientRequestOptions = {}
  ) {
    const url = this.builder.resolveUrl(endpoint, pathParams);
    let headers = buildHeaders(apiConfig.defaultHeaders);

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        if (value !== undefined && value !== null) {
          headers = headers.set(key, value);
        }
      }
    }

    if (options.isMultipart) {
      const contentType = headers.get('Content-Type');
      if (contentType?.includes('application/json')) {
        headers = headers.delete('Content-Type');
      }
    }

    const params = this.builder.buildQueryParams(options.params);
    const processedBody = body !== undefined ? this.builder.buildBody(body, options.isMultipart) : undefined;

    return { url, headers, params, body: processedBody };
  }

  private request<T>(
    method: string,
    endpoint: string | ((...args: string[]) => string),
    pathParams?: Readonly<Record<string, string>>,
    body?: unknown,
    options: ApiClientRequestOptions = {}
  ): Observable<T> {
    const { url, headers, params, body: finalBody } = this.prepare(endpoint, pathParams, body, options);

    let request$ = this.http.request<T>(method, url, {
      body: finalBody,
      headers,
      params,
      observe: options.observe ?? 'body',
      responseType: options.responseType ?? 'json',
      reportProgress: options.reportProgress ?? false,
      withCredentials: options.withCredentials ?? false,
      signal: options.signal,
    });

    if (options.timeoutMs) {
      request$ = request$.pipe(timeout(options.timeoutMs));
    }

    if (options.retryCount && options.retryCount > 0) {
      request$ = request$.pipe(retry(options.retryCount));
    }

    return request$;
  }

  get<T>(
    endpoint: string | ((...args: string[]) => string),
    pathParams?: Readonly<Record<string, string>>,
    options?: ApiClientRequestOptions
  ): Observable<T> {
    return this.request<T>('GET', endpoint, pathParams, undefined, options);
  }

  post<T>(
    endpoint: string | ((...args: string[]) => string),
    body?: unknown,
    pathParams?: Readonly<Record<string, string>>,
    options?: ApiClientRequestOptions
  ): Observable<T> {
    return this.request<T>('POST', endpoint, pathParams, body, options);
  }

  put<T>(
    endpoint: string | ((...args: string[]) => string),
    body?: unknown,
    pathParams?: Readonly<Record<string, string>>,
    options?: ApiClientRequestOptions
  ): Observable<T> {
    return this.request<T>('PUT', endpoint, pathParams, body, options);
  }

  patch<T>(
    endpoint: string | ((...args: string[]) => string),
    body?: unknown,
    pathParams?: Readonly<Record<string, string>>,
    options?: ApiClientRequestOptions
  ): Observable<T> {
    return this.request<T>('PATCH', endpoint, pathParams, body, options);
  }

  delete<T>(
    endpoint: string | ((...args: string[]) => string),
    pathParams?: Readonly<Record<string, string>>,
    options?: ApiClientRequestOptions
  ): Observable<T> {
    return this.request<T>('DELETE', endpoint, pathParams, undefined, options);
  }

  upload<T>(
    endpoint: string | ((...args: string[]) => string),
    formData: FormData,
    pathParams?: Readonly<Record<string, string>>,
    options?: ApiClientRequestOptions
  ): Observable<T> {
    return this.request<T>('POST', endpoint, pathParams, formData, { ...options, isMultipart: true });
  }

  download(
    endpoint: string | ((...args: string[]) => string),
    pathParams?: Readonly<Record<string, string>>,
    options?: ApiClientRequestOptions
  ): Observable<Blob> {
    return this.request<Blob>('GET', endpoint, pathParams, undefined, { ...options, responseType: 'blob' });
  }
}