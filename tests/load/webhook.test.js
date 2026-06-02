import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

export const errorRate = new Rate('errors');
export const queueLatency = new Trend('queue_latency');

export const options = {
  scenarios: {
    // Stage 1: Warmup
    warmup: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { target: 200, duration: '30s' }, // Ramp to 200 requests per second
      ],
    },
    // Stage 2: 10,000 Group Simulation Spike
    spike: {
      executor: 'ramping-arrival-rate',
      startRate: 200,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 1000,
      stages: [
        { target: 1000, duration: '1m' }, // Spike to 1,000 requests per second
        { target: 1000, duration: '2m' }, // Hold at 1,000 req/sec
        { target: 0, duration: '30s' },   // Cool down
      ],
      startTime: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // Webhook must acknowledge within 500ms
    errors: ['rate<0.01'], // Error rate must be less than 1%
  },
};

const WEBHOOK_SECRET = __ENV.WEBHOOK_SECRET || 'test_secret';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const payload = JSON.stringify({
    update_id: Math.floor(Math.random() * 1000000000),
    message: {
      message_id: 1,
      from: { id: 12345, is_bot: false, first_name: 'LoadTestUser' },
      chat: { id: -100123456789, type: 'supergroup', title: 'Load Test Group' },
      date: Math.floor(Date.now() / 1000),
      text: '/ping',
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Bot-Api-Secret-Token': WEBHOOK_SECRET,
    },
  };

  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/api/v1/webhook`, payload, params);
  const endTime = Date.now();

  const success = check(res, {
    'is status 200': (r) => r.status === 200,
    'returns ok true': (r) => r.json('ok') === true,
  });

  errorRate.add(!success);
  
  // Since webhook is async, we simulate queue latency tracking separately in a real environment
  // (e.g., QStash metrics dashboard). Here we just measure the immediate API response time.
  queueLatency.add(endTime - startTime);

  sleep(0.1);
}
