/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const auditLogs = app.findCollectionByNameOrId('audit_logs_col_id')
        auditLogs.fields.getById('relation_audit_actor').cascadeDelete = false
        app.save(auditLogs)
    },
    (app) => {
        const auditLogs = app.findCollectionByNameOrId('audit_logs_col_id')
        auditLogs.fields.getById('relation_audit_actor').cascadeDelete = true
        app.save(auditLogs)
    },
)
