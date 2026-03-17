# SeaTable Connector for Budibase

A native [Budibase](https://budibase.com/) datasource integration for [SeaTable](https://seatable.com/) — the open-source database platform that's easy like a spreadsheet and powerful like a database.

## Features

- **Create** — Insert a new row (customisable fields)
- **Read** — List rows with optional view filter and record limit
- **Update** — Update a row by ID (customisable fields)
- **Delete** — Delete a row by ID
- **testConnection** — Validates credentials via token exchange + metadata fetch

## Authentication

The connector uses SeaTable's **API Token** authentication:

1. In SeaTable, go to your base → **API Token** → create a new token
2. In Budibase, create a new SeaTable datasource
3. Enter your **Server URL** (e.g., `https://cloud.seatable.io`) and **API Token**
4. The connector automatically exchanges the API token for a base access token

## Installation

### For Budibase PR

Copy `seatable.ts` into the Budibase source:

```bash
cp seatable.ts /path/to/budibase/packages/server/src/integrations/
```

Then register the integration in:

- `packages/server/src/integrations/index.ts` — add import and register in `DEFINITIONS` and `INTEGRATIONS`
- `packages/types/src/sdk/datasources.ts` — add `SEATABLE` to `SourceName` enum

## Links

- [SeaTable](https://seatable.com/)
- [SeaTable API Documentation](https://developer.seatable.com/)
- [Budibase PR #18323](https://github.com/Budibase/budibase/pull/18323)
