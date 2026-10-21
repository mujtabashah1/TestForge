import { BaseClient } from './base.client';
export class AuthClient extends BaseClient {
  register(data: { name: string; email: string; password: string }) {
    return this.call('/auth/register', { method: 'POST', data });
  }
  login(email: string, password: string) {
    return this.call('/auth/login', { method: 'POST', data: { email, password } });
  }
  me() {
    return this.call('/auth/me');
  }
  logout() {
    return this.call('/auth/logout', { method: 'POST' });
  }
}
