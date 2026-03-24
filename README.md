# SeaTable Datasource Plugin for Budibase

A [Budibase](https://budibase.com/) custom datasource plugin for [SeaTable](https://seatable.com/).

> This plugin works with **self-hosted Budibase** instances only. Budibase Cloud does not support custom datasource plugins.

## Features

- **Create Row** — Insert a new row with JSON data
- **List Rows** — Read rows with optional view filter and record limit
- **Update Row** — Update a row by ID with JSON data
- **Delete Row** — Delete a row by ID

## Installation

### Option 1: Upload tar.gz

1. Download [`budibase-datasource-seatable-1.0.0.tar.gz`](https://github.com/seatable/budibase-connector/releases/latest) from the latest release
2. In Budibase, go to **Settings > Plugins** and upload the file

### Option 2: Plugins directory

Mount or copy the `.tar.gz` into your Budibase plugins directory and set the `PLUGINS_DIR` environment variable.

## Configuration

1. In SeaTable, go to your base and create an **API Token** (read-write)
2. In Budibase, add a new **SeaTable** datasource
3. Enter the **Server URL** (default: `https://cloud.seatable.io`) and **API Token**

The plugin automatically exchanges the API token for a short-lived base access token.

## Development

```bash
# Install dependencies
npm install

# Build the plugin (outputs dist/plugin.min.js + .tar.gz)
npm run build

# Watch mode
npm run watch

# Run unit tests
npm run test

# Run integration tests (requires a running SeaTable instance)
INTEGRATION=true SEATABLE_SERVER_URL=http://localhost SEATABLE_API_TOKEN=... npm run test:integration
```

### Integration tests

The integration tests require a running SeaTable instance. Set up a local instance following the [SeaTable Admin Manual](https://admin.seatable.com/), then create a base and an API token to run the tests.

## Links

- [SeaTable](https://seatable.com/)
- [SeaTable API Documentation](https://api.seatable.com/)
- [Budibase Custom Datasource Docs](https://docs.budibase.com/docs/custom-datasource)
