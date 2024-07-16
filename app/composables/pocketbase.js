import PocketBase from 'pocketbase'

const pb = new PocketBase('/')

export const usePocketbase = () => {
    return pb
}
