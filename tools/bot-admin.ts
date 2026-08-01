import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

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
    case "summary":
      await generateSummary();
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

  if (!["research", "satisfaction", "responses"].includes(dataset ?? "")) {
    throw new Error("Export dataset must be 'research', 'satisfaction', or 'responses'.");
  }

  if (!["csv", "txt", "html"].includes(format)) {
    throw new Error("Export format must be 'csv', 'txt', or 'html'.");
  }

  const outputPath = getOutputPath();
  const text = await fetchAdminExport(dataset, format);

  if (outputPath) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, text);
    console.log(`Saved to ${outputPath}`);
    return;
  }

  process.stdout.write(text);
}

async function fetchAdminExport(dataset: string, format: string) {
  const response = await fetch(`${getWorkerUrl()}/${dataset}.${format}`, {
    headers: {
      Authorization: `Bearer ${requireEnv("ADMIN_EXPORT_TOKEN")}`
    }
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Export failed: ${response.status} ${text}`);
  }

  return text;
}

function getOutputPath() {
  const outputIndex = findLastArgIndex("--output", "-o");
  if (outputIndex !== -1) {
    return args[outputIndex + 1];
  }

  const outputArg = findLastArgWithPrefix("--output=");
  return outputArg?.slice("--output=".length);
}

function getInputPath() {
  const inputIndex = findLastArgIndex("--input", "-i");
  if (inputIndex !== -1) {
    return args[inputIndex + 1];
  }

  const inputArg = findLastArgWithPrefix("--input=");
  return inputArg?.slice("--input=".length);
}

function findLastArgIndex(...names: string[]) {
  for (let index = args.length - 1; index >= 0; index -= 1) {
    if (names.includes(args[index])) {
      return index;
    }
  }

  return -1;
}

function findLastArgWithPrefix(prefix: string) {
  for (let index = args.length - 1; index >= 0; index -= 1) {
    if (args[index].startsWith(prefix)) {
      return args[index];
    }
  }

  return undefined;
}

function hasFlag(...names: string[]) {
  return args.some((arg) => names.includes(arg));
}

async function generateSummary() {
  const format = args[0] ?? "txt";
  if (!["txt", "html"].includes(format)) {
    throw new Error("Summary format must be 'txt' or 'html'.");
  }

  const inputPath = getInputPath() ?? "research/responses.csv";
  if (!hasFlag("--offline")) {
    const latestResponses = await fetchAdminExport("responses", "csv");
    mkdirSync(dirname(inputPath), { recursive: true });
    writeFileSync(inputPath, latestResponses);
    console.log(`Updated latest responses: ${inputPath}`);
  }

  if (!existsSync(inputPath)) {
    throw new Error(`${inputPath} not found. Run npm run export:responses first, or run without --offline to fetch the latest data.`);
  }

  const outputPath = getOutputPath() ?? (format === "html" ? "research/summary.html" : "research/summary.txt");
  const records = parseResponseCsv(readFileSync(inputPath, "utf8"));
  const summary = buildResponseSummary(records);
  const output = format === "html" ? buildSummaryHtml(summary) : buildSummaryText(summary);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output);
  console.log(`Saved to ${outputPath}`);
  printSummaryPreview(summary);
}

function parseResponseCsv(csv: string): ResponseRecord[] {
  const rows = parseCsvRows(csv).filter((row) => row.some((cell) => cell.trim()));
  const [header, ...body] = rows;
  if (!header) {
    return [];
  }

  const columnIndex = new Map(header.map((column, index) => [column, index]));

  return body.map((row) => ({
    telegramId: getCsvValue(row, columnIndex, "telegram_id"),
    username: getCsvValue(row, columnIndex, "username"),
    firstName: getCsvValue(row, columnIndex, "first_name"),
    lastName: getCsvValue(row, columnIndex, "last_name"),
    languageCode: getCsvValue(row, columnIndex, "language_code"),
    faqId: getCsvValue(row, columnIndex, "faq_id"),
    category: getCsvValue(row, columnIndex, "category") || "-",
    question: getCsvValue(row, columnIndex, "question") || "-",
    answer: getCsvValue(row, columnIndex, "answer"),
    choice: normalizeChoice(getCsvValue(row, columnIndex, "choice")),
    votedAt: getCsvValue(row, columnIndex, "voted_at")
  }));
}

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function getCsvValue(row: string[], columnIndex: Map<string, number>, column: string) {
  const index = columnIndex.get(column);
  return index === undefined ? "" : row[index]?.trim() ?? "";
}

function normalizeChoice(choice: string): SatisfactionChoiceLabel {
  const value = choice.toLowerCase().trim();
  if (value === "satisfied" || value === "memuaskan") {
    return "satisfied";
  }
  if (value === "dissatisfied" || value === "tidak memuaskan") {
    return "dissatisfied";
  }
  return "unknown";
}

function buildResponseSummary(records: ResponseRecord[]): ResponseSummary {
  const respondents = new Set(records.map((record) => record.telegramId).filter(Boolean));
  const faqIds = new Set(records.map((record) => record.faqId).filter(Boolean));
  const categories = groupRecords(records, (record) => record.category || "-");
  const faqs = groupRecords(records, (record) => `${record.faqId}||${record.category}||${record.question}`);
  const respondentRecords = groupRecords(records, (record) => record.telegramId || "-");
  const satisfied = records.filter((record) => record.choice === "satisfied").length;
  const dissatisfied = records.filter((record) => record.choice === "dissatisfied").length;
  const votedTimes = records
    .map((record) => record.votedAt)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return {
    totalRespondents: respondents.size,
    totalVotes: records.length,
    totalFaqs: faqIds.size,
    satisfied,
    dissatisfied,
    unknown: records.length - satisfied - dissatisfied,
    startedAt: votedTimes[0] ?? "-",
    endedAt: votedTimes.at(-1) ?? "-",
    categories: [...categories.entries()]
      .map(([category, groupedRecords]) => buildGroupSummary(category, groupedRecords))
      .sort(sortSummaryRows),
    respondents: [...respondentRecords.entries()]
      .map(([telegramId, groupedRecords]) => buildRespondentSummary(telegramId, groupedRecords))
      .sort(sortRespondentRows),
    topSatisfiedFaqs: buildFaqSummaries(faqs, "satisfied").slice(0, 5),
    topDissatisfiedFaqs: buildFaqSummaries(faqs, "dissatisfied").slice(0, 5)
  };
}

function printSummaryPreview(summary: ResponseSummary) {
  console.log("");
  console.log("Ringkasan singkat:");
  console.log(`Total responden : ${summary.totalRespondents}`);
  console.log(`Total penilaian : ${summary.totalVotes}`);
  console.log(`FAQ dinilai     : ${summary.totalFaqs}`);
  console.log(`Memuaskan       : ${summary.satisfied} (${percentage(summary.satisfied, summary.totalVotes)}%)`);
  console.log(`Tidak memuaskan : ${summary.dissatisfied} (${percentage(summary.dissatisfied, summary.totalVotes)}%)`);
}

function groupRecords(records: ResponseRecord[], getKey: (record: ResponseRecord) => string) {
  const grouped = new Map<string, ResponseRecord[]>();
  for (const record of records) {
    const key = getKey(record);
    grouped.set(key, [...(grouped.get(key) ?? []), record]);
  }

  return grouped;
}

function buildGroupSummary(label: string, records: ResponseRecord[]): SummaryRow {
  const satisfied = records.filter((record) => record.choice === "satisfied").length;
  const dissatisfied = records.filter((record) => record.choice === "dissatisfied").length;

  return {
    label,
    total: records.length,
    satisfied,
    dissatisfied,
    satisfiedPercent: percentage(satisfied, records.length),
    dissatisfiedPercent: percentage(dissatisfied, records.length)
  };
}

function buildRespondentSummary(telegramId: string, records: ResponseRecord[]): RespondentSummaryRow {
  const firstRecord = records[0];
  const satisfied = records.filter((record) => record.choice === "satisfied").length;
  const dissatisfied = records.filter((record) => record.choice === "dissatisfied").length;
  const faqIds = new Set(records.map((record) => record.faqId).filter(Boolean));
  const votedTimes = records
    .map((record) => record.votedAt)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return {
    telegramId,
    username: formatUsername(firstRecord?.username ?? ""),
    name: formatFullName(firstRecord),
    total: records.length,
    satisfied,
    dissatisfied,
    satisfiedPercent: percentage(satisfied, records.length),
    faqCount: faqIds.size,
    lastVotedAt: votedTimes.at(-1) ?? "-"
  };
}

function formatUsername(username: string) {
  if (!username) {
    return "-";
  }

  return username.startsWith("@") ? username : `@${username}`;
}

function formatFullName(record?: ResponseRecord) {
  const name = [record?.firstName, record?.lastName].filter(Boolean).join(" ").trim();
  return name || "-";
}

function buildFaqSummaries(groupedFaqs: Map<string, ResponseRecord[]>, choice: SatisfactionChoiceLabel) {
  return [...groupedFaqs.entries()]
    .map(([key, records]) => {
      const [faqId, category, question] = key.split("||");
      const summary = buildGroupSummary(question || "-", records);

      return {
        faqId,
        category,
        question,
        total: summary.total,
        satisfied: summary.satisfied,
        dissatisfied: summary.dissatisfied,
        satisfiedPercent: summary.satisfiedPercent,
        dissatisfiedPercent: summary.dissatisfiedPercent
      };
    })
    .filter((summary) => (choice === "satisfied" ? summary.satisfied : summary.dissatisfied) > 0)
    .sort((a, b) => {
      const mainDiff = choice === "satisfied"
        ? b.satisfied - a.satisfied
        : b.dissatisfied - a.dissatisfied;
      return mainDiff || b.total - a.total || a.question.localeCompare(b.question);
    });
}

function sortSummaryRows(a: SummaryRow, b: SummaryRow) {
  return b.total - a.total || a.label.localeCompare(b.label);
}

function sortRespondentRows(a: RespondentSummaryRow, b: RespondentSummaryRow) {
  return b.total - a.total || a.name.localeCompare(b.name) || a.telegramId.localeCompare(b.telegramId);
}

function percentage(value: number, total: number) {
  return total <= 0 ? 0 : Math.round((value / total) * 100);
}

function buildSummaryText(summary: ResponseSummary) {
  return [
    "Ringkasan Data Riset Chatbot SAMSAT Bandung Timur",
    "",
    `Total responden          : ${summary.totalRespondents}`,
    `Total penilaian          : ${summary.totalVotes}`,
    `Total FAQ dinilai        : ${summary.totalFaqs}`,
    `Memuaskan                : ${summary.satisfied} (${percentage(summary.satisfied, summary.totalVotes)}%)`,
    `Tidak memuaskan          : ${summary.dissatisfied} (${percentage(summary.dissatisfied, summary.totalVotes)}%)`,
    `Tidak diketahui          : ${summary.unknown}`,
    `Rentang waktu vote       : ${formatSummaryTime(summary.startedAt)} - ${formatSummaryTime(summary.endedAt)}`,
    "",
    "Rekap Per Kategori",
    buildSummaryTable(["Kategori", "Total", "Memuaskan", "Tidak Memuaskan", "Memuaskan (%)"], summary.categories.map((row) => [
      row.label,
      String(row.total),
      String(row.satisfied),
      String(row.dissatisfied),
      `${row.satisfiedPercent}%`
    ])),
    "",
    "Rekap Per Responden",
    buildSummaryTable(["Telegram ID", "Username", "Nama", "Total", "Memuaskan", "Tidak Memuaskan", "Memuaskan (%)", "FAQ Dinilai", "Terakhir Vote"], summary.respondents.map((row) => [
      row.telegramId,
      row.username,
      row.name,
      String(row.total),
      String(row.satisfied),
      String(row.dissatisfied),
      `${row.satisfiedPercent}%`,
      String(row.faqCount),
      formatSummaryTime(row.lastVotedAt)
    ])),
    "",
    "FAQ Dengan Memuaskan Terbanyak",
    buildSummaryTable(["FAQ ID", "Kategori", "Pertanyaan", "Memuaskan", "Total"], summary.topSatisfiedFaqs.map((row) => [
      row.faqId,
      row.category,
      row.question,
      String(row.satisfied),
      String(row.total)
    ])),
    "",
    "FAQ Dengan Tidak Memuaskan Terbanyak",
    buildSummaryTable(["FAQ ID", "Kategori", "Pertanyaan", "Tidak Memuaskan", "Total"], summary.topDissatisfiedFaqs.map((row) => [
      row.faqId,
      row.category,
      row.question,
      String(row.dissatisfied),
      String(row.total)
    ])),
    ""
  ].join("\n");
}

function buildSummaryTable(header: string[], rows: string[][]) {
  const table = [header, ...(rows.length > 0 ? rows : [header.map((_, index) => index === 0 ? "-" : "0")])];
  const widths = header.map((_, columnIndex) =>
    Math.max(...table.map((row) => row[columnIndex]?.length ?? 0))
  );

  return table
    .map((row, rowIndex) => {
      const line = row.map((cell, columnIndex) => cell.padEnd(widths[columnIndex])).join("  ");
      const divider = widths.map((width) => "-".repeat(width)).join("  ");

      return rowIndex === 0 ? `${line}\n${divider}` : line;
    })
    .join("\n");
}

function buildSummaryHtml(summary: ResponseSummary) {
  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ringkasan Data Riset Chatbot SAMSAT Bandung Timur</title>
  <style>
    body { margin: 0; padding: 32px; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f8fb; color: #172026; }
    main { max-width: 1180px; margin: 0 auto; }
    h1 { margin: 0 0 6px; font-size: 28px; }
    h2 { margin-top: 28px; font-size: 19px; }
    p { margin: 0 0 20px; color: #5b6673; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 20px 0 24px; }
    .metric { background: #fff; border: 1px solid #d9e1ea; padding: 14px; }
    .metric strong { display: block; font-size: 24px; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d9e1ea; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e6ecf2; text-align: left; vertical-align: top; font-size: 14px; }
    th { background: #eaf1f8; }
    .table-wrap { overflow-x: auto; }
  </style>
</head>
<body>
  <main>
    <h1>Ringkasan Data Riset Chatbot SAMSAT Bandung Timur</h1>
    <p>Rentang waktu vote: ${escapeHtml(formatSummaryTime(summary.startedAt))} - ${escapeHtml(formatSummaryTime(summary.endedAt))}</p>
    <section class="metrics">
      ${buildMetric("Responden", summary.totalRespondents)}
      ${buildMetric("Penilaian", summary.totalVotes)}
      ${buildMetric("FAQ Dinilai", summary.totalFaqs)}
      ${buildMetric("Memuaskan", `${summary.satisfied} (${percentage(summary.satisfied, summary.totalVotes)}%)`)}
      ${buildMetric("Tidak Memuaskan", `${summary.dissatisfied} (${percentage(summary.dissatisfied, summary.totalVotes)}%)`)}
    </section>
    <h2>Rekap Per Kategori</h2>
    ${buildHtmlTable(["Kategori", "Total", "Memuaskan", "Tidak Memuaskan", "Memuaskan (%)"], summary.categories.map((row) => [
      row.label,
      String(row.total),
      String(row.satisfied),
      String(row.dissatisfied),
      `${row.satisfiedPercent}%`
    ]))}
    <h2>Rekap Per Responden</h2>
    ${buildHtmlTable(["Telegram ID", "Username", "Nama", "Total", "Memuaskan", "Tidak Memuaskan", "Memuaskan (%)", "FAQ Dinilai", "Terakhir Vote"], summary.respondents.map((row) => [
      row.telegramId,
      row.username,
      row.name,
      String(row.total),
      String(row.satisfied),
      String(row.dissatisfied),
      `${row.satisfiedPercent}%`,
      String(row.faqCount),
      formatSummaryTime(row.lastVotedAt)
    ]))}
    <h2>FAQ Dengan Memuaskan Terbanyak</h2>
    ${buildHtmlTable(["FAQ ID", "Kategori", "Pertanyaan", "Memuaskan", "Total"], summary.topSatisfiedFaqs.map((row) => [
      row.faqId,
      row.category,
      row.question,
      String(row.satisfied),
      String(row.total)
    ]))}
    <h2>FAQ Dengan Tidak Memuaskan Terbanyak</h2>
    ${buildHtmlTable(["FAQ ID", "Kategori", "Pertanyaan", "Tidak Memuaskan", "Total"], summary.topDissatisfiedFaqs.map((row) => [
      row.faqId,
      row.category,
      row.question,
      String(row.dissatisfied),
      String(row.total)
    ]))}
  </main>
</body>
</html>`;
}

function buildMetric(label: string, value: string | number) {
  return `<div class="metric"><strong>${escapeHtml(String(value))}</strong>${escapeHtml(label)}</div>`;
}

function buildHtmlTable(header: string[], rows: string[][]) {
  const bodyRows = rows.length > 0 ? rows : [header.map((_, index) => index === 0 ? "-" : "0")];

  return `<div class="table-wrap"><table><thead><tr>${header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead><tbody>${bodyRows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function formatSummaryTime(value: string) {
  if (!value || value === "-") {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta"
  }).format(date);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
    "  npm run export:responses",
    "  npm run export:responses:txt",
    "  npm run export:summary",
    "  npm run export:summary:txt",
    "  npm run export:summary:html",
    "  npm run export:satisfaction",
    "  npm run export:satisfaction:txt",
    "",
    "Optional:",
    "  WORKER_URL=https://your-worker.workers.dev npm run webhook:set",
    "  npm run export:responses -- --output research/responses.csv",
    "  npm run export:summary -- --input research/responses.csv --output research/summary.txt",
    "  npm run export:summary -- --offline",
    "  npm run export:satisfaction:html -- --output satisfaction.html"
  ].join("\n"));
}

type SatisfactionChoiceLabel = "satisfied" | "dissatisfied" | "unknown";

interface ResponseRecord {
  telegramId: string;
  username: string;
  firstName: string;
  lastName: string;
  languageCode: string;
  faqId: string;
  category: string;
  question: string;
  answer: string;
  choice: SatisfactionChoiceLabel;
  votedAt: string;
}

interface SummaryRow {
  label: string;
  total: number;
  satisfied: number;
  dissatisfied: number;
  satisfiedPercent: number;
  dissatisfiedPercent: number;
}

interface FaqSummaryRow {
  faqId: string;
  category: string;
  question: string;
  total: number;
  satisfied: number;
  dissatisfied: number;
  satisfiedPercent: number;
  dissatisfiedPercent: number;
}

interface RespondentSummaryRow {
  telegramId: string;
  username: string;
  name: string;
  total: number;
  satisfied: number;
  dissatisfied: number;
  satisfiedPercent: number;
  faqCount: number;
  lastVotedAt: string;
}

interface ResponseSummary {
  totalRespondents: number;
  totalVotes: number;
  totalFaqs: number;
  satisfied: number;
  dissatisfied: number;
  unknown: number;
  startedAt: string;
  endedAt: string;
  categories: SummaryRow[];
  respondents: RespondentSummaryRow[];
  topSatisfiedFaqs: FaqSummaryRow[];
  topDissatisfiedFaqs: FaqSummaryRow[];
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
