import type { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '../config/env';
export class BaseClient {
  constructor(
    protected readonly request: APIRequestContext,
    protected token?: string,
  ) {}
  setToken(token: string) {
    this.token = token;
  }
  protected call(
    path: string,
    options: Parameters<APIRequestContext['fetch']>[1] = {},
  ): Promise<APIResponse> {
    return this.request.fetch(`${env.API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...options.headers,
      },
    });
  }
}
