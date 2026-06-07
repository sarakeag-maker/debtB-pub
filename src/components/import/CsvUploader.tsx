'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import type { ImportResult } from '@/types'

interface CsvUploaderProps {
  onImportComplete: (result: ImportResult) => void
}

export function CsvUploader({ onImportComplete }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.name.endsWith('.csv')) {
      setFile(dropped)
      setError(null)
    } else {
      setError('Please upload a .csv file.')
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setError(null)
    }
  }

  function handleClear() {
    setFile(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Import failed')
      }

      const result: ImportResult = await res.json()
      onImportComplete(result)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert type="error" message={error} dismissible onDismiss={() => setError(null)} />
      )}

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg px-8 py-12 text-center transition-colors',
          dragging
            ? 'border-[#1e3a5f] bg-blue-50'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-white hover:border-gray-400 cursor-pointer'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Select CSV file"
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileText className="w-10 h-10 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Drag and drop your CSV file here
              </p>
              <p className="text-xs text-gray-400 mt-1">
                or click to browse — .csv files only
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload button */}
      {file && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleUpload}
            loading={loading}
            disabled={loading}
          >
            <Upload className="w-4 h-4" />
            Upload and Import
          </Button>
        </div>
      )}
    </div>
  )
}
