
'use strict';

const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// In a multi-instance deployment, the default in-memory store
// maintains separate counters for each server instance.
// Behind a load balancer, requests may reach different instances,
// allowing a client to exceed the intended limit.
// A Redis-backed store (rate-limit-redis) replaces the default
// MemoryStore and provides shared counters across all instances.

module.exports = authLimiter;
