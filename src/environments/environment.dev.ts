export const environment = {
  profile: 'dev',
  production: false,
  apiBaseUrl: 'http://localhost:2300',
  authServerContextPath: '/auth-server',
  toxicBetApiBaseUrl: 'http://localhost:20000',
  bypassAuth: false,
  applicationPublicId: (typeof process !== 'undefined' && process.env && process.env['APPLICATION_PUBLIC_ID']) || '88a2c306-25df-442d-9ba1-cb3565edf872',
};
