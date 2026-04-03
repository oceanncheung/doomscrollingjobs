'use client'

import { useRef } from 'react'

interface FileUploadSlotProps {
  accept?: string
  fileName?: string | null
  label: string
  onRemove: () => void
  onUpload: (file: File) => void
}

export function FileUploadSlot({
  accept = '.pdf',
  fileName,
  label,
  onRemove,
  onUpload,
}: FileUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="upload-slot">
      <span className="upload-slot-label">{label}</span>
      {fileName ? (
        <div className="upload-slot-file">
          <span className="upload-slot-filename">{fileName}</span>
          <div className="upload-slot-actions">
            <button className="button" onClick={() => inputRef.current?.click()} type="button">
              Replace
            </button>
            <button className="button button-ghost" onClick={onRemove} type="button">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button className="upload-slot-empty" onClick={() => inputRef.current?.click()} type="button">
          Upload {label.toLowerCase()}
        </button>
      )}
      <input
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) {
            onUpload(f)
          }
          e.target.value = ''
        }}
        ref={inputRef}
        type="file"
      />
    </div>
  )
}
