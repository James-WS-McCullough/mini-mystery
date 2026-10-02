// What the player reads is punctuated the old way: commas and full stops,
// and an ellipsis for trailing off. A dash is kept for one thing only: the
// voice cut short, by somebody else or by a stammer, and then it hangs on the
// word it breaks ("Well, I never—", "S— she"). A dash standing free between
// words is the modern habit, and is not wanted. Comments may have all the
// dashes they like; the strings in the code and the text in the templates
// may not.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const SRC = join(__dirname, '../../src')

/** A dash with a space (or nothing) before it, rather than one hanging on a word. */
const LOOSE_DASH = /(^|\s)—/

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return filesUnder(path)
    return /\.(ts|vue)$/.test(name) ? [path] : []
  })
}

const STRINGS = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
])

/** Lines of a script whose string literals hold a dash. */
function dashedStrings(code: string, firstLine: number): number[] {
  const source = ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true)
  const lines: number[] = []
  const visit = (node: ts.Node) => {
    // (A thrown error is for the developer, not the player.)
    if (ts.isNewExpression(node) && node.expression.getText(source) === 'Error') return
    if (STRINGS.has(node.kind) && LOOSE_DASH.test(node.getText(source).slice(1))) {
      lines.push(source.getLineAndCharacterOfPosition(node.getStart(source)).line + firstLine)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return lines
}

function dashedLines(path: string): number[] {
  const text = readFileSync(path, 'utf8')
  if (!path.endsWith('.vue')) return dashedStrings(text, 1)
  const lines: number[] = []
  const lineOf = (index: number) => text.slice(0, index).split('\n').length
  for (const m of text.matchAll(/(<script[^>]*>)([\s\S]*?)<\/script>/g)) {
    lines.push(...dashedStrings(m[2], lineOf(m.index! + m[1].length)))
  }
  const template = text.match(/<template>([\s\S]*)<\/template>/)
  if (template) {
    const bare = template[1].replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ' '))
    const start = lineOf(template.index!)
    bare.split('\n').forEach((line, i) => {
      if (LOOSE_DASH.test(line)) lines.push(start + i)
    })
  }
  return lines
}

describe('what the player reads', () => {
  it('has no dash standing free between words', () => {
    const found = filesUnder(SRC).flatMap((path) =>
      dashedLines(path).map((line) => `${relative(SRC, path)}:${line}`),
    )
    expect(found).toEqual([])
  })
})
