'use client'

import type { KeyboardEvent } from 'react'
import { useId, useRef, useState } from 'react'

interface TagInputProps {
  helper?: string
  label: string
  onChange: (tags: string[]) => void
  placeholder?: string
  preserveCase?: boolean
  suggestions?: string[]
  tags: string[]
}

export function TagInput({
  helper,
  label,
  onChange,
  placeholder,
  preserveCase = false,
  suggestions,
  tags,
}: TagInputProps) {
  const [input, setInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsId = useId()
  const availableSuggestions =
    suggestions?.filter(
      (suggestion, index, values) =>
        suggestion.trim().length > 0 &&
        values.findIndex((value) => value.toLowerCase() === suggestion.toLowerCase()) === index &&
        !tags.some((tag) => tag.toLowerCase() === suggestion.toLowerCase()),
    ) ?? []

  function commitTag(rawValue: string) {
    const raw = rawValue.trim()

    if (!raw) {
      return false
    }

    const exactSuggestion = availableSuggestions.find(
      (suggestion) => suggestion.toLowerCase() === raw.toLowerCase(),
    )
    const nextTag = exactSuggestion ?? (preserveCase ? raw : raw.toLowerCase())
    const duplicate = tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())

    if (!duplicate) {
      onChange([...tags, nextTag])
    }

    setInput('')

    return !duplicate
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && !input.trim()) {
      setIsEditing(false)
      return
    }

    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      commitTag(input)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  function removeTag(i: number) {
    onChange(tags.filter((_, idx) => idx !== i))
  }

  function beginEditing() {
    setIsEditing(true)

    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  return (
    <div className="field tag-input-field">
      <span>{label}</span>
      <div className="tag-input-container">
        {tags.length > 0 ? (
          <div className="tag-list">
            {tags.map((tag, i) => (
              <button
                aria-label={`Remove ${tag}`}
                className="tag-chip"
                key={`${i}-${tag}`}
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
        ) : null}
        {isEditing || input ? (
          <input
            className="tag-input"
            onBlur={() => {
              if (!input.trim()) {
                setIsEditing(false)
                return
              }

              const exactSuggestion = availableSuggestions.find(
                (suggestion) => suggestion.toLowerCase() === input.trim().toLowerCase(),
              )

              if (exactSuggestion) {
                commitTag(exactSuggestion)
                setIsEditing(false)
              }
            }}
            list={availableSuggestions.length > 0 ? suggestionsId : undefined}
            onChange={(e) => {
              const nextValue = e.target.value
              setInput(nextValue)

              const exactSuggestion = availableSuggestions.find(
                (suggestion) => suggestion.toLowerCase() === nextValue.trim().toLowerCase(),
              )

              if (exactSuggestion) {
                commitTag(exactSuggestion)
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? 'Type and press Enter'}
            ref={inputRef}
            type="text"
            value={input}
          />
        ) : (
          <button
            aria-label={`Add ${label.toLowerCase()}`}
            className="tag-add-trigger"
            onClick={beginEditing}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="tag-add-icon"
              fill="none"
              height="14"
              viewBox="0 0 14 14"
              width="14"
            >
              <path d="M7 3V11" stroke="currentColor" strokeLinecap="square" strokeWidth="1.2" />
              <path d="M3 7H11" stroke="currentColor" strokeLinecap="square" strokeWidth="1.2" />
            </svg>
          </button>
        )}
        {availableSuggestions.length > 0 ? (
          <datalist id={suggestionsId}>
            {availableSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        ) : null}
      </div>
      {helper ? <small>{helper}</small> : null}
    </div>
  )
}
