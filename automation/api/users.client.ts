import { BaseClient } from './base.client';
export class UsersClient extends BaseClient {
  me() {
    return this.call('/auth/me');
  }
}
