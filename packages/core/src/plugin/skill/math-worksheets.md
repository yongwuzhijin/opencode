<!--
  Built-in skill. Name and description are registered in code at
  packages/core/src/plugin/skill.ts. The body below becomes the skill's
  content.
-->

# Math Worksheets

Build a printable K-12 math worksheet in Chinese or English. The job is three artifacts that agree with each other: a student sheet, a teacher key, and a Python script whose SymPy check exits 0. Typst is the default typesetter. LaTeX via Tectonic is the fallback when `typst` is not on `PATH`.

## Files live in the workspace

Write source files in the user's workspace. Do not run commands against skill:// paths.

This skill is the text at `skill://math-worksheets/SKILL.md`. It is not a directory you can execute. Create `worksheets/<topic>/` in the user's workspace and write `problems.json`, `verify.py`, `student.typ`, and `teacher.typ` there.

## What "done" means

Do not compile the final PDF, and do not show a sheet to the user as final, until all of these are true:

1. `python3 verify.py` prints `{"ok": true, ...}` and exits 0.
2. The student PDF contains prompts and answer lines only. It does not contain final answers, worked steps, or choice keys.
3. The teacher PDF uses the same numbering and prompts, then steps and the verified answer.
4. You have read the PNG export and the text is on the page, with space to write.

If a prompt, number, or answer changes after a green check, update `problems.json` and run `python3 verify.py` again before compiling.

## Ask only what changes the sheet

Confirm grade band, language (`zh` or `en`), topic, count, and mix of easy and hard items when the user left them open. Default to the user's language, 10 problems, no answers on the student sheet, and A4. Do not add a second topic to fill a quota.

## `problems.json`

Numbers that SymPy must check are exact rational strings (`"5/2"`, `"12/4"`), not binary floats. The `expr` is the value to compute from the givens. The prose must state the same givens; the script cannot check reading comprehension, so you check that match yourself.

```json
{
  "language": "zh",
  "grade": "5",
  "title": "小数与分数",
  "problems": [
    {
      "id": "1",
      "kind": "compute",
      "prompt": "计算 $3/4 + 1/6$。",
      "check": "expr",
      "expr": "3/4 + 1/6",
      "answer": "11/12",
      "steps": ["通分，分母取 12。", "$9/12 + 2/12 = 11/12$。"]
    },
    {
      "id": "2",
      "kind": "choice",
      "prompt": "$6 times 7$ 等于",
      "check": "expr",
      "expr": "6*7",
      "choices": { "A": "36", "B": "42", "C": "48", "D": "13" },
      "answer": "B",
      "steps": ["$6 times 7 = 42$，对应 B。"]
    },
    {
      "id": "3",
      "kind": "solve",
      "prompt": "解方程 $2 x + 3 = 11$。",
      "check": "solve",
      "symbol": "x",
      "equation": ["2*x + 3", "11"],
      "answer": ["4"],
      "steps": ["两边减 3，得 $2 x = 8$。", "两边除以 2，得 $x = 4$。"]
    }
  ]
}
```

`equation` is `[left, right]`. `answer` for `solve` is the full solution set. Every choice value is an exact string. Exactly one choice may equal the computed value.

Add a new `check` only by extending `verify.py` with an independent computation (distance from two coordinates, a simplified expression, a count). A problem with no check does not go on the sheet.

## `verify.py`

Write this file in the workspace and extend it. Run it with `python3 verify.py`. It must import `sympy` and recompute from `expr` or `equation`, never by parsing the `steps` strings.

```python
import json
import sys
import sympy as sp

def value(text, symbols):
    return sp.simplify(sp.sympify(text, locals=symbols))

def same(left, right):
    return sp.simplify(left - right) == 0

doc = json.loads(open("problems.json", encoding="utf-8").read())
failures = []
for item in doc["problems"]:
    symbols = sp.symbols(item.get("symbol", "x"))
    names = {str(symbols): symbols} if isinstance(symbols, sp.Symbol) else {str(s): s for s in symbols}
    if item["check"] == "expr":
        got = value(item["expr"], names)
        claim = item["answer"]
        if "choices" in item:
            chosen = item["choices"][claim]
            others = [text for key, text in item["choices"].items() if key != claim]
            if not same(got, value(chosen, names)) or any(same(got, value(text, names)) for text in others):
                failures.append({"id": item["id"], "got": str(got), "answer": claim})
        elif not same(got, value(claim, names)):
            failures.append({"id": item["id"], "got": str(got), "answer": claim})
    elif item["check"] == "solve":
        symbol = names[item["symbol"]]
        left, right = item["equation"]
        roots = [sp.simplify(root) for root in sp.solve(sp.Eq(value(left, names), value(right, names)), symbol)]
        claims = [value(text, names) for text in item["answer"]]
        if set(map(str, roots)) != set(map(str, claims)):
            failures.append({"id": item["id"], "got": [str(root) for root in roots], "answer": item["answer"]})
    else:
        failures.append({"id": item["id"], "error": "unknown check"})

if failures:
    print(json.dumps({"ok": False, "failures": failures}, ensure_ascii=False))
    sys.exit(1)
print(json.dumps({"ok": True, "count": len(doc["problems"])}, ensure_ascii=False))
```

If `python3 -c "import sympy"` fails, create `./.venv` in the worksheet folder, install `sympy` there, and run the venv interpreter. Do not treat a missing interpreter or a nonzero exit as a pass. Word-problem equations must be the ones implied by the prompt; say so in the teacher key when the setup is the step a student would most likely get wrong.

## Typst sheets

Prefer Typst. Load the same JSON in both files. `student.typ` may read `prompt` only. `teacher.typ` may read `steps` and `answer`.

Shared setup:

```typst
#let data = json("problems.json")
#set page(paper: "a4", margin: 1.8cm)
#set text(
  size: 12pt,
  lang: if data.language == "zh" { "zh" } else { "en" },
  font: ("Libertinus Serif", "Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", "SimSun"),
)
```

Student body: title, a name line, then each prompt, blank space, and a light answer line. Keep at least two centimeters of writing room under a computation and more under a word problem. Do not print `answer`, `steps`, or the letter of a choice.

```typst
#for (index, item) in data.problems.enumerate() [
  #text(weight: "bold")[#(index + 1).]
  #eval(item.prompt, mode: "markup")
  #v(2.2em)
  #line(length: 100%, stroke: 0.4pt + luma(170))
  #v(0.8em)
]
```

`eval` renders the `$...$` stored in JSON. If a prompt has no math, a plain string still works. If `eval` rejects a prompt, escape the problem characters instead of dropping the item. Keep the prompt as text and math; do not put `#` code in it, because `eval` runs that code.

Teacher body: same prompt, then the steps as a list, then the verified answer. For Chinese, label it `答案`; for English, `Answer`. State that the answer matches `verify.py`.

Compile only after the script exits 0:

```sh
typst compile student.typ student.pdf
typst compile teacher.typ teacher.pdf
typst compile student.typ "preview/student-{p}.png" --format png --ppi 144
typst compile teacher.typ "preview/teacher-{p}.png" --format png --ppi 144
```

Read the PNGs. Fix spacing in the `.typ` files without changing answers. Fix math in `problems.json`, re-run `python3 verify.py`, then compile again.

Diagrams needed by a prompt go in the student file with `@preview/cetz`, using the `typst-math` skill's pinning rules. The student figure shows the given data. The teacher figure may add the helper lines used in the steps.

## LaTeX fallback

Use Tectonic only when `typst --version` fails and `tectonic` is on `PATH`. Generate `student.tex` and `teacher.tex` from `problems.json` after the same `python3 verify.py` gate. English sheets can use `article` plus `amsmath` and `geometry`. Chinese sheets should use `ctexart` with the `UTF8` option. Compile with:

```sh
tectonic student.tex
tectonic teacher.tex
```

If CJK fonts fail under Tectonic, say so and ask to install Typst. Do not switch the answers to an unverified engine, and do not claim a PDF exists when tectonic exits nonzero.

## Attribution

The workflow idea — a student sheet, a separate step-by-step key, and a SymPy gate before anything is final — is adapted from [stellawuellner/math-worksheets-skill](https://github.com/stellawuellner/math-worksheets-skill) (MIT, Copyright (c) 2026 stellawuellner and math-worksheets contributors). This file is a new write-up. It does not include that project's scripts, templates, or tests.
