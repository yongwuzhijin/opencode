import { describe, expect } from "bun:test"
import { AppNodeBuilder } from "@opencode/core/effect/app-node-builder"
import { Config } from "@opencode/core/config"
import { Document, Info } from "@opencode/schema/config"
import { Effect, Layer, Stream } from "effect"
import { SkillPlugin } from "@opencode/core/plugin/skill"
import { Skill } from "@opencode/core/skill"
import { Flag } from "@opencode/core/flag"
import { testEffect } from "../lib/effect"
import { host } from "./host"

const it = testEffect(AppNodeBuilder.build(Skill.node))
const config = (plugins: Info["plugins"] = []) =>
  Layer.succeed(
    Config.Service,
    Config.Service.of({
      entries: () => Effect.succeed([new Document({ type: "document", info: new Info({ plugins }) })]),
      changes: () => Stream.never,
    }),
  )

describe("SkillPlugin.Plugin", () => {
  it.effect("registers built-in skills", () =>
    Effect.gen(function* () {
      const skill = yield* Skill.Service
      yield* SkillPlugin.Plugin.effect(
        host({
          app: { name: "test", version: "1.2.3", channel: "beta" },
          skill: {
            list: () => Effect.die("unused skill.list"),
            transform: skill.transform,
            reload: skill.reload,
          },
        }),
      ).pipe(Effect.provide(config()), Effect.provide(Flag.testLayer()))
      const skills = yield* skill.list()
      const report = skills.find((item) => item.id === "report")

      expect(skills).toContainEqual(
        expect.objectContaining({
          id: "opencode",
          name: "OpenCode",
          path: "skill://opencode/SKILL.md",
          description: expect.stringContaining("any question about OpenCode itself"),
        }),
      )
      expect(skills).toContainEqual(
        expect.objectContaining({
          id: "report",
          name: "Report",
          path: "skill://report/SKILL.md",
          description: expect.stringContaining("opencode issue"),
        }),
      )
      expect(report?.content).toContain("- opencode version: 1.2.3")
      expect(report?.content).toContain("- install/channel: beta")

      const typst = skills.find((item) => item.id === "typst-math")
      const worksheets = skills.find((item) => item.id === "math-worksheets")
      const cn = skills.find((item) => item.id === "cn-math-problem-design")
      expect(skills).toContainEqual(
        expect.objectContaining({
          id: "typst-math",
          name: "Typst Math",
          path: "skill://typst-math/SKILL.md",
          description: expect.stringContaining("Typst"),
        }),
      )
      expect(skills).toContainEqual(
        expect.objectContaining({
          id: "math-worksheets",
          name: "Math Worksheets",
          path: "skill://math-worksheets/SKILL.md",
          description: expect.stringContaining("SymPy"),
        }),
      )
      expect(skills).toContainEqual(
        expect.objectContaining({
          id: "cn-math-problem-design",
          name: "中国数学命题",
          path: "skill://cn-math-problem-design/SKILL.md",
          description: expect.stringContaining("义务教育数学课程标准"),
        }),
      )
      expect(typst?.description).toContain("CeTZ")
      expect(worksheets?.description).toContain("worksheet")
      expect(cn?.description).toContain("中考")
      expect(typst?.content).toContain("skill://")
      expect(typst?.content).toContain("@preview/cetz")
      expect(typst?.content).toContain("typst compile")
      expect(worksheets?.content).toContain("python3")
      expect(worksheets?.content).toContain("sympy")
      expect(worksheets?.content).toContain("tectonic")
      expect(cn?.content).toContain("义务教育数学课程标准（2022年版）")
      expect(cn?.content).toContain("基础")
      expect(cn?.content).toContain("压轴")
      expect(cn?.content).toContain("sympy")
      for (const item of [typst, worksheets, cn]) {
        expect(item?.content).toContain("Write source files in the user's workspace")
        expect(item?.content).toContain("Do not run commands against skill:// paths")
      }
    }),
  )

  it.effect("reports canonical configured plugin sources with existing labels and ordering", () =>
    Effect.gen(function* () {
      const skill = yield* Skill.Service
      yield* SkillPlugin.Plugin.effect(
        host({
          skill: {
            list: () => Effect.die("unused skill.list"),
            transform: skill.transform,
            reload: skill.reload,
          },
        }),
      )
      const report = (yield* skill.list()).find((item) => item.id === "report")
      expect(report?.content).toContain("- Active plugins: -disabled, local.ts, package-plugin, package-plugin")
    }).pipe(
      Effect.provide(
        config(["package-plugin", "-disabled", "local.ts", { package: "package-plugin", options: { enabled: true } }]),
      ),
      Effect.provide(Flag.testLayer()),
    ),
  )
})
