import { analyzePatternInput, matchMultipleFaq } from "../src/pattern-matcher";

declare const process: {
  argv: string[];
  exit(code?: number): never;
};

const input = process.argv.slice(2).join(" ").trim();

if (!input) {
  console.error('Usage: npm run relevance -- "Kalau STNK hilang bagaimana?"');
  process.exit(1);
}

const results = matchMultipleFaq(input);
const analysis = analyzePatternInput(input);

function formatList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "-";
}

console.log("=== Input Analysis ===");
console.log(`Input                 : ${analysis.input}`);
console.log(`Normalized            : ${analysis.normalizedInput}`);
console.log(`Tokens before stopword: ${formatList(analysis.tokensBeforeStopWords)}`);
console.log(`Removed stop words    : ${formatList(analysis.removedStopWords)}`);
console.log(`Base tokens           : ${formatList(analysis.baseTokens)}`);
console.log(`Expanded tokens       : ${formatList(analysis.expandedTokens)}`);
console.log(`Segments              : ${formatList(analysis.segments)}`);
console.log("");
console.log("=== Context Check ===");
console.log(`Has domain context    : ${analysis.hasDomainContext ? "YES" : "NO"}`);
console.log(`Has conflicting topic : ${analysis.hasConflictingContext ? "YES" : "NO"}`);
console.log(`Has out-of-scope topic: ${analysis.hasOutOfScopeContext ? "YES" : "NO"}`);
console.log(`Minimum relevance     : ${analysis.minimumRelevance}`);
console.log(`Multi-intent threshold: ${analysis.minimumMultiIntentRelevance}`);

if (results.length === 0) {
  console.log("");
  console.log("=== Match Result ===");
  console.log("Result     : FALLBACK");
  console.log("Reason     : Tidak ada FAQ yang melewati batas relevansi atau input di luar konteks Samsat.");
  process.exit(0);
}

console.log("");
console.log("=== Match Result ===");
for (const [index, result] of results.entries()) {
  console.log("");
  console.log(`Match #${index + 1}`);
  console.log(`FAQ ID     : ${result.entry.id}`);
  console.log(`Category   : ${result.entry.category}`);
  console.log(`Question   : ${result.entry.question}`);
  console.log(`Relevance  : ${result.relevance}/100`);
  console.log(`Terms      : ${result.matchedTerms.length > 0 ? result.matchedTerms.join(", ") : "-"}`);
}
