<!--
  Built-in skill. Name and description are registered in code at
  packages/core/src/plugin/skill.ts. The body below becomes the skill's
  content.
-->

# Typst Math

Use this skill to author Typst 0.15+ documents whose main job is math: formulas, numbered equations, aligned derivations, Chinese or English mathematical prose, and CeTZ diagrams. Check the result by compiling a PDF and reading a PNG.

## Files live in the workspace

Write source files in the user's workspace. Do not run commands against skill:// paths.

`skill://typst-math/SKILL.md` is readable text, not a project directory. Create a folder such as `math/notes/` in the user's workspace, write `.typ` files there, and run `typst` from that folder. Typst downloads `@preview` packages into its own cache during compile. Do not copy package source into the workspace.

## Check the compiler first

```sh
typst --version
```

Continue only when the version is 0.15 or newer. If `typst` is missing, stop and tell the user how to install it (`https://github.com/typst/typst`). Do not invent a PDF, and do not hand-write a PNG.

Useful commands, run in the workspace folder:

```sh
typst compile notes.typ notes.pdf
typst compile notes.typ "preview/page-{p}.png" --format png --ppi 144
typst fonts
```

Read every PNG before calling the document done. Confirm equations stay inside the margins, alignment points line up, CJK glyphs are real characters rather than boxes, and diagram labels sit on the intended vertices.

## Page and CJK type

```typst
#set page(paper: "a4", margin: 2cm)
#set text(
  lang: "zh",
  region: "cn",
  size: 11pt,
  font: ("Libertinus Serif", "Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", "SimSun"),
)
#set par(justify: true, first-line-indent: 2em)
#set math.equation(numbering: "(1)")
```

For an English-only note, use `lang: "en"` and drop the CJK families. The math font does not draw Chinese. Put Chinese inside math in quotes so it uses the text font: `$S = "面积"$`. If compile warns about an unknown font, run `typst fonts`, pick an installed CJK family, and add it to the list. Do not download fonts ad hoc.

A space just inside the dollar signs makes a display equation. No space makes inline math.

```typst
勾股定理 $a^2 + b^2 = c^2$ 写成

$
  c = sqrt(a^2 + b^2)
$ <eq:hyp>
```

Refer to a labeled equation with `@eq:hyp`. Labels attach to the equation, after the closing `$`.

## Formulas that compile

Prefer Typst math over LaTeX spellings.

| Write | Avoid |
| --- | --- |
| `a / b` | `\frac{a}{b}` |
| `sqrt(x)`, `root(3, x)` | `\sqrt` |
| `a^2`, `x_n` | `^` or `_` outside math |
| `times`, `dot`, `plus.minus` | `\times`, `\cdot`, `\pm` |
| `<=`, `>=`, `!=`, `approx` | `\le`, `\ge` |
| `sum_(i = 1)^n i`, `integral_a^b f(x) dif x` | `\sum`, `\int` |
| `lim_(x -> 0)` | `\lim` |
| `mat(1, 2; 3, 4)`, `vec(x, y)` | `\begin{matrix}` |
| `binom(n, k)` | `\binom` |
| `cal(L)`, `bb(R)`, `bold(v)` | `\mathcal`, `\mathbb` |
| `dots.h`, `dots.c` | `\ldots`, `\cdots` |

Named arguments use a colon: `rect(width: 4cm)`. A `=` there is a syntax error.

Align a derivation on `=` with `&`, and break lines with `\`:

```typst
$
  (a + b)^2 &= a^2 + 2 a b + b^2 \
             &= a^2 + b^2 + 2 a b
$
```

Piecewise functions:

```typst
$ f(x) = cases(
  x^2 & x >= 0,
  -x & "otherwise",
) $
```

If a symbol name is rejected, read the compiler error and the Typst symbol list. Do not invent a name because it looks like LaTeX.

Set and show rules apply only to content that follows them. Put `#set` and `#show` above the first equation they should affect.

## CeTZ diagrams

Pin the preview versions below. Draw inside `cetz.canvas`, and import `cetz.draw` inside that block so its `line` does not replace Typst's line.

```typst
#import "@preview/cetz:0.5.3"

#cetz.canvas(length: 1cm, {
  import cetz.draw: *
  line((0, 0), (4, 0), (1.5, 2.6), close: true)
  content((0, 0), anchor: "north-east", $A$)
  content((4, 0), anchor: "north-west", $B$)
  content((1.5, 2.6), anchor: "south", $C$)
  line((1.5, 2.6), (1.5, 0), stroke: (paint: gray, dash: "dashed", thickness: 0.6pt))
})
```

Coordinates are `(x, y)` with `y` upward. Name an element and attach arrows to anchors instead of guessing endpoints:

```typst
circle((0, 0), radius: 1.2, name: "o")
line((-2, 0), (2, 0), mark: (end: ">"))
line((0, -2), (0, 2), mark: (end: ">"))
content("o.east", anchor: "west", $r$)
```

Function graphs use CeTZ Plot, which needs CeTZ 0.5 or newer:

```typst
#import "@preview/cetz:0.5.3"
#import "@preview/cetz-plot:0.1.4"

#cetz.canvas({
  import cetz.draw: *
  import cetz-plot: *
  plot.plot(size: (8, 5), x-tick-step: 1, y-tick-step: 1, {
    plot.add(domain: (-2, 3), x => calc.pow(x, 2) - 2 * x)
  })
})
```

If those two pins fail together, use the CeTZ version required by the current `cetz-plot` page on Typst Universe. Do not vendor either package. If `plot.add` rejects a key, trust the compiler error and the manual for the pinned version.

Mark only what the problem states: vertices, given lengths, right angles, and axes. A dashed helper line belongs in the solution figure, not on a student diagram, unless the prompt introduces it.

## When compile fails

- `unknown variable`: the name is misspelled, or `#let` sits below its use.
- `unknown font family`: drop that family or replace it with one from `typst fonts`.
- `file not found` on an import: `@preview` needs a network cache; a relative path is resolved from the file that imports it.
- `expected content, found string`: wrap a string in brackets when content is required, `[#value]`.
- Package or symbol errors: change the call to match the error. Do not paste an upstream package tree into the workspace.

After each fix, run `typst compile` again and re-read the PNG. A zero exit code means the file type-checks; the PNG is what shows overflow, overlap, and missing glyphs.

## Attribution

Authoring habits in this skill (Typst 0.15+, compile then inspect a PNG, CeTZ instead of TikZ) are adapted from conventions in [lucifer1004/claude-skill-typst](https://github.com/lucifer1004/claude-skill-typst) (MIT, Copyright (c) 2026 lucifer1004) and [statzhero/typst-cetz-skill](https://github.com/statzhero/typst-cetz-skill) by Ulrich Atz (CC-BY-4.0). This text is a new summary. It does not include those repositories' source.
