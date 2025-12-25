/*
 * Central TypeScript models for the Verti-Grade domain.
 * These types mirror the PocketBase collections we consume in the
 * application so that both client and server code share a single source
 * of truth for record shapes.
 */

export type RecordId = string

export interface BaseRecord {
    id: RecordId
    collectionId?: string
    collectionName?: string
    created?: string
    updated?: string
    expand?: Record<string, unknown>
}

export type RouteLocation = 'Hanau' | 'Gelnhausen' | string
export type RouteType = 'Route' | 'Boulder' | string
export type DifficultySignValue = '+' | '-' | true | false | '' | null

type JsonArray<T> = T[] | readonly T[]
type JsonValue<T> = T | JsonArray<T>

export interface RouteRecord extends BaseRecord {
    name: string
    difficulty: number | string
    difficulty_sign?: DifficultySignValue
    anchor_point?: number | null
    location?: RouteLocation | null
    type?: RouteType | null
    comment?: string | null
    creator?: JsonValue<string> | null
    archived?: boolean
    color?: string | null
    screw_date?: string | null
}

export interface RouteListItem extends Omit<RouteRecord, 'creator'> {
    creator: string[]
    has_ratings?: boolean
    average_rating?: number | null
}

export interface RatingRecord extends BaseRecord {
    route_id?: RecordId | null
    rating?: number | null
    difficulty?: number | string | null
    difficulty_sign?: DifficultySignValue
    comment?: string | null
}

export interface RouteComment extends RatingRecord {
    comment: string
}

export interface UserRecord extends BaseRecord {
    username: string
    email?: string
    emailVisibility?: boolean
    verified?: boolean
    firstname?: string | null
    lastname?: string | null
    avatar?: string | null
    role?: string | null
}

export interface SettingsRecord extends BaseRecord {
    page_logo?: string | null
    page_icon?: string | null
    sign_image?: string | null
    imprint_url?: string | null
    privacy_url?: string | null
    application_url?: string | null
}

export interface AverageRatingRecord extends BaseRecord {
    route_id: RecordId
    average_rating?: number | null
}

export type PocketBaseRecord =
    | RouteRecord
    | RouteListItem
    | RatingRecord
    | RouteComment
    | UserRecord
    | SettingsRecord
    | AverageRatingRecord

export interface ListResult<T> {
    page: number
    perPage: number
    totalItems: number
    totalPages: number
    items: T[]
}
