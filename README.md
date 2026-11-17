# Affiliate Review for Claude Code

Own the decisions behind your affiliate commissions. Review TUNE conversion exports, disputed sales, partner amounts and advertising evidence in a database you own. Works with Claude Code, Codex, OpenCode or Cursor. MIT licensed.

## Three ways to use it

- **Do it yourself:** install the free base and run the review desk. Hosting, your coding-agent subscription and your time remain your costs.
- **We customise it:** Enterprise DNA maps your exports, adds your fields and review rules, and builds the connections, web front end or different stack you need.
- **We run it for you:** Omni by Enterprise DNA installs, connects and operates your version. One setup fee, then a retainer. [Book a 30-minute call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=tune&utm_medium=readme).

## Try the fictional affiliate programme

```bash
npm install
npm test
npm run demo
```

Node 22 or later. The demo creates a temporary PGlite database, loads fictional records, prints three real results and renders three dashboards plus eleven documents. It removes its own data afterwards. Use `npm run demo -- --keep` to keep the files. Demo dates are relative to the day it runs.

## Your first import

```bash
npm run migrate
node scripts/affiliate.mjs import tune exports-from-tune.csv --currency=NZD --timezone-offset=+12:00 --retain-until=2027-06-30 --by="Your name" --reason="Opening review balance" --evidence="private:export-reference" --dry-run
```

Use the export's actual currency and time-zone offset. Choose a retention review date for your lawful purpose; the example date is not a legal retention period. Inspect the dry run, then remove `--dry-run` to apply the same file. The [switching guide](docs/replace-tune.md) covers the selected report fields and mapping. Local decisions start pending even where TUNE says approved.

`DATABASE_URL` selects Postgres 15 or later. Without it, `DATA_DIR` selects embedded PGlite, defaulting to `.data/db`. `OUTPUT_DIR` selects the destination for private documents, views, drafts and exports. Keep one TUNE account, one business and one trusted operator in each workspace. Never point the demo or smoke tests at a business database.

## Five recurring jobs

1. `/validation-queue`: decide which conversions need evidence or review.
2. `/partner-margins`: separate approved amounts, pending amounts and currencies.
3. `/disclosure-check`: inspect missing, stale or unclear advertisement disclosures.
4. `/dispute-review`: resolve return or conversion disputes with a named owner.
5. `/settlement-review`: prepare the reviewed amounts for a human reconciliation.

`/weekly-review` combines the queue, partner balances, attention and compliance checks. `/draft-partner-review` writes a private draft and never sends it. Every mutation needs an operator, reason and evidence reference, and records before and after values. Imported source status and local decision stay separate. Closing a dispute resets the local decision to pending.

The base ships 26 CLI operations. The command library also covers documents, dashboards, adding a view and customising the system.

## Ten questions answered today

`/insights` answers the questions below from the current records. TUNE has its own reporting. These are included analyses, not a claim that TUNE cannot answer them.

1. Which pending conversions are overdue?
2. Which transactions have several distinct conversion events?
3. Which partners have an approved margin below zero?
4. Which conversions cost more in commission than their recorded revenue?
5. Which approved conversions are held out by a dispute?
6. Which active partners lack a current clear disclosure record?
7. Which reviewed decisions differ from the imported status?
8. Which records have passed their retention review date?
9. Which partners have pending amounts in more than one currency?
10. Which approved conversions lack a current partner agreement?

## Documents and views

Edit `brand.json` for your business name, logo and colours. `npm run docs` produces a partner review statement, conversion decision record and disclosure evidence register. These are working papers, never invoices or payment instructions. `npm run view` produces the week, partner balances and evidence dashboards. Both read from the database in a read-only transaction.

`/compliance` flags record gaps linked to New Zealand advertising disclosure guidance and privacy retention principles. Australian retention guidance is documented too. A human checks the advertisement and the lawful retention purpose. A clean report is not legal certification. [Rules and limits](docs/compliance.md).

## Your first hour: ten things to ask for

1. Show overdue decisions and the partner behind each one.
2. Explain why two events have the same transaction.
3. Show disputed conversions excluded from the review total.
4. Compare each partner's amounts without mixing currencies.
5. Record evidence for an approved conversion.
6. Reopen a decision after a dispute closes.
7. Find advertisements needing a disclosure review.
8. Draft a partner review without sending it.
9. Add an offer-owner dashboard with `/new-view`.
10. Add our internal campaign code with `/customise`.

## Scope and operating limits

This is an offline conversion review desk for direct partners. It does not collect clicks, attribute sales, host tracking domains, deliver postbacks, provide a partner marketplace, process payments, calculate tax or detect fraud. Enterprise DNA scopes and tests connections separately before any live cutover. Do not cancel tracking that your programme still depends on.

Amounts are imported facts in integer cents, not calculated commissions. Negative adjustments are allowed and flagged for review. Margins subtract recorded commission from recorded revenue and exclude other costs. A TUNE Event ID identifies a conversion; a Transaction ID can belong to several events. Partner and offer names identify import records case-insensitively; map renamed or duplicate names before importing.

Source refreshes update unreviewed conversions atomically. Any changed event with a local decision history blocks the whole import. Exact replays leave records unchanged. Missing source rows never delete local history. The JSON archive contains all seven domain record types, but is not a restore tool. Keep original exports and tested database backups.

Operator names are self-reported labels, not authentication. RLS is enabled with no public policies. Run through the owner connection in a trusted workspace; this is not a multi-tenant application or an immutable audit system. There is no delete command. If a retention review calls for deletion or de-identification, plan it with the owner, including backups and evidence copies.

[CLI reference](docs/cli.md) | [Research](docs/research.md) | [Why no front end](docs/why-no-front-end.md)
