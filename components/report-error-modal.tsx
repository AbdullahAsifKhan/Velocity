'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flag, AlertTriangle, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReportErrorModalProps {
  carId: string
  carName: string
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES = [
  { value: 'wrong_specs', label: 'Wrong Specifications', description: 'HP, torque, weight, dimensions, etc.' },
  { value: 'wrong_image', label: 'Wrong Image', description: 'Image shows a different car or model' },
  { value: 'wrong_name', label: 'Wrong Name / Brand', description: 'Car name, brand, or year is incorrect' },
  { value: 'other', label: 'Other Issue', description: 'Any other data quality problem' },
] as const

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function ReportErrorModal({ carId, carName, isOpen, onClose }: ReportErrorModalProps) {
  const [category, setCategory] = useState<string>('')
  const [description, setDescription] = useState('')
  const [evidence, setEvidence] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = useCallback(async () => {
    if (!category || description.length < 10) return
    
    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId, category, description, evidence: evidence || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error || 'Failed to submit report')
        return
      }

      setStatus('success')
      // Auto-close after 2s
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Please try again.')
    }
  }, [carId, category, description, evidence])

  const handleClose = useCallback(() => {
    setCategory('')
    setDescription('')
    setEvidence('')
    setStatus('idle')
    setErrorMessage('')
    onClose()
  }, [onClose])

  const isValid = category && description.length >= 10

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-[10%] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-50"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Flag className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Report an Issue</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{carName}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                {status === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center py-8 text-center"
                  >
                    <div className="p-3 rounded-full bg-green-500/10 mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Report Submitted</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Thank you for helping us improve our data quality.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {/* Category Selection */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        What's wrong?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.value}
                            onClick={() => setCategory(cat.value)}
                            className={cn(
                              'text-left p-3 rounded-xl border transition-all duration-200',
                              category === cat.value
                                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                : 'border-border/60 hover:border-border hover:bg-secondary/30'
                            )}
                          >
                            <span className="text-sm font-medium block">{cat.label}</span>
                            <span className="text-xs text-muted-foreground mt-0.5 block">{cat.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Describe the issue <span className="text-muted-foreground/50">(min 10 chars)</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. The horsepower is listed as 300 but should be 350 according to the official spec sheet..."
                        maxLength={1000}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/60 text-sm resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/40"
                      />
                      <span className="text-xs text-muted-foreground/50 mt-1 block text-right">
                        {description.length}/1000
                      </span>
                    </div>

                    {/* Evidence URL */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Evidence link <span className="text-muted-foreground/50">(optional)</span>
                      </label>
                      <input
                        type="url"
                        value={evidence}
                        onChange={(e) => setEvidence(e.target.value)}
                        placeholder="https://manufacturer.com/specs/..."
                        className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-border/60 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/40"
                      />
                    </div>

                    {/* Error message */}
                    {status === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
                      >
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {errorMessage}
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              {status !== 'success' && (
                <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!isValid || status === 'submitting'}
                    className={cn(
                      'inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all',
                      isValid && status !== 'submitting'
                        ? 'bg-primary text-primary-foreground hover:opacity-90'
                        : 'bg-secondary text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
