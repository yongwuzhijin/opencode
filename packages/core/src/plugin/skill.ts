/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill.js"

import { define, type Context } from "@opencode/plugin/effect/plugin"
import { Document } from "@opencode/schema/config"
import { Effect } from "effect"
import { AbsolutePath } from "../schema.js"
import { Skill } from "../skill.js"
import { Config } from "../config.js"
import { Flag } from "../flag.js"
import { Global } from "@opencode/util/global"
import os from "os"
import opencodeContent from "./skill/opencode.md" with { type: "text" }
import reportContent from "./skill/report.md" with { type: "text" }
import apiContent from "./skill/opencode-api.md" with { type: "text" }
import typstMathContent from "./skill/typst-math.md" with { type: "text" }
import mathWorksheetsContent from "./skill/math-worksheets.md" with { type: "text" }
import cnMathProblemDesignContent from "./skill/cn-math-problem-design.md" with { type: "text" }
import { files } from "./skill/opencode/api.js"

export const OpencodeContent = opencodeContent
export const ReportContent = reportContent

export const OpencodeDescription =
  "Use this skill for any question about OpenCode itself, including how OpenCode works, using or configuring it, migrating from V1 to V2, troubleshooting it, developing plugins or integrations, using the OpenCode SDK, clients, server, or API, and contributing to the OpenCode codebase. Also use it for OpenCode agents, commands, skills, tools, permissions, MCP servers, providers, models, themes, keybinds, formatters, the CLI, TUI, desktop app, and web app."
const REPORT_DESCRIPTION =
  "Use when the user wants to report an opencode issue or bug. Collect standard diagnostics, add user-specific reproduction context, and publish the issue with GitHub CLI."
const TYPST_MATH_DESCRIPTION =
  "Use when writing or compiling Typst 0.15+ math: formulas, numbered equations, multi-line derivations, Chinese or English math typography, or CeTZ geometry and function diagrams. Also use for .typ files, typst compile, and PDF or PNG checks of mathematical notation."
const MATH_WORKSHEETS_DESCRIPTION =
  "Use when generating a printable K-12 math worksheet in Chinese or English: a student sheet with answer lines, a separate teacher key with steps, and a SymPy check that must pass before the final PDF. Prefers Typst and can fall back to LaTeX via Tectonic."
const CN_MATH_PROBLEM_DESIGN_DESCRIPTION =
  "用于设计中国大陆小学（1–6年级）和初中（7–9年级）数学题、变式、分步解答和可打印试卷。对齐《义务教育数学课程标准（2022年版）》与中考常见题型，按知识点组织基础、巩固、拔高、压轴，定稿前用 SymPy 或独立复核验证答案。Use for mainland China primary and junior-high math problem design."

export const Plugin = define({
  id: "opencode.skill",
  effect: Effect.fn(function* (ctx) {
    const reportContent = yield* reportContentWithDiagnostics(ctx.app)
    const api = yield* Flag.enabled("opencode_api")
    const skills = yield* Skill.Service
    // Skill.Service rather than ctx.skill, whose editor can't add a skill's files.
    yield* skills.transform((editor) => {
      editor.add(
        Skill.Info.make({
          id: Skill.ID.make("opencode"),
          name: Skill.Name.make("OpenCode"),
          description: OpencodeDescription,
          path: AbsolutePath.make("skill://opencode/SKILL.md"),
          // With opencode:// fetch, its API section points there instead of the `opencode api` command.
          content: api ? OpencodeContent.replace(/## \[API\][^]*?(?=## \[Client\])/, `${apiContent}\n`) : OpencodeContent,
        }),
        api ? files : undefined,
      )
      editor.add(
        Skill.Info.make({
          id: Skill.ID.make("report"),
          name: Skill.Name.make("Report"),
          description: REPORT_DESCRIPTION,
          path: AbsolutePath.make("skill://report/SKILL.md"),
          content: reportContent,
        }),
      )
      editor.add(
        Skill.Info.make({
          id: Skill.ID.make("typst-math"),
          name: Skill.Name.make("Typst Math"),
          description: TYPST_MATH_DESCRIPTION,
          path: AbsolutePath.make("skill://typst-math/SKILL.md"),
          content: typstMathContent,
        }),
      )
      editor.add(
        Skill.Info.make({
          id: Skill.ID.make("math-worksheets"),
          name: Skill.Name.make("Math Worksheets"),
          description: MATH_WORKSHEETS_DESCRIPTION,
          path: AbsolutePath.make("skill://math-worksheets/SKILL.md"),
          content: mathWorksheetsContent,
        }),
      )
      editor.add(
        Skill.Info.make({
          id: Skill.ID.make("cn-math-problem-design"),
          name: Skill.Name.make("中国数学命题"),
          description: CN_MATH_PROBLEM_DESIGN_DESCRIPTION,
          path: AbsolutePath.make("skill://cn-math-problem-design/SKILL.md"),
          content: cnMathProblemDesignContent,
        }),
      )
    })
  }),
})

const reportContentWithDiagnostics = Effect.fn("SkillPlugin.reportContentWithDiagnostics")(function* (
  app: Context["app"],
) {
  const plugins = yield* configuredPlugins()
  // Under emulation on Windows ARM64, os.arch() reads x64 but PROCESSOR_IDENTIFIER still names the ARM host.
  const emulated =
    process.platform === "win32" && os.arch() === "x64" && process.env.PROCESSOR_IDENTIFIER?.startsWith("ARM")
  return [
    ReportContent,
    "",
    "## Runtime Diagnostics Snapshot",
    "",
    "These values were captured when the built-in report skill was registered. Verify them before publishing.",
    "",
    `- opencode version: ${app.version}`,
    `- install/channel: ${app.channel}`,
    `- OS: ${os.type()} ${os.release()} (${os.platform()} ${os.arch()}${emulated ? ", emulated on ARM64" : ""})`,
    `- Terminal: ${terminal()}`,
    `- Shell: ${shell()}`,
    `- Active plugins: ${plugins.length === 0 ? "None found in config" : plugins.join(", ")}`,
    `- Log directory: ${Global.Path.log}`,
  ].join("\n")
})

const configuredPlugins = Effect.fn("SkillPlugin.configuredPlugins")(function* () {
  const config = yield* Config.Service
  return (yield* config.entries())
    .filter((entry): entry is Document => entry.type === "document")
    .flatMap((entry) => entry.info.plugins ?? [])
    .map((entry) => (typeof entry === "string" ? entry : entry.package))
    .toSorted()
})

function terminal() {
  return (
    [
      process.env.TERM_PROGRAM ? `TERM_PROGRAM=${process.env.TERM_PROGRAM}` : undefined,
      process.env.TERM ? `TERM=${process.env.TERM}` : undefined,
      process.env.COLORTERM ? `COLORTERM=${process.env.COLORTERM}` : undefined,
    ]
      .filter((item): item is string => item !== undefined)
      .join(", ") || "Unavailable: terminal environment variables are not set"
  )
}

function shell() {
  return (
    process.env.SHELL ??
    process.env.ComSpec ??
    process.env.COMSPEC ??
    "Unavailable: shell environment variable is not set"
  )
}
