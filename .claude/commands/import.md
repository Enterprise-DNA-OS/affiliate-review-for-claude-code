# /import

Read docs/replace-tune.md. Confirm selected columns, currency, time zone, account and retention purpose. Always start with --dry-run.

```bash
node scripts/affiliate.mjs import tune <file.csv> --currency=NZD --timezone-offset=+00:00 --retain-until=YYYY-MM-DD --dry-run --by="Operator" --reason="Reason" --evidence="private:reference" --json
```

Replace placeholders with confirmed facts. Never invent an owner, evidence reference, date or amount. Ambiguous names print candidates and exit with failure; ask the operator to identify the record. Present amounts with their currency. Source status and local decision are different fields.

Read the record first. Explain the intended change, run --dry-run when useful, then apply the authorised change and read it back. Every mutation is logged with the operator, reason and evidence. Never process payments, send, delete or post to TUNE.
