'use client'

import { useActionState } from 'react'

import { subscribe, type FormState } from '@/app/(frontend)/actions'

export function SubscribeForm({ source = 'homepage' }: { source?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, null)

  if (state?.ok) {
    return (
      <p role="status" className="form-msg" style={{ fontSize: 18 }}>
        {state.message}
      </p>
    )
  }

  return (
    <form action={action} className="inline-form">
      <label htmlFor="sub-email" className="sr-only">
        Email address
      </label>
      <input id="sub-email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
      <input type="hidden" name="source" value={source} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: 'none' }} />
      <button className="btn lg" type="submit" disabled={pending}>
        {pending ? 'Subscribing…' : 'Subscribe'}
      </button>
      {state && !state.ok && (
        <p role="alert" className="form-msg error" style={{ flexBasis: '100%' }}>
          {state.message}
        </p>
      )}
    </form>
  )
}
