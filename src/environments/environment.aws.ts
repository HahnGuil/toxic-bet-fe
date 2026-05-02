export const environment = {
  profile: 'aws',
  production: true,
  apiBaseUrl: 'https://auth.toxicbet.com.br',
  authServerContextPath: '/auth-server',
  toxicBetApiBaseUrl: 'https://api.toxicbet.com.br',
  bypassAuth: false,
  applicationPublicId: (typeof process !== 'undefined' && process.env && process.env['APPLICATION_PUBLIC_ID']) || '84643cc6-0303-4270-9c7a-263707b3c725',
};
