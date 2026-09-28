import type PocketBase from 'pocketbase'
import fs from 'node:fs'
import path from 'node:path'

export const SETTINGS_ID = 'settings_123456'

const SNAPSHOT_FILE = path.join(__dirname, '..', '.auth', 'snapshot.json')

interface Snapshot {
    rateLimitsEnabled: boolean
    settings: Record<string, unknown>
}

async function restorableSettings(pb: PocketBase) {
    const collection = await pb.collections.getOne('settings')
    const record = await pb.collection('settings').getOne(SETTINGS_ID)
    return Object.fromEntries(
        collection.fields
            .filter(
                (field) =>
                    !field.system && !['file', 'autodate'].includes(field.type),
            )
            .map((field) => [field.name, record[field.name]]),
    )
}

export async function takeSnapshot(pb: PocketBase) {
    if (fs.existsSync(SNAPSHOT_FILE)) return
    const snapshot: Snapshot = {
        rateLimitsEnabled: !!(await pb.settings.getAll()).rateLimits?.enabled,
        settings: await restorableSettings(pb),
    }
    fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true })
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot))
}

export async function restoreSnapshot(pb: PocketBase) {
    if (!fs.existsSync(SNAPSHOT_FILE)) return
    const snapshot: Snapshot = JSON.parse(
        fs.readFileSync(SNAPSHOT_FILE, 'utf8'),
    )
    await pb.collection('settings').update(SETTINGS_ID, snapshot.settings)
    await pb.settings.update({
        rateLimits: { enabled: snapshot.rateLimitsEnabled },
    })
    fs.rmSync(SNAPSHOT_FILE)
}
