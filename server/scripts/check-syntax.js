import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const files = []
const visit = (directory) => {
  for (const entry of readdirSync(directory)) {
    if (entry === 'node_modules') continue
    const target = path.join(directory, entry)
    if (statSync(target).isDirectory()) visit(target)
    else if (target.endsWith('.js')) files.push(target)
  }
}
visit(process.cwd())
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status || 1)
}
console.log(`Syntax check passed for ${files.length} server JavaScript files.`)
