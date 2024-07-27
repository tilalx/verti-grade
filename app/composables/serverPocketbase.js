import PocketBase from 'pocketbase'

const pb = new PocketBase('http://localhost')

export const useServerPocketbase = () => {
    return pb
}