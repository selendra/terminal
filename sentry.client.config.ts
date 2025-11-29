// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable Sentry in production if DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Environment tag
  environment: process.env.NODE_ENV,

  // Release version
  release: process.env.NEXT_PUBLIC_VERSION || "1.1.0-beta.2",

  // Filter out common non-actionable errors
  ignoreErrors: [
    // Random errors that don't affect functionality
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Network errors that are expected when user goes offline
    "Failed to fetch",
    "NetworkError",
    "Network request failed",
    // WebSocket connection errors (handled by reconnection logic)
    "WebSocket connection failed",
    "WebSocket is closed",
  ],

  // Custom context
  beforeSend(event, hint) {
    // Filter out errors from browser extensions
    if (event.exception?.values?.[0]?.stacktrace?.frames) {
      const frames = event.exception.values[0].stacktrace.frames;
      const isExtensionError = frames.some(
        (frame) =>
          frame.filename?.includes("chrome-extension://") ||
          frame.filename?.includes("moz-extension://")
      );
      if (isExtensionError) {
        return null;
      }
    }

    return event;
  },
});
