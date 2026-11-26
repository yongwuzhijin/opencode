import { createEffect, For, on, onCleanup } from "solid-js"
import { createStore } from "solid-js/store"
import { prefersReducedMotion } from "@opencode/ui/motion"

const target = ["s", "e", "a", "l"] as const

const choices = ["s", "e", "a", "l"] as const

export function AnimatedWordmark(props: { active: boolean }) {
  const [state, setState] = createStore({ letters: [...target] })
  const timers = new Set<ReturnType<typeof setTimeout>>()

  createEffect(
    on(
      () => props.active,
      (active) => {
        timers.forEach(clearTimeout)
        timers.clear()

        if (!active || prefersReducedMotion()) {
          setState("letters", [...target])

          return
        }

        const starts = target.map(() => choices[Math.floor(Math.random() * choices.length)])
        const settles = target.map(() => 6 + Math.floor(Math.random() * 8))
        const last = Math.max(...settles)
        setState("letters", starts)

        Array.from({ length: last }, (_, index) => index + 1).forEach((tick) => {
          const timer = setTimeout(() => {
            setState(
              "letters",
              target.map((letter, index) =>
                tick >= settles[index] ? letter : choices[Math.floor(Math.random() * choices.length)],
              ),
            )
            timers.delete(timer)
          }, tick * 75)

          timers.add(timer)
        })
      },
    ),
  )

  onCleanup(() => timers.forEach(clearTimeout))

  return (
    <svg class="settings-about-wordmark" viewBox="0 0 114 42" aria-hidden="true">
      <defs>
        <symbol id="settings-about-letter-s" viewBox="0 0 24 42">
          <path class="settings-about-letter-shadow" d="M24 18H6V12H24V18ZM18 30H0V24H18V30Z" />
          <path d="M24 12H0V6H24V12ZM6 18H0V12H6V18ZM24 24H0V18H24V24ZM24 30H18V24H24V30ZM24 36H0V30H24V36Z" />
        </symbol>
        <symbol id="settings-about-letter-a" viewBox="0 0 24 42">
          <path class="settings-about-letter-shadow" d="M18 24H6V12H18V24Z" />
          <path d="M24 36H18V6H24V36ZM6 36H0V6H6V36ZM18 30H6V24H18V30ZM18 12H6V6H18V12Z" />
        </symbol>
        <symbol id="settings-about-letter-l" viewBox="0 0 24 42">
          <path class="settings-about-letter-shadow" d="M6 30H0V24H6V30Z" />
          <path d="M6 30H0V6H6V30ZM24 36H0V30H24V36Z" />
        </symbol>
        <symbol id="settings-about-letter-e" viewBox="0 0 24 42">
          <path class="settings-about-letter-shadow" d="M24 24V30H6V24H24Z" />
          <path d="M24 24H6V30H24V36H0V6H24V24ZM6 18H18V12H6V18Z" />
        </symbol>
      </defs>
      <For each={state.letters}>
        {(letter, index) => (
          <use href={`#settings-about-letter-${letter}`} x={index() * 30} width="24" height="42" />
        )}
      </For>
    </svg>
  )
}
