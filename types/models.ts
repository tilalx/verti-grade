import type { AUDIT_ACTIONS } from '../app/utils/audit'
import type { REPORT_REASONS, REPORT_STATUSES } from '../app/utils/reports'
import type { ROUTE_TYPES } from '../app/utils/routes'

export type RecordId = string

export interface BaseRecord {
    id: RecordId
    collectionId?: string
    collectionName?: string
    created?: string
    updated?: string
    expand?: Record<string, unknown>
}

export type RouteType = (typeof ROUTE_TYPES)[number] | string
export type DifficultySignValue = '+' | '-' | true | false | '' | null

type JsonArray<T> = T[] | readonly T[]
type JsonValue<T> = T | JsonArray<T>

export interface RouteRecord extends BaseRecord {
    name: string
    difficulty: number | string
    difficulty_sign?: DifficultySignValue
    anchor_point?: number | null
    location?: RecordId | null
    type?: RouteType | null
    comment?: string | null
    creator?: JsonValue<string> | null
    archived?: boolean
    archived_at?: string | null
    color?: string | null
    screw_date?: string | null
}

export interface LocationRecord extends BaseRecord {
    name: string
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
    name?: string | null
    avatar?: string | null
    role?: RecordId | null
    language?: string | null
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
    legal_address?: string | null
    legal_phone?: string | null
    legal_register?: string | null
    legal_vat_id?: string | null
    legal_editorial?: string | null
    legal_representatives?: LegalPerson[] | null
}

export interface LegalPerson {
    name: string
    role?: string
}

export type ReportContentType = 'rating' | 'route'
export type ReportReason = (typeof REPORT_REASONS)[number]
export type ReportStatus = (typeof REPORT_STATUSES)[number]
export type ReportDecision = 'content_removed' | 'content_kept'

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

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export interface AuditLogRecord extends BaseRecord {
    actor?: RecordId | null
    actor_label?: string | null
    action: AuditAction
    collection_name?: string | null
    record_id?: string | null
    changed_fields?: string[] | null
    ip?: string | null
}

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
