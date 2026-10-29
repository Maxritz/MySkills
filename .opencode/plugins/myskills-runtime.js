import { tool } from "@opencode-ai/plugin";
import { appendFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { estimateTokensFromBytes, isLikelySourceMutation, routeTask } from "../../runtime/router-core.mjs";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sourceMutation(toolName, args, configuredNames) {
  return isLikelySourceMutation(toolName, args, configuredNames);
}

export const MySkillsRuntime = async ({ directory, worktree, client }) => {
  const root = resolve(worktree || directory || process.cwd());
  const configPath = resolve(root, "myskills.config.json");
  if (!existsSync(configPath)) throw new Error(`MySkills runtime: missing ${configPath}`);
  const config = readJson(configPath);
  const sessionState = new Map();
  const metricsPath = process.env.MYSKILLS_METRICS_FILE
    ? resolve(process.env.MYSKILLS_METRICS_FILE)
    : null;

  function logMetric(record) {
    if (!metricsPath) return;
    mkdirSync(dirname(metricsPath), { recursive: true });
    appendFileSync(metricsPath, JSON.stringify({ at: new Date().toISOString(), ...record }) + "\n", "utf8");
  }

  const routeTool = tool({
    description: "Run this first for each user task. Deterministically route the task to the smallest relevant MySkills set, load the selected SKILL.md bodies into context, and report selected-core byte and rough-token estimates. This is routing, not proof that the task is solved.",
    args: {
      task: tool.schema.string(),
      max_skills: tool.schema.number().optional(),
    },
    async execute(args, context) {
      const sessionID = context?.sessionID ?? context?.sessionId;
      if (!sessionID) throw new Error("MySkills runtime: OpenCode did not provide a session ID; refusing untracked routing.");

      const plan = routeTask(args.task, config, args.max_skills ?? config.routing.maxSkills ?? 4);
      const bodies = [];
      let totalBytes = 0;
      for (const skill of plan.skills) {
        const path = resolve(root, skill, "SKILL.md");
        if (!path.startsWith(root + "/") || !existsSync(path)) {
          throw new Error(`MySkills runtime: route selected missing skill ${skill}`);
        }
        const raw = readFileSync(path, "utf8");
        const body = raw.replace(/^---\\r?\\n[\\s\\S]*?\\r?\\n---\\s*\\r?\\n/, "");
        const bytes = Buffer.byteLength(body, "utf8");
        totalBytes += bytes;
        bodies.push({ skill, path: `${skill}/SKILL.md`, bytes, body });
      }

      sessionState.set(sessionID, {
        routed: true,
        task: args.task,
        selected: new Set(plan.skills),
        at: Date.now(),
      });

      const metric = {
        sessionID,
        selectedSkills: plan.skills,
        selectedCoreBytes: totalBytes,
        estimatedSelectedCoreTokens: estimateTokensFromBytes(totalBytes),
        estimateMethod: "ceil(UTF-8 bytes / 4); not tokenizer usage",
        unmatched: plan.unmatched,
      };
      logMetric(metric);

      const header = [
        "MYSKILLS ROUTE",
        `Selected: ${plan.skills.length ? plan.skills.join(", ") : "none; no specialist keyword match"}`,
        `Reason: ${plan.matches.map((item) => item.skill + " [" + item.keywords.join(", ") + "]").join("; ") || "no configured trigger matched"}`,
        `Context estimate: ${totalBytes} selected-core bytes, approximately ${metric.estimatedSelectedCoreTokens} tokens. This is a byte-based estimate, not actual model token usage; it excludes system prompts, conversation history and tool overhead.`,
        "Reference files are not preloaded. Follow a selected skill's relative links and read only the references needed for this task.",
        "If no skill matched, continue with ordinary reasoning and do not invent a specialist diagnosis.",
      ].join("\n");

      return [header, ...bodies.map(({ skill, path, bytes, body }) => `===== LOADED ${skill} (${path}, ${bytes} bytes) =====\n${body}`)].join("\n\n");
    },
  });

  return {
    tool: {
      myskills_route: routeTool,
    },

    "tool.execute.before": async (input, output) => {
      const toolName = input.tool;
      if (toolName === "myskills_route") return;

      const state = sessionState.get(input.sessionID);
      if (!state?.routed) {
        throw new Error("MySkills task gate: call myskills_route with the current user request before using other tools. It will return matching skill instructions or explicitly report no match.");
      }

      if (sourceMutation(toolName, output.args ?? {}, config.routing.mutationTools ?? []) &&
          !state.selected.has("code-quality-gate")) {
        throw new Error("MySkills implementation gate: this operation looks like a source mutation, but code-quality-gate was not loaded for this task. Call myskills_route with the implementation request, inspect the quality checks, then retry.");
      }
    },

    event: async ({ event }) => {
      if (event.type === "message.updated") {
        const info = event.properties?.info;
        if (info?.role === "user" && info.sessionID) sessionState.delete(info.sessionID);
      }
      if (event.type === "session.deleted") {
        const sessionID = event.properties?.info?.id ?? event.properties?.sessionID;
        if (sessionID) sessionState.delete(sessionID);
      }
    },
  };
};
