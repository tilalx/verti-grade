import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'https://localhost'
const VUS = Number(__ENV.VUS || 50)
const DURATION = __ENV.DURATION || '2m'
const THINK_S = Number(__ENV.THINK_S || 15)
const OVERVIEW_FIELDS =
    'id,name,color,grade,grade_system,grade_index,anchor_point,type,location,wall,screw_date,average_rating,ratings_count'
const OVERVIEW_PATH = `/api/collections/averageRating/records?perPage=500&filter=archived%3Dfalse&fields=${OVERVIEW_FIELDS}`
const SEED_ROUTES = Number(__ENV.SEED_ROUTES || 0)

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

function superuserToken() {
    const response = http.post(
        `${BASE_URL}/api/collections/_superusers/auth-with-password`,
        JSON.stringify({
            identity: __ENV.PB_SUPERUSER_EMAIL,
            password: __ENV.PB_SUPERUSER_PASSWORD,
        }),
        { headers: { 'Content-Type': 'application/json' } },
    )
    return (response.json('token') as string) || ''
}

function batch(token: string, requests: unknown[]) {
    for (let i = 0; i < requests.length; i += 50) {
        const response = http.post(
            `${BASE_URL}/api/batch`,
            JSON.stringify({ requests: requests.slice(i, i + 50) }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                },
            },
        )
        check(response, { 'batch ok': (r) => r.status === 200 })
    }
}

export function setup() {
    if (!SEED_ROUTES) return
    const token = superuserToken()
    const location = http.post(
        `${BASE_URL}/api/collections/locations/records`,
        JSON.stringify({ name: `loadtest-${Date.now()}` }),
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
        },
    )
    const locationId = location.json('id') as string
    const routes = Array.from({ length: SEED_ROUTES }, (_, i) => ({
        method: 'POST',
        url: '/api/collections/routes/records',
        body: {
            name: `loadtest route ${i}`,
            type: i % 3 ? 'Route' : 'Boulder',
            location: locationId,
            color: ['#f44336', '#2196f3', '#4caf50', '#ffeb3b'][i % 4],
            creator: ['k6'],
            screw_date: '2026-09-01',
            grade: i % 3 ? '6' : '6a',
            grade_system: i % 3 ? 'UIAA' : 'Font',
            grade_index: 10 + (i % 12),
        },
    }))
    batch(token, routes)
    const ids = (
        http
            .get(
                `${BASE_URL}/api/collections/routes/records?perPage=500&fields=id&filter=location%3D%22${locationId}%22`,
                { headers: { Authorization: token } },
            )
            .json('items') as { id: string }[]
    ).map((item) => item.id)
    const ratings = ids.flatMap((id, i) =>
        Array.from({ length: 1 + (i % 9) }, (_, n) => ({
            method: 'POST',
            url: '/api/collections/ratings/records',
            body: {
                route_id: id,
                rating: 1 + ((i + n) % 5),
                grade: '6',
                grade_system: 'UIAA',
                grade_index: 10,
                comment: `k6 ${i}-${n}`,
            },
        })),
    )
    batch(token, ratings)
}

function get(path: string, tags: Record<string, string>) {
    const response = http.get(`${BASE_URL}${path}`, { tags })
    check(response, { 'status is 200': (r) => r.status === 200 })
    return response
}

export default function () {
    get('/', { page: 'home' })
    get(OVERVIEW_PATH, { api: 'overview' })
    sleep(THINK_S * (0.5 + Math.random()))
    get('/routes', { page: 'routes' })
    get(ROUTE_LIST, { api: 'routes' })
    get(ROUTE_LIST.replace('page=1', 'page=2'), { api: 'routes' })
    sleep(THINK_S * (0.5 + Math.random()))
    get('/map', { page: 'map' })
    get('/api/collections/walls/records?perPage=500', { api: 'walls' })
    sleep(THINK_S * (0.5 + Math.random()))
}
