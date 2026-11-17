# /settlement-review

Prepare reviewed conversion amounts. This is never a payment instruction.

```bash
node scripts/affiliate.mjs settlement-review --json
```

Replace placeholders with confirmed facts. Never invent an owner, evidence reference, date or amount. Ambiguous names print candidates and exit with failure; ask the operator to identify the record. Present amounts with their currency. Source status and local decision are different fields.

Read the current data each time. Empty results mean no matching records, not proof of legal compliance or a paid balance. Never send or process payments.
