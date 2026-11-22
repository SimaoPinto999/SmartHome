import type { UserManagerSettings } from 'oidc-client-ts';

export const oidcConfig: UserManagerSettings = {
  authority: 'http://localhost:9090/application/o/smarthome/',
  client_id: 'PApuDUh4HPeMF81K26F5Z1K7NYTH44HA9JD4UWx5',
  redirect_uri: 'http://localhost:3000/callback',
  post_logout_redirect_uri: 'http://localhost:3000',
  response_type: 'code',
  scope: 'openid profile email',
  // PKCE is enabled by default in oidc-client-ts
};
