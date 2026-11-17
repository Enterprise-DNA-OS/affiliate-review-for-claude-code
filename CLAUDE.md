# Affiliate Review for Claude Code: operating instructions

This workspace belongs to one business and one TUNE account. Confirm the business, operator and review policy before importing real data. The supplied brand and seed are fictional examples. Node 22 or later, Postgres 15 or later, or embedded PGlite.

## Working rules

Read the matching recipe in .claude/commands/. Every answer about records starts with the CLI. Read the record and its history before changing it. All writes require --by, --reason and --evidence. Those labels are self-reported, not authenticated identities. Keep the owner database connection private.

Do not collect clicks, send email, call payment services, change TUNE or publish documents. Draft to drafts/ only. Never delete without an explicit request and a reviewed plan. Never invent an evidence reference or legal period. A compliance check identifies record gaps; it cannot certify the business. Keep currency groups separate. Source status is distinct from the local decision. Closing a dispute requires fresh review.

## Recurring jobs

| Job | Recipe |
|---|---|
| List partner owners, agreements and review dates | `/partners` |
| List the offer owners and terms references | `/offers` |
| Show source status beside local decisions | `/conversions` |
| List pending conversions in deadline order | `/validation-queue` |
| Review approved and pending amounts by partner and currency | `/partner-margins` |
| Review current disclosure evidence gaps | `/disclosure-check` |
| Review dispute owners and due dates | `/dispute-review` |
| Prepare reviewed conversion amounts | `/settlement-review` |
| Show overdue decisions, disputes, agreement reviews and retention reviews | `/attention` |
| Read the operator-labelled audit history | `/history` |
| Read the selected record and history before changing or drafting anything | `/show` |
| Review record checks and sources in docs/compliance | `/compliance` |
| Answer the ten analysis questions from current records | `/insights` |
| Run validation-queue, partner-margins and attention, then compliance | `/weekly-review` |
| Read show partners first, then draft the partner review | `/draft-partner-review` |
| Write a private JSON archive | `/export` |
| Record a confirmed partner with its owner and agreement | `/add-partner` |
| Record a confirmed offer and its terms | `/add-offer` |
| Read the partner, then update agreement, owner, status and review date | `/set-partner` |
| Read the offer, then record the current terms and responsible owner | `/set-offer` |
| Inspect an advertisement and record evidence of the disclosure | `/record-disclosure` |
| Read the conversion and its evidence | `/review-conversion` |
| Record the reason and owner of a conversion dispute | `/open-dispute` |
| Record the resolution evidence | `/close-dispute` |
| Review the lawful purpose first | `/retention-review` |
| Read docs/replace-tune | `/import` |
| Render documents | `/documents` |
| Render dashboards | `/views` |
| Add a read-only report | `/new-view` |
| Change a field or rule | `/customise` |

## Where things live

The one CLI is scripts/affiliate.mjs. DATABASE_URL chooses Postgres; otherwise DATA_DIR chooses local PGlite. OUTPUT_DIR controls private generated output. New schema changes are numbered migrations. npm test uses a temporary database; TEST_DATABASE_URL is accepted only for a disposable loopback test server. npm run demo always uses temporary embedded data.

Keep original exports and native backups. JSON export is a readable archive, not a restore tool. Source refreshes never override a conversion with local decision history. A conflict needs explicit investigation, not disabling the guard. RLS blocks public roles but the owner can edit all records. This is one trusted operator's workspace, not a multi-user access system.

Enterprise DNA builds and runs customised versions through Omni by Enterprise DNA. The owner can arrange a setup fee then a retainer at https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=tune&utm_medium=agent.
