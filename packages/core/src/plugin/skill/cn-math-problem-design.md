<!--
  Built-in skill. Name and description are registered in code at
  packages/core/src/plugin/skill.ts. The body below becomes the skill's
  content.
-->

# 中国数学命题

为大陆小学（1–6 年级）和初中（7–9 年级）设计题目、变式、分步解答，以及可打印的学生卷和教师卷。范围对齐《义务教育数学课程标准（2022年版）》；初中压轴参照中考常见综合题，不把高中内容写进义务教育卷。

## 源文件放在工作区

Write source files in the user's workspace. Do not run commands against skill:// paths.

`skill://cn-math-problem-design/SKILL.md` 只是说明，不能在原地运行。在用户工作区新建目录（例如 `math/grade7-linear/`），把 `problems.json`、`verify.py`、`.typ`、`.svg` 写到那里，再用 PATH 上的 `python3` 和 `typst`。

## 先定边界

缺少年级或知识点时先问。已知年级时，按下面的结构出题，不要用超纲内容凑难度。

用户没指定时：简体中文、学生卷不含答案、教师卷写分步解答、A4。题量按用户要求；没说就 6 题，难度按基础 3、巩固 2、拔高 1。只有用户要「试卷」或「压轴」时才加大综合题比重。

《义务教育数学课程标准（2022年版）》按四个领域组织内容：数与代数、图形与几何、统计与概率、综合与实践。出题时标出领域和具体知识点，并守住学段：

- 1–2 年级：万以内的数，加减法和表内乘除，元角分、时分、厘米米，认识常见图形，分类。
- 3–4 年级：多位数乘除，分数的初步认识，小数，周长和面积，条形统计图。
- 5–6 年级：分数和小数的运算，比和百分数，圆，简易方程，扇形统计图，可能性。
- 7–9 年级：有理数与实数，整式与分式，方程与不等式，函数，三角形、全等与相似，圆，图形的变化与坐标，统计与概率。

用户明确要求超纲拓展时，在题干外单独标明「超纲」，并且不放进默认学生卷。

## 难度

难度看思维步数，不看数字好不好看。

- 基础：一个知识点，一步或两步能完成。口算、直接代公式、辨认图形属于这一档。
- 巩固：课标内的常规题，步骤完整，但路径明确。竖式、脱式、常规应用题、一次函数求解析式属于这一档。
- 拔高：要分类、逆向，或把两个知识点接起来。仍必须在本年级课标内。
- 压轴：小学是多步应用或要画图分析的综合题；初中是中考常见的函数与几何、动点、存在性。先有可验证的结论，再包装成压轴，不要只把文字写长。

每题在 JSON 里写 `tier`：`基础`、`巩固`、`拔高` 或 `压轴`。

## 题型

按知识点选题型，而不是每种都来一遍。

- 口算、竖式、脱式：数字要能手算，结果用整数或简单分数。脱式保留关键等号，教师卷写出等号成立的理由。
- 填空：空要短，答案唯一。不要把整段推理都放进空里。
- 选择：四个选项，恰好一个正确。干扰项来自真实错因（漏进位、符号、单位、取了增根），而且每个干扰项都算得出来。
- 应用题：单位、数量关系、所求写清楚。小学优先线段图能表示的和差倍、归一、百分率。
- 几何证明与动点：写明已知、求证或所求。动点要有起点、路径和字母。图上只画题干给出的元素。
- 函数与方程综合：先定函数式和关键点，再写题。存在性问题要写清「存在」时代入后的方程，以及无解时的结论。

## 怎么出一道题

1. 考点拆解。写下知识点、已知量、所求量、允许使用的公式或定理。
2. 先写可计算的条件，再写中文题干。题干里的每一个数都要出现在计算条件里。
3. 同类仿写：保持结构，只换数字，并重新验证。
4. 条件变式：改一个已知，看结论怎么变。结论变式：已知不动，改问另一个量。
5. 一题多解：只把确实走得通的方法写进教师卷，并注明每种方法用到的知识点。
6. 易错点可以做陷阱，但题目仍要有确定答案。典型陷阱是单位不一致、开方丢负值、分母为零、分类少一种、图和条件不符。教师卷要点出陷阱，不能把错值当成答案。

小学解答先写一句算理，再列式；数量关系能用线段图或示意图说明时就画。不要写成初中证明。

初中证明写「已知、求证、证明」，每一步带依据（如 SAS、角平分线定理、等量代换）。代数变形等号对齐。解分式方程和带根号的方程要写检验，不合题意的根要舍去并说明理由。

## 答案必须单独验算

模型写出的答案只是待检声明。定稿前在工作区运行 `python3 verify.py`，用 `sympy` 从条件重算。脚本退出码不是 0，就不能排版、也不能把题交给用户当成品。

计算题、方程、选择和填空沿用工作表技能里的检查：精确分数字符串、`check` 为 `expr` 或 `solve`、选择题恰好一个选项等于计算值。把下面的文件写成工作区里的 `verify.py` 再按题型扩展。

```python
import json
import sys
import sympy as sp

def value(text, names):
    return sp.simplify(sp.sympify(text, locals=names))

def same(left, right):
    return sp.simplify(left - right) == 0

doc = json.loads(open("problems.json", encoding="utf-8").read())
failures = []
for item in doc["problems"]:
    symbol = sp.symbols(item.get("symbol", "x"))
    names = {str(symbol): symbol} if isinstance(symbol, sp.Symbol) else {str(s): s for s in symbol}
    if item["check"] == "expr":
        got = value(item["expr"], names)
        if "choices" in item:
            chosen = item["choices"][item["answer"]]
            others = [text for key, text in item["choices"].items() if key != item["answer"]]
            ok = same(got, value(chosen, names)) and not any(same(got, value(text, names)) for text in others)
        else:
            ok = same(got, value(item["answer"], names))
        if not ok:
            failures.append({"id": item["id"], "got": str(got)})
    elif item["check"] == "solve":
        symbol = names[item["symbol"]]
        left, right = item["equation"]
        roots = [sp.simplify(root) for root in sp.solve(sp.Eq(value(left, names), value(right, names)), symbol)]
        claims = [value(text, names) for text in item["answer"]]
        if set(map(str, roots)) != set(map(str, claims)):
            failures.append({"id": item["id"], "got": [str(root) for root in roots], "answer": item["answer"]})
    elif item["check"] == "distance":
        a = [value(part, names) for part in item["a"]]
        b = [value(part, names) for part in item["b"]]
        got = sp.simplify(sp.sqrt(sum((b[i] - a[i]) ** 2 for i in range(len(a)))))
        if not same(got, value(item["answer"], names)):
            failures.append({"id": item["id"], "got": str(got)})
    else:
        failures.append({"id": item["id"], "error": "unknown check"})

if failures:
    print(json.dumps({"ok": False, "failures": failures}, ensure_ascii=False))
    sys.exit(1)
print(json.dumps({"ok": True, "count": len(doc["problems"])}, ensure_ascii=False))
```

几何量优先建成坐标，用距离、斜率或面积公式做 `distance` 或其他独立 `check`。证明题除了逐行检查「这一步是否被上一句推出」，还要代一个满足条件的数值例子，确认结论成立。做不到这两件事，这道证明题不能定稿。

没有 `python3` 或 `sympy` 时，在题目目录建虚拟环境安装 `sympy` 再跑。不要改用口算代替脚本，也不要在脚本失败时仍输出试卷。

## 图

图只服务于题干或解答，不装饰。优先 Typst 的 CeTZ，或一份独立的简洁 SVG。标注顶点、已知长度和直角；辅助线用虚线，并且只出现在已经声明它的解答图里。动点标出起点和方向。

```typst
#import "@preview/cetz:0.5.3"

#cetz.canvas(length: 1cm, {
  import cetz.draw: *
  line((0, 0), (4, 0), (0, 3), close: true)
  content((0, 0), anchor: "north-east", $C$)
  content((4, 0), anchor: "north-west", $B$)
  content((0, 3), anchor: "south-east", $A$)
})
```

直角在 C 的这张图，应用 `distance` 核对 `AC = 3`、`BC = 4`、`AB = 5` 后再写进题干。函数图像的坐标轴、描点和 `@preview/cetz-plot` 写法见 `typst-math` 技能；源文件仍然放在工作区，不要去运行 `skill://` 下的路径。

SVG 保持默认坐标系即可，文字用 `font-family="Noto Serif CJK SC, Source Han Serif SC, SimSun, sans-serif"`。导出前在浏览器或 Typst 里看一次，避免标签压住线条。

## 试卷

学生卷只有题干、作答空和必要的图。教师卷保留相同题号，写出分步解答、依据和 `verify.py` 的通过结果。

排版优先 Typst。中文试卷可以用 Typst Universe 上的 `@preview/exam-zh-next`（MIT）。版本以 Universe 为准，下面是 0.1.0 的入口：

```typst
#import "@preview/exam-zh-next:0.1.0": *

#show: exam.with(title: [七年级数学练习], subject: [数学])
#make-title()

= 填空题
#question[
  方程 $2 x + 3 = 11$ 的解是 #fillin[$x = 4$]。
]
```

学生版：

```sh
typst compile paper.typ student.pdf
```

教师版把答案和评分点印出来：

```sh
typst compile --input exam-mode=teacher paper.typ teacher.pdf
```

`@preview/ezexam`（例如 `#import "@preview/ezexam:0.4.0": *`）是 AGPL-3.0。只允许这样一行导入，让 Typst 自己从 Universe 取包。不要把该包源码复制进仓库或工作区，也不要把它的文件改名后保存下来。导入失败或接口对不上时，改用下面的简版，不要去复制 AGPL 源码。

```typst
#set page(paper: "a4", margin: (top: 1.8cm, bottom: 1.8cm, left: 1.6cm, right: 1.6cm))
#set text(lang: "zh", region: "cn", font: ("Libertinus Serif", "Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", "SimSun"))
#align(center)[#text(size: 16pt, weight: "bold")[练习标题]]
```

然后按题号输出。学生文件不读取 `answer`。编译后导出 PNG 并阅读：

```sh
typst compile student.typ "preview/page-{p}.png" --format png --ppi 144
```

看中文是否缺字、公式是否出界、选择题选项是否粘连、作答线是否够写。缺字体时运行 `typst fonts`，换成本机有的中文字体。

## 定稿前再对一遍

- 年级、知识点和《义务教育数学课程标准（2022年版）》的学段一致。
- `基础` / `巩固` / `拔高` / `压轴` 和实际步数一致。
- 选择题只有一个正确选项，填空答案唯一。
- `python3 verify.py` 输出 `ok: true` 且退出码为 0。
- 学生卷没有答案和评分点。
- PNG 里的中文、图和作答空都正常。

## 相关技能

公式、对齐推导和 CeTZ 细节用 `typst-math`。整页练习的学生卷、教师卷和 SymPy 闸门用 `math-worksheets`。本题负责年级、知识点、难度和中文试卷的命题约束；计算仍必须在工作区里用 `sympy` 复核。
