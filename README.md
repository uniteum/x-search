# x-search

MCP server for searching tweets on X (Twitter).

## Tools

### search_recent

Search recent tweets from the last 7 days.

- **query** — Twitter search query string. Supports operators like `from:`, `to:`, `is:reply`, `has:links`, `-is:retweet`, etc.
- **max_results** — Number of results (10–100, default 10).

Returns tweet text, author, engagement metrics, and URL for each result.

### search_user_tweets

Get recent tweets from a specific user.

- **username** — Twitter username (without @).
- **max_results** — Number of results (5–100, default 10).

## Setup

```bash
npm install
```

Set the `X_BEARER_TOKEN` environment variable to your Twitter API v2 bearer token.

To get a bearer token:

1. Go to the [Twitter Developer Portal](https://developer.x.com/en/portal/dashboard).
2. Create a project and app (or use an existing one).
3. Under your app's **Keys and tokens** tab, find **Bearer Token** and click **Generate**.
4. The search endpoints require at least **Basic** API access tier.

## Usage

```bash
npm start
```

The server runs on stdio using the [Model Context Protocol](https://modelcontextprotocol.io).

### MCP configuration

Add to your `.mcp.json`:

```json
"x-search": {
  "command": "npx",
  "args": ["tsx", "src/index.ts"],
  "cwd": "/path/to/x-search",
  "env": {
    "X_BEARER_TOKEN": "${X_BEARER_TOKEN}"
  }
}
```
