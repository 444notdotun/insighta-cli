# insighta-cli

A command-line interface for the [Insighta Labs+](https://insighta-labs.netlify.app) Intelligence Query Platform. Authenticate with GitHub OAuth, query profiles, export data as CSV, and manage your session — all from your terminal.

## Install

```bash
npm install -g insighta-notdotun
```

## Authentication

```bash
insighta login       # Authenticate with GitHub OAuth
insighta whoami      # Show current logged in user
insighta logout      # Clear stored credentials
```

## Profiles

```bash
# List all profiles
insighta profiles list

# Filter by gender, age group, country
insighta profiles list --gender male --age-group senior --country NG

# Filter by age range
insighta profiles list --min-age 18 --max-age 35

# Paginate
insighta profiles list --page 2 --limit 20

# Get a profile by ID
insighta profiles get <id>

# Search with natural language
insighta profiles search "software developer in Canada"

# Export profiles to CSV
insighta profiles export --output results.csv
insighta profiles export --gender female --country US --output filtered.csv
```

## Options

| Flag | Description |
|------|-------------|
| `-g, --gender` | Filter by gender (`male` / `female`) |
| `-a, --age-group` | Filter by age group (`child` / `teenager` / `adult` / `senior`) |
| `-c, --country` | Filter by 2-letter country code |
| `--min-age` | Minimum age |
| `--max-age` | Maximum age |
| `-p, --page` | Page number (default: 1) |
| `-l, --limit` | Results per page (default: 10) |
| `-o, --output` | Output filename for export (default: profiles.csv) |

## How it works

Login uses GitHub OAuth 2.0 with PKCE. Your credentials are stored locally at `~/.insighta/credentials.json` and automatically refreshed when they expire.

## Built by

[444notdotun](https://github.com/444notdotun) — Insighta Labs+