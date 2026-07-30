import { existsSync, readFileSync, writeFileSync } from "node:fs";

const defaultWorkerUrl = "https://samsat-bandung-timur-bot.samsat.workers.dev";
const command = process.argv[2];
const args = process.argv.slice(3);

loadDotEnv();

async function main() {
  switch (command) {
    case "health":
      await checkHealth();
      return;
    case "set-webhook":
      await setWebhook();
      return;
    case "webhook-info":
      await getWebhookInfo();
      return;
    case "export":
      await exportData();
      return;
    default:
      printHelp();
      process.exit(command ? 1 : 0);
  }
}

function loadDotEnv() {
  if (!existsSync(".env")) {
    return;
  }

  const lines = readFileSync(".env", "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function checkHealth() {
  const response = await fetch(`${getWorkerUrl()}/health`);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status} ${text}`);
  }

  console.log(text);
}

async function setWebhook() {
  const botToken = requireEnv("BOT_TOKEN");
  const webhookSecret = requireEnv("WEBHOOK_SECRET");
  const webhookUrl = `${getWorkerUrl()}/webhook`;
  const body = new URLSearchParams({
    url: webhookUrl,
    secret_token: webhookSecret
  });

  const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    body
  });
  const data = await response.json() as TelegramResponse;

  if (!response.ok || !data.ok) {
    throw new Error(`setWebhook failed: ${JSON.stringify(data)}`);
  }

  console.log(`Webhook set to: ${webhookUrl}`);
}

async function getWebhookInfo() {
  const botToken = requireEnv("BOT_TOKEN");
  const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
  const data = await response.json() as TelegramWebhookInfoResponse;

  if (!response.ok || !data.ok) {
    throw new Error(`getWebhookInfo failed: ${JSON.stringify(data)}`);
  }

  console.log(`Webhook URL          : ${data.result.url || "-"}`);
  console.log(`Pending updates      : ${data.result.pending_update_count}`);
  console.log(`Last error date      : ${data.result.last_error_date ?? "-"}`);
  console.log(`Last error message   : ${data.result.last_error_message ?? "-"}`);
}

async function exportData() {
  const dataset = args[0];
  const format = args[1] ?? "csv";

  if (!["research", "satisfaction"].includes(dataset ?? "")) {
    throw new Error("Export dataset must be 'research' or 'satisfaction'.");
  }

  if (!["csv", "txt", "html"].includes(format)) {
    throw new Error("Export format must be 'csv', 'txt', or 'html'.");
  }

  const outputPath = getOutputPath();
  const response = await fetch(`${getWorkerUrl()}/${dataset}.${format}`, {
    headers: {
      Authorization: `Bearer ${requireEnv("ADMIN_EXPORT_TOKEN")}`
    }
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Export failed: ${response.status} ${text}`);
  }

  if (outputPath) {
    writeFileSync(outputPath, text);
    console.log(`Saved to ${outputPath}`);
    return;
  }

  process.stdout.write(text);
}

function getOutputPath() {
  const outputIndex = args.findIndex((arg) => arg === "--output" || arg === "-o");
  if (outputIndex !== -1) {
    return args[outputIndex + 1];
  }

  const outputArg = args.find((arg) => arg.startsWith("--output="));
  return outputArg?.slice("--output=".length);
}

function getWorkerUrl() {
  return (process.env.WORKER_URL || defaultWorkerUrl).replace(/\/$/, "");
}

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is missing. Add it to .env or export it before running this command.`);
  }

  return value;
}

function printHelp() {
  console.log([
    "Usage:",
    "  npm run health",
    "  npm run webhook:set",
    "  npm run webhook:info",
    "  npm run export:research",
    "  npm run export:research:txt",
    "  npm run export:satisfaction",
    "  npm run export:satisfaction:txt",
    "",
    "Optional:",
    "  WORKER_URL=https://your-worker.workers.dev npm run webhook:set",
    "  npm run export:satisfaction:html -- --output satisfaction.html"
  ].join("\n"));
}

interface TelegramResponse {
  ok?: boolean;
  description?: string;
}

interface TelegramWebhookInfoResponse extends TelegramResponse {
  result: {
    url?: string;
    pending_update_count?: number;
    last_error_date?: number;
    last_error_message?: string;
  };
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
