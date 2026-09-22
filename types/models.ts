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
    score?: number | null
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

export interface PermissionRecord extends BaseRecord {
    name: string
    label: string
}

export interface RoleRecord extends BaseRecord {
    name: string
    description?: string | null
    /** Chip color as `#RRGGBB`; unset falls back to the default chip surface. */
    color?: string | null
    permissions?: RecordId[] | null
}

export interface UserRecord extends BaseRecord {
    username: string
    email?: string
    emailVisibility?: boolean
    verified?: boolean
    firstname?: string | null
    lastname?: string | null
    avatar?: string | null
    role?: RecordId | null
}

export interface SettingsRecord extends BaseRecord {
    page_logo?: string | null
    page_icon?: string | null
    sign_image?: string | null
    imprint_url?: string | null
    privacy_url?: string | null
    application_url?: string | null
    organization_name?: string | null
    organization_unit_name?: string | null
    contact_email?: string | null
    audit_retention_days?: number | null
}

export type ReportContentType = 'rating' | 'route'
export type ReportReason =
    | 'hate_speech'
    | 'harassment'
    | 'violence_threat'
    | 'sexual_content'
    | 'personal_data'
    | 'ip_infringement'
    | 'spam_fraud'
    | 'other'
export type ReportStatus = 'open' | 'actioned' | 'rejected'
export type ReportDecision = 'content_removed' | 'content_kept'

/**
 * A DSA Art. 16 notice. content_id is a plain id, not a relation: the report
 * has to outlive the content it reports, because it is the record proving the
 * operator acted on the notice.
 */
export interface ReportRecord extends BaseRecord {
    content_type: ReportContentType
    content_id: RecordId
    content_url: string
    content_snapshot?: string | null
    reason: ReportReason
    explanation: string
    notifier_name: string
    notifier_email: string
    good_faith: boolean
    status: ReportStatus
    decision?: ReportDecision | '' | null
    decision_reason?: string | null
    decided_at?: string | null
    decided_by?: RecordId | null
    receipt_sent?: boolean
    notified_at?: string | null
}

export type AuditAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'login'
    | 'login_failed'
    | 'password_reset_request'
    | 'password_reset'
    | 'email_change_request'
    | 'email_change'

/**
 * One user action, written server-side by the hooks in pb_hooks/audit.pb.js.
 *
 * changed_fields holds field NAMES and never values: a value-carrying log
 * would be a second copy of every collection, with its own retention clock
 * and its own erasure problem.
 *
 * actor is empty for anonymous visitors and for PocketBase superusers, whose
 * ids belong to a different collection than the relation targets -- read
 * actor_label for those. It cascades, so deleting a user takes their entries
 * with them.
 */
export interface AuditLogRecord extends BaseRecord {
    actor?: RecordId | null
    actor_label?: string | null
    action: AuditAction
    collection_name?: string | null
    record_id?: string | null
    changed_fields?: string[] | null
    ip?: string | null
}

/**
 * One queued in-app notification, addressed to a single user.
 *
 * `type` is free text rather than a union so a new event kind costs an i18n
 * key (notifications.center.types.<type>) and nothing else -- the wording is
 * never stored, only the type and its interpolation `params`, so the queue
 * reads in whichever locale the recipient uses.
 */
export interface NotificationRecord extends BaseRecord {
    user: RecordId
    type: string
    params?: Record<string, unknown> | null
    url?: string | null
    read: boolean
}

export interface RouteScoreRecord extends RouteRecord {
    average_rating?: number | null
    ratings_count?: number
}

export type PocketBaseRecord =
    | RouteRecord
    | RouteListItem
    | RatingRecord
    | RouteComment
    | PermissionRecord
    | RoleRecord
    | UserRecord
    | SettingsRecord
    | ReportRecord
    | AuditLogRecord
    | NotificationRecord
    | RouteScoreRecord

export interface ListResult<T> {
    page: number
    perPage: number
    totalItems: number
    totalPages: number
    items: T[]
}
