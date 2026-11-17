# /review-conversion

Read the conversion and its evidence. Approval requires a source-approved record without an open dispute.

```bash
node scripts/affiliate.mjs review-conversion <event> --decision=approved --by="Operator" --reason="Reason" --evidence="private:reference" --json
```

Replace placeholders with confirmed facts. Never invent an owner, evidence reference, date or amount. Ambiguous names print candidates and exit with failure; ask the operator to identify the record. Present amounts with their currency. Source status and local decision are different fields.

Read the record first. Explain the intended change, run --dry-run when useful, then apply the authorised change and read it back. Every mutation is logged with the operator, reason and evidence. Never process payments, send, delete or post to TUNE.
