import PocketBase from 'pocketbase'

let url = 'http://localhost'

if(import.meta.dev) {
    url = 'http://localhost:8090'
}

const pb = new PocketBase(url)

export const useServerPocketbase = () => {
    return pb
}