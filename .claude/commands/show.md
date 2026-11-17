# /show

Read the selected record and history before changing or drafting anything.

```bash
node scripts/affiliate.mjs show <partners|offers|conversions|disputes> <name-or-id> --json
```

Replace placeholders with confirmed facts. Never invent an owner, evidence reference, date or amount. Ambiguous names print candidates and exit with failure; ask the operator to identify the record. Present amounts with their currency. Source status and local decision are different fields.

Read the current data each time. Empty results mean no matching records, not proof of legal compliance or a paid balance. Never send or process payments.
