import PocketBase from 'pocketbase';

let url = '/';

if (typeof window === 'undefined') {
    url = "http://localhost:8080"

    if (import.meta.dev) {
        url = 'http://localhost:8090';
    }

} else {
    if (import.meta.dev) {
        url = 'http://localhost:8090';
    }
}

const pb = new PocketBase(url);

export const usePocketbase = () => {
    return pb;
};