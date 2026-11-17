# Verification

17 November 2026.

The implementation at `ea439fb9902a36563becd28bde898732b6253f70` passed 106 assertions locally and in [GitHub Actions run 44005135820](https://github.com/Enterprise-DNA-OS/affiliate-review-for-claude-code/actions/runs/44005135820). All three jobs passed: Node 22 on Windows, Node 22 on Linux, and Postgres 17 on Linux. Both embedded jobs also passed the isolated demo.

The suite exercises all 26 CLI operations, import replay, ambiguous names, atomic rollback after an earlier valid row, conflicting reviewed events, required currency and time zone, money precision, malformed CSV, disclosure supersession, dispute closure, review gates, private archive and draft generation, RLS flags and branded HTML rendering. Rendering tests include HTML escaping and integer-cent totals above JavaScript's safe integer range.

The demo produced three read-only dashboards and eleven documents across three document types. Three real command runs were captured for the TUNE comparison page. There are 30 task recipes in `.claude/commands/`, excluding its index README.

The comparison passed the source-price and brand gate. Its isolated Astro build passed. Browser checks at desktop and mobile sizes found no page overflow or script errors, all three demo tabs worked, and six booking links carried the TUNE campaign and replace-software offer. The page rendered `noindex,nofollow`. The dashboard and partner statement were visually inspected too.

No live customer export was used. The importer fixture is fictional and uses the vendor's documented headings. No tracking, payment, mailbox, production customer database or external message was exercised. The base is a trusted operator's review workspace; live connections require separate acceptance testing.
