import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const projectRoot = process.cwd()
const extensions = ['', '.ts', '.tsx', '.js', '.mjs']
const indexExtensions = ['/index.ts', '/index.tsx', '/index.js', '/index.mjs']

function resolveAliasPath(specifier) {
  const basePath = path.join(projectRoot, specifier.slice(2))
  return resolveWithCandidates(basePath)
}

function resolveWithCandidates(basePath) {
  const candidates = [
    ...extensions.map((extension) => `${basePath}${extension}`),
    ...indexExtensions.map((extension) => `${basePath}${extension}`),
  ]

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === 'server-only') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,export {}',
    }
  }

  if (specifier === 'next/headers') {
    return {
      shortCircuit: true,
      url:
        'data:text/javascript,export async function cookies(){return {get(){return undefined;},getAll(){return [];},has(){return false;}}}',
    }
  }

  if (specifier === 'next/navigation') {
    return {
      shortCircuit: true,
      url:
        'data:text/javascript,export function redirect(path){throw new Error(`redirect:${path}`)}',
    }
  }

  if (specifier.startsWith('@/')) {
    const resolvedPath = resolveAliasPath(specifier)

    if (!resolvedPath) {
      throw new Error(`Could not resolve alias specifier: ${specifier}`)
    }

    return defaultResolve(pathToFileURL(resolvedPath).href, context, defaultResolve)
  }

  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    context.parentURL?.startsWith('file:')
  ) {
    const parentPath = fileURLToPath(context.parentURL)
    const basePath = path.resolve(path.dirname(parentPath), specifier)
    const resolvedPath = resolveWithCandidates(basePath)

    if (resolvedPath) {
      return defaultResolve(pathToFileURL(resolvedPath).href, context, defaultResolve)
    }
  }

  return defaultResolve(specifier, context, defaultResolve)
}
