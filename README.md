<div align="center">
  <h1>OVH Cost Manager</h1>
  <p>FinOps application for tracking OVHcloud costs, invoices, consumption, and inventory through the OVH API.</p>
</div>

![OVH FinOps dashboard preview](docs/assets/dashboard.png)

## Features

- Monthly and yearly cost dashboard.
- Cloud vs Bare Metal analysis.
- Breakdown by Public Cloud project, service, resource type, and invoice line.
- Project detail pages with instances, quotas, Object Storage buckets, and Cold Archive usage.
- Monthly trends with full-area charts.
- Current consumption, end-of-month forecast, and reconstructed history from invoices when needed.
- OVH inventory: dedicated servers, VPS, Public Cloud buckets, Cloud projects, and upcoming expirations.
- Billing: invoice list, invoice details, payment status, and account balance.
- FR/EN interface, light/dark theme, and month or full-year selection.
- CSV exports and CLI tools for invoice analysis.
- Local authentication, LDAP login, configurable OIDC/SAML settings, and API rate limiting.

## Architecture

```text
.
|-- dashboard/          # React + Vite frontend
|-- server/             # Express API and dashboard static file server
|-- data/               # OVH import, SQLite schema, data access layer
|-- cli/                # Historical CLI tools around invoices
|-- scripts/            # Docker entrypoint and periodic import
|-- tests/              # Backend/data Jest tests
|-- docker-compose.yml  # Deployment without external SSO
`-- docker-compose.sso.yml
```

The database is stored in `DATA_DIR/ovh-bills.db`. In Docker, the default volume is `ocm-data`, mounted at `/app/data`.

## Requirements

- Node.js 20 recommended.
- npm.
- Docker and Docker Compose for containerized deployment.
- OVH API credentials with the required read permissions.

## OVH Configuration

Copy the example configuration:

```bash
cp config.example.json config.json
```

Fill in the OVH credentials:

```json
{
  "credentials": {
    "appKey": "YOUR_APP_KEY",
    "appSecret": "YOUR_APP_SECRET",
    "consumerKey": "YOUR_CONSUMER_KEY",
    "endpoint": "ovh-eu"
  },
  "dataDir": "/app/data",
  "dashboard": {
    "currency": "EUR",
    "language": "fr"
  },
  "auth": {
    "enabled": true,
    "type": "local",
    "users": [
      {
        "username": "admin",
        "password": "admin",
        "name": "Administrator"
      }
    ],
    "session": {
      "secret": "CHANGE_THIS_TO_A_RANDOM_SECRET",
      "maxAge": 86400000,
      "name": "ocm.sid"
    }
  }
}
```

`DATA_DIR` can also be provided as an environment variable. It takes precedence over `dataDir`.
The dashboard budget is optional. Add `"budget": 50000` under `dashboard` only if you want to display budget tracking.
Local authentication is enabled by default with `admin/admin`. Change this password and `session.secret` before exposing the application on a network.

### Recommended API Permissions

For a complete inventory, the OVH consumer key should be allowed to read:

```text
/me
/me/*
/cloud
/cloud/*
/dedicated/server
/dedicated/server/*
/vps
/vps/*
/storage
/storage/*
/ip
/ip/*
/ipLoadbalancing
/ipLoadbalancing/*
```

The minimum permissions for costs and invoices are `/me/*` and `/cloud/*`. The other paths enrich the inventory.

## Local Development

Install dependencies:

```bash
npm install
```

Import data:

```bash
npm run import:full
```

Run the API and Vite frontend:

```bash
npm run dev
```

Defaults:

- API: `http://localhost:3001`
- Vite frontend: `http://localhost:5173`

To run only the API server, which also serves the built dashboard:

```bash
npm run build
PORT=3001 npm run dev:server
```

## Docker Deployment

Create `config.json`, then run:

```bash
docker compose up -d --build
```

Open:

```text
http://localhost:3001
```

The container starts the server and runs periodic imports through `scripts/cron-import.sh`.

Useful variables:

| Variable | Description | Default |
| --- | --- | --- |
| `OCM_PORT` | Host-exposed port | `3001` |
| `PORT` | Internal Express port | `3001` |
| `IMPORT_ENABLED` | Enables periodic imports | `true` |
| `IMPORT_INTERVAL` | Delay between imports, in seconds | `86400` |
| `IMPORT_FLAGS` | Flags passed to `data/import.js` | `--all` |
| `DATA_DIR` | Directory containing `ovh-bills.db` | `data/` or `/app/data` |
| `RATE_LIMIT_ENABLED` | Enables API rate limiting | `true` |
| `TRUST_PROXY` | Trust reverse proxy headers | `false` |

## Imports

Main commands:

```bash
# Full import
npm run import:full

# Differential import from the latest known invoice
npm run import:diff

# Period import
npm run import -- --from 2026-01-01 --to 2026-12-31

# Import enriched data
node data/import.js --diff --include-account
node data/import.js --diff --include-inventory
node data/import.js --diff --include-cloud-details
node data/import.js --diff --all
```

In Docker:

```bash
docker exec ovh-finops node data/import.js --diff --all
```

The enriched flags populate:

- `--include-account`: balance, credits, debts, and payment information.
- `--include-inventory`: dedicated servers, VPS, and NetApp storage.
- `--include-cloud-details`: instances, quotas, buckets, and current Public Cloud consumption.
- `--all`: enables all enriched data.

## Main Pages

| Page | Purpose |
| --- | --- |
| `/` | Executive overview: total cost, Cloud share, projects, services, and dominant resources |
| `/projects` | Public Cloud project list with selected-period cost |
| `/projects/:id` | Project detail: instances, quotas, buckets, and consumption |
| `/costs/services` | Service and resource type analysis |
| `/trends` | Historical evolution from 3 to 36 months |
| `/compare` | Two-month comparison |
| `/inventory` | OVH inventory and upcoming expirations |
| `/bare-metal` | Bare Metal, VPS, and storage operations view |
| `/bills` | Invoices, invoice details, payments, and account balance |
| `/profile` | Connected user profile |
| `/users` | Local user management |
| `/configuration` | LDAP and OIDC/SAML authentication settings |

The selector in the top-right corner lets you choose a month or a full year. Cost pages use this period for `from/to` API queries.

## Tests and Validation

Frontend:

```bash
npm run test --workspace=dashboard
```

Backend/data:

```bash
npx jest tests
```

Build:

```bash
npm run build
```

## Data and Troubleshooting

Inspect the Docker volume:

```bash
docker volume inspect ocm-data
```

Inspect the SQLite database:

```bash
sqlite3 /var/lib/docker/volumes/ocm-data/_data/ovh-bills.db \
  "select count(*) from bills; select count(*) from bill_details;"
```
