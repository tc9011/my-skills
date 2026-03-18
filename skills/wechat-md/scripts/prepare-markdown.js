#!/usr/bin/env node
const fs = require('fs')

function stripFrontmatter(content) {
  return content.replace(/^---[\s\S]*?---\n*/, '')
}

function stripMoreTags(content) {
  return content.replace(/<!--\s*more\s*-->/g, '')
}

function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node prepare-markdown.js <markdown-file> [--strip-frontmatter] [--output <path>]')
    process.exit(0)
  }

  const inputFile = args[0]
  const shouldStrip = args.includes('--strip-frontmatter')
  const outputIdx = args.indexOf('--output')
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : '/tmp/wechat-md-input.md'

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`)
    process.exit(1)
  }

  let content = fs.readFileSync(inputFile, 'utf-8')
  if (shouldStrip) {
    content = stripFrontmatter(content)
    content = stripMoreTags(content)
  }

  if (!content.endsWith('\n')) content += '\n'
  fs.writeFileSync(outputFile, content)

  console.log(`Prepared markdown written to: ${outputFile}`)
  console.log(`Content size: ${content.length} characters`)
}

main()
