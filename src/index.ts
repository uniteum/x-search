import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TwitterApi } from "twitter-api-v2";

const twitter = new TwitterApi(process.env.X_BEARER_TOKEN!);

const server = new McpServer({
  name: "x-search",
  version: "1.0.0",
});

server.registerTool(
  "search_recent",
  {
    description:
      "Search recent tweets on X (Twitter) from the last 7 days. Returns tweet text, author, metrics, and URL.",
    inputSchema: {
      query: z
        .string()
        .min(1)
        .max(512)
        .describe(
          "Twitter search query. Supports operators like from:, to:, is:reply, has:links, -is:retweet, etc.",
        ),
      max_results: z
        .number()
        .int()
        .min(10)
        .max(100)
        .default(10)
        .describe("Number of results to return (10-100, default 10)"),
    },
  },
  async ({ query, max_results }) => {
    const result = await twitter.v2.search(query, {
      max_results,
      "tweet.fields": "created_at,public_metrics,author_id",
      "user.fields": "username,name",
      expansions: "author_id",
    });

    const users = new Map(
      (result.includes?.users ?? []).map((u) => [u.id, u]),
    );

    const tweets = (result.data?.data ?? []).map((tweet) => {
      const author = users.get(tweet.author_id!);
      const username = author?.username ?? "unknown";
      const metrics = tweet.public_metrics;

      return [
        `@${username} — ${tweet.created_at}`,
        tweet.text,
        metrics
          ? `♥ ${metrics.like_count}  🔁 ${metrics.retweet_count}  💬 ${metrics.reply_count}`
          : "",
        `https://x.com/${username}/status/${tweet.id}`,
        "---",
      ].join("\n");
    });

    if (tweets.length === 0) {
      return {
        content: [{ type: "text" as const, text: "No tweets found." }],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `Found ${tweets.length} tweets:\n\n${tweets.join("\n")}`,
        },
      ],
    };
  },
);

server.registerTool(
  "search_user_tweets",
  {
    description:
      "Get recent tweets from a specific X (Twitter) user by username.",
    inputSchema: {
      username: z
        .string()
        .min(1)
        .max(15)
        .describe("Twitter username (without the @ symbol)"),
      max_results: z
        .number()
        .int()
        .min(5)
        .max(100)
        .default(10)
        .describe("Number of results to return (5-100, default 10)"),
    },
  },
  async ({ username, max_results }) => {
    const { data: user } = await twitter.v2.userByUsername(username);
    if (!user) {
      return {
        content: [
          { type: "text" as const, text: `User @${username} not found.` },
        ],
      };
    }

    const timeline = await twitter.v2.userTimeline(user.id, {
      max_results,
      "tweet.fields": "created_at,public_metrics",
    });

    const tweets = (timeline.data?.data ?? []).map((tweet) => {
      const metrics = tweet.public_metrics;
      return [
        tweet.created_at,
        tweet.text,
        metrics
          ? `♥ ${metrics.like_count}  🔁 ${metrics.retweet_count}  💬 ${metrics.reply_count}`
          : "",
        `https://x.com/${username}/status/${tweet.id}`,
        "---",
      ].join("\n");
    });

    if (tweets.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No recent tweets found for @${username}.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `Recent tweets from @${username}:\n\n${tweets.join("\n")}`,
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("x-search MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
