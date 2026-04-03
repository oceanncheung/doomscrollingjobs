'use client'

import { useLayoutEffect, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'doom-jobs-marquee-dismissed'
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function notifyDismissedChange() {
  for (const listener of listeners) {
    listener()
  }
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function setMarqueeOpen(open: boolean) {
  document.documentElement.classList.toggle('jobs-marquee-open', open)
}

export function JobsMarqueeBanner() {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => false)

  useLayoutEffect(() => {
    return () => {
      setMarqueeOpen(false)
    }
  }, [])

  useLayoutEffect(() => {
    setMarqueeOpen(!dismissed)
  }, [dismissed])

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    notifyDismissedChange()
  }

  if (dismissed) {
    return null
  }

  return (
    <div className="jobs-marquee-banner">
      <div className="jobs-marquee-inner">
        <div className="jobs-marquee-track">
          <span className="jobs-marquee-segment">scfgc gayau! :3</span>
          <span aria-hidden className="jobs-marquee-segment">
            scfgc gayau! :3
          </span>
        </div>
      </div>
      <button
        aria-label="Close banner"
        className="jobs-marquee-close"
        onClick={close}
        type="button"
      >
        ×
      </button>
    </div>
  )
}
