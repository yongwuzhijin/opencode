import { expect, test } from "bun:test"
import { desktopUpdatesEnabled } from "./seal"

test("a packaged app with an update feed does not check upstream", () => {
  expect(desktopUpdatesEnabled(true, true)).toBe(false)
})

test("a build without a feed stays disabled", () => {
  expect(desktopUpdatesEnabled(true, false)).toBe(false)
  expect(desktopUpdatesEnabled(false, true)).toBe(false)
  expect(desktopUpdatesEnabled(false, false)).toBe(false)
})
