import 'server-only'

import { execFile as execFileCallback } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import { promisify } from 'node:util'

import { PDFParse } from 'pdf-parse'

const execFile = promisify(execFileCallback)

const MAX_EXTRACTED_TEXT_LENGTH = 80_000

function normalizeExtractedText(value: string) {
  return value
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_EXTRACTED_TEXT_LENGTH)
}

async function extractPdfText(file: File) {
  const parser = new PDFParse({ data: Buffer.from(await file.arrayBuffer()) })

  try {
    const result = await parser.getText()
    return normalizeExtractedText(result.text)
  } finally {
    await parser.destroy()
  }
}

async function extractPlainText(file: File) {
  return normalizeExtractedText(Buffer.from(await file.arrayBuffer()).toString('utf8'))
}

async function extractWithTextutil(file: File) {
  const suffix = extname(file.name) || '.txt'
  const tempDirectory = await mkdtemp(join(tmpdir(), 'profile-source-'))
  const filePath = join(tempDirectory, `document${suffix}`)

  try {
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()))

    const { stdout } = await execFile('/usr/bin/textutil', ['-convert', 'txt', '-stdout', filePath], {
      maxBuffer: 12 * 1024 * 1024,
    })

    return normalizeExtractedText(stdout)
  } finally {
    await rm(tempDirectory, { force: true, recursive: true })
  }
}

export async function extractUploadedDocumentText(file: File) {
  const extension = extname(file.name).toLowerCase()

  if (extension === '.md' || extension === '.markdown' || extension === '.txt') {
    return extractPlainText(file)
  }

  if (extension === '.pdf') {
    return extractPdfText(file)
  }

  if (extension === '.doc' || extension === '.docx') {
    return extractWithTextutil(file)
  }

  throw new Error(`${file.name} is not a supported document type. Use MD, PDF, DOC, or DOCX.`)
}
