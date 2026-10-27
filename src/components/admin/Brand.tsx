import React from 'react'

/* eslint-disable @next/next/no-img-element */

/** Login screen logo. Both versions are present; custom.scss shows the one that suits the admin theme. */
export const Logo = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
    <img className="gmn-logo gmn-logo--light" src="/brand/gmn-logo.png" alt="Giantability Media Network" width={150} height={100} />
    <img className="gmn-logo gmn-logo--dark" src="/brand/gmn-logo-white.png" alt="Giantability Media Network" width={150} height={100} />
    <span style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--theme-elevation-500)' }}>
      Admin
    </span>
  </div>
)

/** Small mark in the admin's top bar. */
export const Icon = () => (
  <>
    <img className="gmn-logo gmn-logo--light" src="/brand/gmn-logo.png" alt="GMN" width={36} height={24} />
    <img className="gmn-logo gmn-logo--dark" src="/brand/gmn-logo-white.png" alt="GMN" width={36} height={24} />
  </>
)
