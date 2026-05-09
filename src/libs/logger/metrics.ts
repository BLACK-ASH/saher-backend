import client from 'prom-client';

export const register = new client.Registry();

// Default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// HTTP request counter
export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Request duration in ms',
  labelNames: ['method', 'route', 'status'],
  buckets: [10, 50, 100, 300, 500, 1000, 3000],
});

register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestDuration);
