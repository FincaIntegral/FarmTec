export interface ApiConfig {
  readonly baseUrl: string;
  readonly apiVersion: string;
  readonly timeout: number;
  readonly defaultHeaders: Readonly<Record<string, string>>;
  readonly jwt: {
    readonly headerName: string;
    readonly headerPrefix: string;
    readonly tokenKey: string;
    readonly refreshTokenKey: string;
  };
  readonly upload: {
    readonly maxFileSize: number;
    readonly allowedMimeTypes: readonly string[];
  };
}

export const apiConfig: Readonly<ApiConfig> = {
  baseUrl: 'http://localhost:3000/api/v1',
  apiVersion: 'v1',
  timeout: 15000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  jwt: {
    headerName: 'Authorization',
    headerPrefix: 'Bearer',
    tokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
  },
  upload: {
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
} as const;