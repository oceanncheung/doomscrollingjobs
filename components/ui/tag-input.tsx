'use client'

import type { KeyboardEvent } from 'react'
import { useState } from 'react'

interface TagInputProps {
  helper?: string
  label: string
  onChange: (tags: string[]) => void
  placeholder?: string
  tags: string[]
}

export function TagInput({ helper, label, onChange, placeholder, tags }: TagInputProps) {
  const [input, setInput] = useState('')

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      const newTag = input.trim().toLowerCase()
      if (!tags.includes(newTag)) {
        onChange([...tags, newTag])
      }
      setInput('')
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  function removeTag(i: number) {
    onChange(tags.filter((_, idx) => idx !== i))
  }

  return (
    <div className="field tag-input-field">
      <span>{label}</span>
      <div className="tag-input-container">
        <div className="tag-list">
          {tags.map((tag, i) => (
            <button
              aria-label={`Remove ${tag}`}
              className="tag-chip"
              key={tag}
              onClick={() => removeTag(i)}
              type="button"
            >
              {tag}
              <span aria-hidden className="tag-chip-x">
                ×
              </span>
            </button>
          ))}
        </div>
        <input
          className="tag-input"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? (placeholder ?? 'Type and press Enter') : ''}
          type="text"
          value={input}
        />
      </div>
      {helper ? <small>{helper}</small> : null}
    </div>
  )
}
