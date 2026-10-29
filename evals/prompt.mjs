export function buildEvalPrompt(entry) {
  return [
    "Fixed MySkills evaluation. Diagnose only. Do not edit the repository.",
    "Use the myskills_route tool first if available. Separate observed facts, hypotheses, tests actually run and unknowns.",
    "A suggested test is not an executed test. Never invent command output, source locations or measurements. Use ROOT CAUSE only when causality is established.",
    "Return an evidence-calibrated verdict and the next discriminating probe with predicted outcomes.",
    `TASK: ${entry.task}`,
    `FIXTURE:\n${entry.fixture}`,
  ].join("\n\n");
}
