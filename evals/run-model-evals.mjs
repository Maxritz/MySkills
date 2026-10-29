import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEvalPrompt } from "./prompt.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const model = process.env.OPENCODE_EVAL_MODEL;
if (!model) throw new Error("Set OPENCODE_EVAL_MODEL=provider/model first.");
const cases = JSON.parse(readFileSync(join(root, "evals/cases.json"), "utf8")).cases;
const outputDir = resolve(process.env.MYSKILLS_EVAL_OUT || join(root, "evals/results"));
mkdirSync(outputDir, { recursive: true });
const report = { model, startedAt: new Date().toISOString(), results: [] };

for (const c of cases) {
  const prompt = buildEvalPrompt(c);
  const run = spawnSync(process.env.OPENCODE_BIN || "opencode",
    ["run", "--format", "json", "--model", model, "--dir", root, prompt],
    { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const out = String(run.stdout || "");
  const events = out.split(/\r?\n/).filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)]; } catch { return [{ unparsed: line }]; }
  });
  const usage = [];
  function visit(v) {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(visit);
    if (v.tokens && typeof v.tokens === "object" &&
        (Number.isFinite(v.tokens.input) || Number.isFinite(v.tokens.output))) {
      usage.push(v.tokens);
    }
    Object.values(v).forEach(visit);
  }
  visit(events);
  report.results.push({
    id: c.id,
    requiredSkills: c.required_skills,
    expectedFindings: c.expected_findings,
    requiredTests: c.required_tests,
    requiredVerdict: c.required_verdict,
    exitCode: run.status,
    stderr: String(run.stderr || "").slice(0, 5000),
    rawEvents: events,
    tokenUsage: usage.length ? usage : null,
    grading: "Review raw events for selected skills, expected findings, unsupported claims, executed tests and verdict calibration. Missing tokenUsage means OpenCode did not expose usage in these JSON events."
  });
  const file = join(outputDir, "latest.json");
  writeFileSync(file, JSON.stringify(report, null, 2) + "\n");
  console.log(`${c.id}: exit=${run.status}; token records=${usage.length}`);
  if (run.status !== 0) process.exitCode = 1;
}
report.finishedAt = new Date().toISOString();
writeFileSync(join(outputDir, "latest.json"), JSON.stringify(report, null, 2) + "\n");
