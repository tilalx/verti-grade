import PocketBase from 'pocketbase'

let url = '/'

if(import.meta.dev) {
    url = 'http://localhost:8090'
}

const pb = new PocketBase(url)

export const usePocketbase = () => {
    return pb
}
