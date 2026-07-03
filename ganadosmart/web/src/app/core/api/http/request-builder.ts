import { HttpHeaders, HttpParams } from '@angular/common/http';
import { buildHeaders, buildParams } from './http-options';

export interface RequestContext<T = unknown> {
  readonly url: string;
  readonly pathParams?: Readonly<Record<string, string>>;
  readonly queryParams?: Readonly<Record<string, unknown>>;
  readonly headers?: Readonly<Record<string, string | undefined>>;
  readonly body?: T;
  readonly isMultipart?: boolean;
}

export class RequestBuilder {
  private resolveEndpointUrl(
    endpoint: string | ((...args: string[]) => string),
    pathParams?: Readonly<Record<string, string>>
  ): string {
    if (typeof endpoint === 'function') {
      const args = pathParams ? Object.values(pathParams) : [];
      return endpoint(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
    }
    let url = endpoint;
    if (pathParams) {
      for (const [key, value] of Object.entries(pathParams)) {
        url = url.replace(`:${key}`, value).replace(`{${key}}`, value);
      }
    }
    return url;
  }

  buildQueryParams(queryParams?: Readonly<Record<string, unknown>>): HttpParams {
    return buildParams(queryParams as Record<string, string | number | boolean> | undefined);
  }

  buildHeaders(headers?: Readonly<Record<string, string | undefined>>): HttpHeaders {
    return buildHeaders(headers);
  }

  buildBody<T>(body?: T, isMultipart?: boolean): T | FormData {
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

  build<T>(context: RequestContext<T>): {
    readonly url: string;
    readonly params: HttpParams;
    readonly headers: HttpHeaders;
    readonly body: T | FormData;
  } {
    return {
      url: this.resolveEndpointUrl(context.url, context.pathParams),
      params: this.buildQueryParams(context.queryParams),
      headers: this.buildHeaders(context.headers),
      body: this.buildBody(context.body, context.isMultipart),
    };
  }
}

export const requestBuilder = new RequestBuilder();