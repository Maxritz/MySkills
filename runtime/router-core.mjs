const DEFAULT_MAX_SKILLS = 4;

function normalise(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function containsTerm(text, term) {
  const haystack = ` ${normalise(text)} `;
  const needle = ` ${normalise(term)} `;
  return needle.length > 2 && haystack.includes(needle);
}

function taskHasAny(task, terms = []) {
  return terms.some((term) => containsTerm(task, term));
}

/**
 * Deterministic keyword router. Returns recommendations, not a diagnosis.
 * Skill selection is capped to avoid loading the whole catalogue into context.
 */
export function routeTask(task, config, requestedMax = DEFAULT_MAX_SKILLS) {
  const maxSkills = Math.max(1, Math.min(6, Number.isFinite(requestedMax) ? Math.floor(requestedMax) : DEFAULT_MAX_SKILLS));
  const router = config?.routing ?? {};
  const triggers = router.triggers ?? {};
  const ranked = [];

  for (const [skill, keywords] of Object.entries(triggers)) {
    const matched = (Array.isArray(keywords) ? keywords : [])
      .filter((keyword) => containsTerm(task, keyword))
      .sort((a, b) => b.length - a.length);
    if (matched.length) {
      const score = matched.reduce((sum, keyword) => sum + 1 + Math.min(keyword.length / 40, 1), 0);
      ranked.push({ skill, score, matched });
    }
  }

  const debugging = taskHasAny(task, router.debuggingKeywords);
  const implementation = taskHasAny(task, router.implementationKeywords) ||
    /\b(?:implement|refactor|patch|edit|write|change|update|add|create)\b/i.test(String(task ?? ""));

  if (debugging && !ranked.some((item) => item.skill === "debug-core")) {
    ranked.push({ skill: "debug-core", score: 4, matched: ["debugging task"] });
  }
  if (implementation && !ranked.some((item) => item.skill === "code-quality-gate")) {
    ranked.push({ skill: "code-quality-gate", score: 5, matched: ["implementation task"] });
  }

  ranked.sort((a, b) => b.score - a.score || a.skill.localeCompare(b.skill));

  const mandatory = [];
  if (implementation && ranked.some((item) => item.skill === "code-quality-gate")) mandatory.push("code-quality-gate");
  if (debugging && ranked.some((item) => item.skill === "debug-core") && mandatory.length < maxSkills) mandatory.push("debug-core");

  const ordered = [...mandatory, ...ranked.map((item) => item.skill).filter((skill) => !mandatory.includes(skill))];
  const skills = [...new Set(ordered)].slice(0, maxSkills);
  const bySkill = new Map(ranked.map((item) => [item.skill, item]));
  return {
    task: String(task ?? ""),
    skills,
    matches: skills.map((skill) => ({
      skill,
      score: bySkill.get(skill)?.score ?? 0,
      keywords: bySkill.get(skill)?.matched ?? [],
    })),
    unmatched: skills.length === 0,
    maxSkills,
    metrics: {
      candidateCount: ranked.length,
      selectedCount: skills.length,
    },
  };
}

export function estimateTokensFromBytes(bytes) {
  return Math.ceil(Math.max(0, Number(bytes) || 0) / 4);
}

export function isLikelySourceMutation(toolName, args = {}, mutationTools = []) {
  const name = String(toolName ?? "").toLowerCase();
  if (mutationTools.includes(name)) return true;

  const command = String(args.command ?? args.cmd ?? args.script ?? args.code ?? "");
  const shellTools = new Set(["bash", "shell", "powershell", "pwsh", "cmd", "terminal", "run_command"]);
  if (!shellTools.has(name)) return false;

  const posixMutation =
    /(?:\bsed\s+-i\b|\bperl\s+-i\b|\btee\s+(?:--append\s+)?\S|\bgit\s+(?:apply|commit|cherry-pick|rebase|merge|reset|restore|checkout|clean|stash|push)\b|\bapply_patch\b|\b(?:rm|mv|cp|install|truncate|dd)\b|\bcat\s+[^\n]*>\s*\S|\b(?:printf|echo)\s+[^\n]*>\s*\S|>>\s*\S|\bpython(?:3)?\s+-c\s+[^\n]*(?:open\(|write_text\(|write_bytes\())/i;
  const windowsMutation =
    /(?:\b(?:Set-Content|Add-Content|Out-File|Remove-Item|Move-Item|Copy-Item|Clear-Content|New-Item|Rename-Item)\b|\b(?:copy|move|del|erase|ren|rd|rmdir|md|mkdir)\s+\S|(?:^|[;&|]\s*)type\s+[^\n]*>\s*\S|>>\s*\S)/i;

  if (["powershell", "pwsh"].includes(name)) return windowsMutation.test(command) || posixMutation.test(command);
  if (name === "cmd") return windowsMutation.test(command) || posixMutation.test(command);
  return posixMutation.test(command) || windowsMutation.test(command);
}
