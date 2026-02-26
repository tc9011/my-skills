#!/usr/bin/env node
/**
 * Creates a CodeMirror 6 content injection script for md-wechat.vercel.app
 *
 * Usage:
 *   node create-injection.js <markdown-file> [--strip-frontmatter] [--output <path>]
 *
 * This script:
 * 1. Reads the markdown file
 * 2. Optionally strips YAML frontmatter and <!--more--> tags
 * 3. Creates a self-executing JS script that injects the content into
 *    the CodeMirror 6 editor on md-wechat.vercel.app
 * 4. Writes the injection script to /tmp/inject-content.js (or custom path)
 *
 * The injection script is designed to be read and injected via
 *   browser_evaluate + DOM script element creation
 */

const fs = require('fs')
const path = require('path')

function stripFrontmatter(content) {
  return content.replace(/^---[\s\S]*?---\n*/, '')
}

function stripMoreTags(content) {
  return content.replace(/<!--\s*more\s*-->/g, '')
}

function createInjectionScript(markdownContent) {
  const escaped = JSON.stringify(markdownContent)
  return `(function() {
  var text = ${escaped};
  var cmContent = document.querySelector('.cm-content');
  if (!cmContent) {
    window.__injectionResult = 'error: .cm-content not found';
    return;
  }
  var view = cmContent.cmTile && cmContent.cmTile.view;
  if (!view) {
    window.__injectionResult = 'error: CodeMirror view not found';
    return;
  }
  try {
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: text
      }
    });
    window.__injectionResult = 'success';
  } catch (e) {
    window.__injectionResult = 'error: ' + e.message;
  }
})();`
}

function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node create-injection.js <markdown-file> [--strip-frontmatter] [--output <path>]')
    console.log('')
    console.log('Options:')
    console.log('  --strip-frontmatter  Remove YAML frontmatter (--- ... ---) and <!--more--> tags from content')
    console.log('  --output <path>      Output path for injection script (default: /tmp/inject-content.js)')
    console.log('  --help, -h           Show this help message')
    process.exit(0)
  }

  const inputFile = args[0]
  const shouldStrip = args.includes('--strip-frontmatter')
  const outputIdx = args.indexOf('--output')
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : '/tmp/inject-content.js'

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`)
    process.exit(1)
  }

  let content = fs.readFileSync(inputFile, 'utf-8')

  if (shouldStrip) {
    const original = content
    content = stripFrontmatter(content)
    content = stripMoreTags(content)
    if (content !== original) {
      console.log('Stripped YAML frontmatter and <!--more--> tags')
    }
  }

  const script = createInjectionScript(content)
  fs.writeFileSync(outputFile, script)
  console.log(`Injection script written to: ${outputFile}`)
  console.log(`Content size: ${content.length} characters`)
  console.log(`Script size: ${script.length} characters`)
}

main()
