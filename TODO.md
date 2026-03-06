# PostgreSQL Migration TODO

This TODO tracks the migration from SQLite (better-sqlite3) to PostgreSQL using Prisma. Files identified from search results will be updated one by one. Each file will have its SQLite imports and instances replaced with Prisma imports and queries.

## Priority Files (Open Tabs and Examples)

- [x] src/pages/api/auth/verify.ts: Replaced SQLite with Prisma queries.
- [x] src/pages/api/auth/login.ts: Standardized to Prisma and fixed field names.
- [x] src/pages/api/commission-configs/[id].ts: Replaced SQLite with Prisma queries.
- [x] src/pages/api/pages/profile.ts: Replaced SQLite with Prisma queries.
- [x] src/pages/api/pages/faqs.ts: Replaced SQLite with Prisma queries.
- [x] src/pages/api/files/upload.ts: Replaced SQLite with Prisma queries.
- [x] src/pages/api/pages/help-center/landing.ts: Replaced SQLite with Prisma queries.
- [x] src/pages/api/pages/help-center/article.ts: Replaced SQLite with Prisma queries.
- [x] src/pages/api/pages/profile/update.ts: Replaced SQLite with Prisma queries.
- [x] src/pages/api/files/uploaded.ts: Replaced SQLite with Prisma queries.
- [x] src/pages/api/agents/performance.ts: Already using Prisma; verified.

## Other API Files from Search Results

- [ ] src/pages/api/apps/users/add-user.ts
- [ ] src/pages/api/admin/help-center.ts
- [ ] src/pages/api/apps/invoice/invoices.ts
- [ ] src/pages/api/admin/settings/notifications.ts
- [ ] src/pages/api/apps/users/list.ts
- [ ] src/pages/api/apps/users/delete.ts
- [ ] src/pages/api/apps/user/users.ts
- [ ] src/pages/api/admin/settings/general.ts
- [ ] src/pages/api/admin/faqs.ts
- [ ] src/pages/api/admin/notifications.ts
- [ ] src/pages/api/commission-configs/save.ts
- [ ] src/pages/api/commission-configs/list.ts
- [ ] src/pages/api/cards/statistics.ts
- [ ] src/pages/api/commission-configs/test.ts
- [ ] src/pages/api/pages/help-center/subcategory.ts
- [ ] src/pages/api/files/stream-upload-large.ts
- [ ] src/pages/api/table/data.ts
- [ ] src/pages/api/transactions/import.ts
- [ ] src/pages/api/transactions/parsed-list.ts
- [ ] src/pages/api/transactions/large-import.ts
- [ ] src/pages/api/transactions/stream-import.ts
- [ ] src/pages/api/user/profile.ts
- [ ] src/pages/api/user/update-profile.ts
- [ ] src/pages/api/dashboard/performance.ts
- [ ] src/pages/api/dashboard/top-agents.ts
- [ ] src/pages/api/transactions/history.ts
- [ ] src/pages/api/dashboard/transaction-reports.ts
- [ ] src/pages/api/app-bar/search.ts
- [ ] src/pages/api/init-db.ts
- [ ] src/pages/api/dashboard/super-agent.ts
- [ ] src/pages/api/dashboard/franchise.ts
- [ ] src/pages/api/agents/unassigned.ts
- [ ] src/pages/api/super-agents/[id]/view.ts

## Additional Steps

- [ ] Check and update src/lib/initDb.ts if it references SQLite.
- [ ] Inspect service files (e.g., src/services/\*) for any direct SQLite usage and update if necessary.
- [ ] After all updates, run linter and tests using execute_command (e.g., npm run lint, npm test).
- [ ] Verify application functionality, especially API endpoints.
- [ ] Remove src/lib/sqlite-db.ts if no longer needed.
- [ ] Update any documentation or comments referencing SQLite.

Progress will be updated as files are migrated.
