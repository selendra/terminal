// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable Sentry in production if DSN is configured
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment tag
  environment: process.env.NODE_ENV,

  // Release version
  release: process.env.NEXT_PUBLIC_VERSION || "1.1.0-beta.2",

  // Filter out common non-actionable errors
  ignoreErrors: [
    // Network/RPC errors that are handled by fallback logic
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ENOTFOUND",
    // WebSocket errors
    "WebSocket connection failed",
  ],
});
