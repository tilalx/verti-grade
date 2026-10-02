import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'https://localhost'
const VUS = Number(__ENV.VUS || 50)
const DURATION = __ENV.DURATION || '2m'

export const options = {
    insecureSkipTLSVerify: true,
    scenarios: {
        public_users: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: VUS },
                { duration: DURATION, target: VUS },
                { duration: '15s', target: 0 },
            ],
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<1000'],
        'http_req_duration{page:home}': ['p(95)<1000'],
        'http_req_duration{page:routes}': ['p(95)<1000'],
        'http_req_duration{api:overview}': ['p(95)<300'],
        'http_req_duration{api:routes}': ['p(95)<300'],
    },
}

const ROUTE_LIST =
    '/api/collections/averageRating/records?page=1&perPage=20&filter=archived%3Dfalse&sort=-screw_date&expand=location%2Cwall'

function get(path: string, tags: Record<string, string>) {
    const response = http.get(`${BASE_URL}${path}`, { tags })
    check(response, { 'status is 200': (r) => r.status === 200 })
    return response
}

export default function () {
    get('/', { page: 'home' })
    get('/api/public/overview', { api: 'overview' })
    sleep(2)
    get('/routes', { page: 'routes' })
    get(ROUTE_LIST, { api: 'routes' })
    get(ROUTE_LIST.replace('page=1', 'page=2'), { api: 'routes' })
    sleep(3)
    get('/map', { page: 'map' })
    get('/api/collections/walls/records?perPage=500', { api: 'walls' })
    sleep(Math.random() * 5 + 5)
}
