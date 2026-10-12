import React from 'react'

export const Logo = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
    <span style={{ fontWeight: 800, fontSize: 30, letterSpacing: '-0.02em', color: 'var(--theme-text)' }}>
      GIANTABILITY
    </span>
    <span style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--theme-elevation-500)' }}>
      Media Networks · Admin
    </span>
  </div>
)

export const Icon = () => (
  <span
    aria-hidden="true"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 20,
      height: 20,
      borderRadius: 4,
      background: '#C4321A',
      color: '#FFFFFF',
      fontWeight: 800,
      fontSize: 12,
    }}
  >
    G
  </span>
)
