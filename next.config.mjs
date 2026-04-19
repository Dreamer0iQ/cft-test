import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: false, instrumentationHook: true },
  reactStrictMode: true,
};

// withSentryConfig — no-op без DSN/AUTH_TOKEN; source maps грузятся только если указан SENTRY_AUTH_TOKEN на билде
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  hideSourceMaps: true,
  disableLogger: true,
  widenClientFileUpload: true,
  automaticVercelMonitors: false,
});
