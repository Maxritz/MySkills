import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { routeTask, estimateTokensFromBytes, isLikelySourceMutation } from "../runtime/router-core.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "myskills.config.json"), "utf8"));
const evaluation = JSON.parse(readFileSync(join(root, "evals/cases.json"), "utf8"));
const cases = evaluation.cases;

function readCore(skill) {
  const source = readFileSync(join(root, skill, "SKILL.md"), "utf8");
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\s*\r?\n/, "");
}

test("fixed evaluation prompts route to every required specialist within the context cap", () => {
  const results = [];
  for (const entry of cases) {
    const route = routeTask(entry.task, config);
    for (const expected of entry.required_skills) {
      assert.ok(route.skills.includes(expected), `${entry.id}: missing ${expected}; selected ${route.skills.join(", ")}`);
    }
    assert.ok(route.skills.length <= config.routing.maxSkills, `${entry.id}: exceeded context budget`);
    assert.ok(Array.isArray(entry.required_tests) && entry.required_tests.length > 0, `${entry.id}: missing test rubric`);
    assert.ok(entry.expected_findings?.length > 0, `${entry.id}: missing expected findings`);
    assert.ok(entry.required_verdict, `${entry.id}: missing verdict rubric`);

    const bytes = route.skills.reduce((sum, skill) => sum + Buffer.byteLength(readCore(skill), "utf8"), 0);
    results.push({ id: entry.id, selected: route.skills, coreBytes: bytes, estimatedTokens: estimateTokensFromBytes(bytes) });
  }
  console.log("ROUTING_MATRIX " + JSON.stringify(results));
});

test("negative controls explicitly allow unresolved or no-defect verdicts", () => {
  for (const entry of cases.filter((c) => c.id.startsWith("negative-"))) {
    assert.match(entry.required_verdict, /NO DEFECT ESTABLISHED|UNRESOLVED/i, entry.id);
    const core = readCore("ponytail-diag").toLowerCase();
    assert.match(core, /no defect established/);
    assert.match(core, /unresolved/);
  }
});

test("unknown out-of-domain prompt does not load an arbitrary specialist", () => {
  const route = routeTask("Give me a concise definition of a rainbow.", config);
  assert.equal(route.unmatched, true);
  assert.deepEqual(route.skills, []);
});

test("router respects the skill cap and labels bytes-to-token conversion as an estimate", () => {
  const route = routeTask("Debug a Vulkan GGUF Python performance regression on Windows.", config, 2);
  assert.equal(route.skills.length, 2);
  assert.equal(estimateTokensFromBytes(1000), 250);
  assert.equal(estimateTokensFromBytes(1), 1);
  assert.equal(estimateTokensFromBytes(0), 0);
});

test("common source mutations are detected but harmless shell commands are not", () => {
  assert.equal(isLikelySourceMutation("edit", { filePath: "src/main.cpp" }, config.routing.mutationTools), true);
  assert.equal(isLikelySourceMutation("bash", { command: "git commit -am 'fix'" }, config.routing.mutationTools), true);
  assert.equal(isLikelySourceMutation("bash", { command: "ctest --output-on-failure" }, config.routing.mutationTools), false);
});

test("diagnostics do not require a fabricated root cause or line number", () => {
  const core = readCore("ponytail-diag").toLowerCase();
  assert.match(core, /confirmed/);
  assert.match(core, /supported/);
  assert.match(core, /unresolved/);
  assert.match(core, /no defect established/);
  assert.match(core, /blocked/);
  assert.match(core, /use root cause only for confirmed/);
  assert.doesNotMatch(core, /emit exactly one line:\s*\n\n`root cause:/);
});

function walkMarkdown(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === ".opencode") continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) found.push(...walkMarkdown(path));
    else if (name.endsWith(".md")) found.push(path);
  }
  return found;
}

function statSafe(path) {
  try { return statSync(path).isFile(); } catch { return false; }
}

test("all relative Markdown links, including optional references, resolve", () => {
  const docs = walkMarkdown(root);
  const failures = [];
  for (const path of docs) {
    const content = readFileSync(path, "utf8");
    for (const match of content.matchAll(/\]\(([^)]+\.md)(?:#[^)]+)?\)/g)) {
      const target = match[1];
      if (/^(https?:|mailto:)/i.test(target)) continue;
      if (!statSafe(join(dirname(path), target))) failures.push(`${path.slice(root.length + 1)} -> ${target}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("each optional reference is reachable from its owning skill core", () => {
  const failures = [];
  for (const skill of readdirSync(root)) {
    const corePath = join(root, skill, "SKILL.md");
    if (!statSafe(corePath)) continue;
    const refsPath = join(root, skill, "references");
    if (!statSafe(join(refsPath, "..", "SKILL.md"))) continue;
    let refs = [];
    try { refs = readdirSync(refsPath).filter((name) => name.endsWith(".md")); } catch { continue; }
    const core = readFileSync(corePath, "utf8");
    for (const ref of refs) {
      if (!core.includes(`references/${ref}`)) failures.push(`${skill}/references/${ref}`);
    }
  }
  assert.deepEqual(failures, []);
});
