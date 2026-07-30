import { execFile } from 'node:child_process'
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const schemaRoot = join(repositoryRoot, 'documentation', 'app-server-schemas')
const packageVersion = readArgument('--version') ?? 'latest'
const checkOnly = process.argv.includes('--check')

function readArgument(name) {
  const index = process.argv.indexOf(name)
  if (index < 0) return null
  const value = process.argv[index + 1]?.trim()
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`)
  }
  return value
}

async function runCodex(version, args) {
  return execFileAsync('npx', ['-y', `@openai/codex@${version}`, ...args], {
    cwd: repositoryRoot,
    maxBuffer: 16 * 1024 * 1024,
  })
}

function parseCodexVersion(output) {
  const match = /codex-cli\s+([^\s]+)/u.exec(output)
  if (!match?.[1]) {
    throw new Error(`Unable to parse Codex version from: ${output.trim()}`)
  }
  return match[1]
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true })
  const paths = []
  for (const entry of entries) {
    const absolutePath = join(current, entry.name)
    if (entry.isDirectory()) {
      paths.push(...await listFiles(root, absolutePath))
    } else if (entry.isFile()) {
      paths.push(relative(root, absolutePath))
    }
  }
  return paths.sort((first, second) => first.localeCompare(second))
}

async function findDrift(expectedRoot, actualRoot) {
  const expectedFiles = await listFiles(expectedRoot)
  const actualFiles = await listFiles(actualRoot)
  const allFiles = new Set([...expectedFiles, ...actualFiles])
  const drift = []

  for (const path of [...allFiles].sort((first, second) => first.localeCompare(second))) {
    if (!expectedFiles.includes(path)) {
      drift.push(`missing committed file: ${path}`)
      continue
    }
    if (!actualFiles.includes(path)) {
      drift.push(`obsolete committed file: ${path}`)
      continue
    }
    const [expected, actual] = await Promise.all([
      readComparableFile(join(expectedRoot, path), path),
      readComparableFile(join(actualRoot, path), path),
    ])
    if (!expected.equals(actual)) {
      drift.push(`changed file: ${path}`)
    }
  }

  return drift
}

function sortJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry))
  }
  if (value === null || typeof value !== 'object') {
    return value
  }
  return Object.fromEntries(
    Object.entries(value)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([key, entry]) => [key, sortJsonValue(entry)]),
  )
}

async function readComparableFile(path, relativePath) {
  const content = await readFile(path)
  if (!relativePath.endsWith('.json')) return content
  return Buffer.from(JSON.stringify(sortJsonValue(JSON.parse(content.toString('utf8')))))
}

async function generateSchemas(outputRoot) {
  const versionResult = await runCodex(packageVersion, ['--version'])
  const codexVersion = parseCodexVersion(`${versionResult.stdout}\n${versionResult.stderr}`)
  const typescriptRoot = join(outputRoot, 'typescript')
  const jsonRoot = join(outputRoot, 'json')

  await Promise.all([
    runCodex(codexVersion, ['app-server', 'generate-ts', '--experimental', '--out', typescriptRoot]),
    runCodex(codexVersion, ['app-server', 'generate-json-schema', '--experimental', '--out', jsonRoot]),
  ])

  await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify({
    package: '@openai/codex',
    version: codexVersion,
    experimental: true,
  }, null, 2)}\n`, 'utf8')
  await writeFile(join(outputRoot, 'README.md'), `# Codex app-server schemas\n\nThese files are generated from \`@openai/codex@${codexVersion}\` with the experimental API enabled. Do not edit generated bindings by hand.\n\n- Refresh: \`pnpm run schema:sync\`\n- Verify the committed schema matches the current npm \`latest\`: \`pnpm run schema:check\`\n`, 'utf8')
  return codexVersion
}

const temporaryRoot = await mkdtemp(join(tmpdir(), 'codexapp-app-server-schemas-'))
try {
  const generatedRoot = join(temporaryRoot, 'app-server-schemas')
  const codexVersion = await generateSchemas(generatedRoot)

  if (checkOnly) {
    const drift = await findDrift(generatedRoot, schemaRoot)
    if (drift.length > 0) {
      console.error(`Codex app-server schema drift detected for @openai/codex@${codexVersion}:`)
      for (const entry of drift.slice(0, 80)) {
        console.error(`- ${entry}`)
      }
      if (drift.length > 80) {
        console.error(`- ... ${drift.length - 80} more differences`)
      }
      process.exitCode = 1
    } else {
      console.log(`Codex app-server schemas match @openai/codex@${codexVersion}.`)
    }
  } else {
    await rm(schemaRoot, { recursive: true, force: true })
    await cp(generatedRoot, schemaRoot, { recursive: true })
    console.log(`Updated Codex app-server schemas to @openai/codex@${codexVersion}.`)
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true })
}
