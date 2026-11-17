# CLI reference

All commands use `node scripts/affiliate.mjs`. Add `--json` for structured output. Exact names, case-insensitive names and unambiguous ID prefixes work. Ambiguity lists candidates and exits 1. Unknown commands, unknown flags and malformed input exit 1.

## Operations

### partners

List partner owners, agreements and review dates.

```bash
node scripts/affiliate.mjs partners
```

### offers

List the offer owners and terms references.

```bash
node scripts/affiliate.mjs offers
```

### conversions

Show source status beside local decisions.

```bash
node scripts/affiliate.mjs conversions
```

### validation-queue

List pending conversions in deadline order.

```bash
node scripts/affiliate.mjs validation-queue
```

### partner-margins

Review approved and pending amounts by partner and currency.

```bash
node scripts/affiliate.mjs partner-margins
```

### disclosure-check

Review current disclosure evidence gaps. Inspect the actual advertisement before recording a clear result.

```bash
node scripts/affiliate.mjs disclosure-check
```

### dispute-review

Review dispute owners and due dates.

```bash
node scripts/affiliate.mjs dispute-review
```

### settlement-review

Prepare reviewed conversion amounts. This is never a payment instruction.

```bash
node scripts/affiliate.mjs settlement-review
```

### attention

Show overdue decisions, disputes, agreement reviews and retention reviews.

```bash
node scripts/affiliate.mjs attention
```

### history

Read the operator-labelled audit history.

```bash
node scripts/affiliate.mjs history
```

### show

Read the selected record and history before changing or drafting anything.

```bash
node scripts/affiliate.mjs show <partners|offers|conversions|disputes> <name-or-id>
```

### compliance

Review record checks and sources in docs/compliance.md. No legal certification.

```bash
node scripts/affiliate.mjs compliance
```

### insights

Answer the ten analysis questions from current records.

```bash
node scripts/affiliate.mjs insights
```

### weekly-review

Run validation-queue, partner-margins and attention, then compliance. Use weekly-review for the combined result. Write a review draft under drafts/.

```bash
node scripts/affiliate.mjs weekly-review
```

### draft-partner-review

Read show partners first, then draft the partner review. Never send it.

```bash
node scripts/affiliate.mjs draft-partner-review <partner>
```

### export

Write a private JSON archive. Keep native backups too. Never attach or upload it without permission.

```bash
node scripts/affiliate.mjs export
```

### add-partner

Record a confirmed partner with its owner and agreement.

```bash
node scripts/affiliate.mjs add-partner --name="Name" --owner="Owner" --agreement="private:reference" --review-on=YYYY-MM-DD --by="Operator" --reason="Reason" --evidence="private:reference"
```

### add-offer

Record a confirmed offer and its terms.

```bash
node scripts/affiliate.mjs add-offer --name="Name" --owner="Owner" --terms="private:reference" --by="Operator" --reason="Reason" --evidence="private:reference"
```

### set-partner

Read the partner, then update agreement, owner, status and review date.

```bash
node scripts/affiliate.mjs set-partner <partner> --owner="Owner" --agreement="private:reference" --review-on=YYYY-MM-DD --status=active --by="Operator" --reason="Reason" --evidence="private:reference"
```

### set-offer

Read the offer, then record the current terms and responsible owner.

```bash
node scripts/affiliate.mjs set-offer <offer> --owner="Owner" --terms="private:reference" --status=active --by="Operator" --reason="Reason" --evidence="private:reference"
```

### record-disclosure

Inspect an advertisement and record evidence of the disclosure. Select the actual market.

```bash
node scripts/affiliate.mjs record-disclosure <partner> --placement="private:placement" --market=NZ --outcome=clear --checked-on=YYYY-MM-DD --review-on=YYYY-MM-DD --by="Operator" --reason="Reason" --evidence="private:reference"
```

### review-conversion

Read the conversion and its evidence. Approval requires a source-approved record without an open dispute.

```bash
node scripts/affiliate.mjs review-conversion <event> --decision=approved --by="Operator" --reason="Reason" --evidence="private:reference"
```

### open-dispute

Record the reason and owner of a conversion dispute.

```bash
node scripts/affiliate.mjs open-dispute <event> --owner="Owner" --due-on=YYYY-MM-DD --by="Operator" --reason="Reason" --evidence="private:reference"
```

### close-dispute

Record the resolution evidence. Closure resets the conversion to pending for a fresh decision.

```bash
node scripts/affiliate.mjs close-dispute <dispute-id> --resolution="What was resolved" --by="Operator" --reason="Reason" --evidence="private:reference"
```

### retention-review

Review the lawful purpose first. Do not roll dates forward merely to clear a warning.

```bash
node scripts/affiliate.mjs retention-review <event> --retain-until=YYYY-MM-DD --by="Operator" --reason="Reason" --evidence="private:reference"
```

### import

Read docs/replace-tune.md. Confirm selected columns, currency, time zone, account and retention purpose. Always start with --dry-run.

```bash
node scripts/affiliate.mjs import tune <file.csv> --currency=NZD --timezone-offset=+00:00 --retain-until=YYYY-MM-DD --dry-run --by="Operator" --reason="Reason" --evidence="private:reference"
```

All writes support --dry-run, implemented as a transaction rollback. Do not pass a value to boolean flags. Approval and dispute changes record decision history. A new disclosure inspection supersedes earlier inspections of the same placement for attention purposes; all evidence remains in the register.

No command sends a message, makes a payment or changes the source platform. Export and drafts write private local files. Rerun reads after mutations to verify the result.
