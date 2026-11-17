# Bring a TUNE conversion export across

The one-command importer reads the selected columns of a TUNE Conversion Report CSV. It is not the TUNE upload tool. Keep the export and its report settings as evidence. Try the included fictional CSV first.

## Export

In TUNE, use Reports > Conversion Report. Select the intended time range and include approved, pending and rejected records. Include Tune Event ID, Transaction ID, Partner, Offer, Status, Payout, Revenue, Sale Amount and Date / Time. Export the detailed conversion records. An aggregate status report cannot replace event-level data.

Check the [Conversion Report documentation](https://support.tune.com/hc/en-us/articles/1500005163401-Using-the-Conversion-Report) and [event identity guidance](https://support.tune.com/hc/en-us/articles/1500007725601-Importing-Conversions). Checked 17 November 2026. The vendor documents more than one event per transaction, so this importer never deduplicates by Transaction ID.

## Import once, review once

```bash
npm run migrate
node scripts/affiliate.mjs import tune examples/conversions.csv --currency=NZD --timezone-offset=+00:00 --retain-until=2027-06-30 --by="Your name" --reason="Opening balance review" --evidence="private:export-reference" --dry-run
```

Replace the example with your file, real export currency, time-zone offset and retention review date. Offset-bearing ISO timestamps do not need the offset flag. A CSV exported over a daylight-saving transition needs timestamps normalised to explicit offsets first. Remove `--dry-run` only after reviewing the counts and mapping. Read the results with `conversions`, `validation-queue` and `partner-margins`.

The default review deadline is seven days after the event. Change it with `--review-days=N`. It is an internal policy, not a statutory deadline. Use `--map=examples/column-map.json` for custom column headings. Mapping keys are `event`, `transaction`, `partner`, `offer`, `status`, `payout`, `revenue`, `sale`, `time`. Map values are your literal CSV headings.

## What maps

| Export field | Stored record |
|---|---|
| Tune Event ID | Unique source event identity |
| Transaction ID | Session reference, shared by multiple events when appropriate |
| Partner and Offer | Names matched without case; new names create incomplete records for follow-up |
| Status | Imported status; local decision starts pending |
| Payout, Revenue, Sale Amount | Signed amounts with up to two decimal places, kept as integer cents |
| Date / Time | UTC timestamp after explicit offset interpretation |

Currency must be a single explicit code for the entire file. Split mixed-currency data first. Values must be plain decimal amounts, without thousands separators or symbols. Unknown statuses, blank required fields, invalid dates and repeated event IDs fail the whole batch. Up to 10,000 rows per batch. IDs remain text. CSV quoting, BOM, embedded newlines and CRLF are supported.

Name matching needs one consistent name per partner and offer. Renames, duplicate display names and records from another TUNE account require a mapping plan. Keep separate accounts in separate databases. The importer ignores additional fields, including visitor IP addresses, email addresses, user agents and partner sub IDs. It never infers a missing sale value as zero.

## Check the switch

Reconcile source counts and sums by currency and source status, including rejected events. Review two distinct events on one transaction. Inspect a partner with pending conversions. Confirm new partner agreements, owners and offer terms with `set-partner` and `set-offer`. Record disclosure inspections independently. Compare the first partner review statement to the original report before accepting the opening record.

A repeated identical export changes nothing. A source refresh can update unreviewed events, with an audit record. Any changed event that has a local decision history blocks the entire batch. Local deadlines and retention dates survive refreshes. Do not remove the conflict gate to import a changed reviewed event: resolve the source disagreement and agree an explicit correction workflow.

## What needs separate work

Tracking links, cookies, consent, attribution rules, pixels, postbacks, partner logins, contracts, historical approval logs, custom fields and payment instructions are not migrated by this CSV. Evidence references point to files you retain privately. No visitor identity is copied from ignored columns. Keep TUNE running for live tracking until replacement connections are built and accepted.

`node scripts/affiliate.mjs export` writes all domain records to a private JSON archive. It is readable backup evidence, not an automated database restore. Keep tested native database backups too.
