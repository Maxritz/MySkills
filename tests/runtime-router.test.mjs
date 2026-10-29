import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { routeTask, estimateTokensFromBytes, isLikelySourceMutation } from "../runtime/router-core.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const config = JSON.parse(readFileSync(join(root, "myskills.config.json"), "utf8"));

const cases = [
  {
    id: "stub-audit",
    prompt: "Run a goli-mat-de stub audit for fake code and placeholder implementations.",
    expected: ["goli-mat-de"],
  },
  {
    id: "injected-parser-defect",
    prompt: "Debug the Python parser crash and implement a guard plus regression test.",
    expected: ["debug-core", "python-engineering", "code-quality-gate"],
  },
  {
    id: "concurrency-bug",
    prompt: "Debug a C++ concurrency race and find the violated memory invariant.",
    expected: ["debug-core", "c-systems"],
  },
  {
    id: "vulkan-synchronisation",
    prompt: "Diagnose a Vulkan command-buffer semaphore synchronisation failure.",
    expected: ["debug-core", "vulkan-compute-stack"],
  },
  {
    id: "quantisation-mismatch",
    prompt: "Debug GGUF Q4_0 quantisation output that differs from the reference.",
    expected: ["debug-core", "gguf-ggml"],
  },
  {
    id: "performance-regression",
    prompt: "Profile a kernel performance regression and benchmark throughput.",
    expected: ["debug-core", "sherlock-it", "kernel-tuning"],
  },
  {
    id: "deployment-failure",
    prompt: "Diagnose a deployment failure; check service health and rollback.",
    expected: ["debug-core", "deployment-operations"],
  },
  {
    id: "negative-no-defect-established",
    prompt: "Run ponytail-diag on what should vs did happen. The test passes; no defect has been established. Identify the smallest observation needed before any root-cause claim.",
    expected: ["ponytail-diag", "debug-core"],
  },
];

test("representative task routing selects required specialists", () => {
  for (const entry of cases) {
    const route = routeTask(entry.prompt, config);
    for (const expected of entry.expected) {
      assert.ok(route.skills.includes(expected), `${entry.id}: missing ${expected}; selected ${route.skills.join(", ")}`);
    }
    assert.ok(route.skills.length <= config.routing.maxSkills, `${entry.id}: exceeded context budget`);
  }
});

test("unknown out-of-domain prompt does not load an arbitrary specialist", () => {
  const route = routeTask("Give me a concise definition of a rainbow.", config);
  assert.equal(route.unmatched, true);
  assert.deepEqual(route.skills, []);
});

test("router respects the skill cap and estimates token size conservatively", () => {
  const route = routeTask("Debug a Vulkan GGUF Python performance regression on Windows.", config, 2);
  assert.equal(route.skills.length, 2);
  assert.ok(estimateTokensFromBytes(1000) === 250);
  assert.ok(estimateTokensFromBytes(1) === 1);
});

test("common source mutations are detected but harmless shell commands are not", () => {
  assert.equal(isLikelySourceMutation("edit", { filePath: "src/main.cpp" }, config.routing.mutationTools), true);
  assert.equal(isLikelySourceMutation("bash", { command: "git commit -am 'fix'" }, config.routing.mutationTools), true);
  assert.equal(isLikelySourceMutation("bash", { command: "ctest --output-on-failure" }, config.routing.mutationTools), false);
});

test("diagnostic instructions permit an explicit unresolved/no-defect result", () => {
  const core = readFileSync(join(root, "ponytail-diag", "SKILL.md"), "utf8").toLowerCase();
  assert.match(core, /no defect established/);
  assert.match(core, /unresolved/);
  assert.match(core, /leading hypothesis/);
  assert.doesNotMatch(core, /emit exactly one line:\s*\n\n`root cause:/);
});

function walkMarkdown(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) found.push(...walkMarkdown(path));
    else if (name.endsWith(".md")) found.push(path);
  }
  return found;
}

test("all relative Markdown links, including optional references, resolve", () => {
  const docs = walkMarkdown(root).filter((path) => !path.includes("/.git/"));
  const failures = [];
  for (const path of docs) {
    const content = readFileSync(path, "utf8");
    for (const match of content.matchAll(/\]\(([^)]+\.md)(?:#[^)]+)?\)/g)) {
      const target = match[1];
      if (/^(https?:|mailto:)/i.test(target)) continue;
      if (!statSafe(join(path.slice(0, path.lastIndexOf("/")), target))) {
        failures.push(`${path.slice(root.length + 1)} -> ${target}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

function statSafe(path) {
  try { return statSync(path).isFile(); } catch { return false; }
}

test("each optional reference file is reachable from its skill core", () => {
  const skillDirs = readdirSync(root).filter((name) => {
    try { return statSync(join(root, name, "SKILL.md")).isFile(); } catch { return false; }
  });
  const failures = [];
  for (const skill of skillDirs) {
    const refsDir = join(root, skill, "references");
    try {
      const refs = readdirSync(refsDir).filter((name) => name.endsWith(".md"));
      const core = readFileSync(join(root, skill, "SKILL.md"), "utf8");
      for (const ref of refs) {
        if (!core.includes(`references/${ref}`)) failures.push(`${skill}/references/${ref}`);
      }
    } catch {
      // No references directory is a valid skill layout.
    }
  }
  assert.deepEqual(failures, []);
});
