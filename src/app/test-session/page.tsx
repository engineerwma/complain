// app/test-session/page.tsx
"use client"

import { useSession } from "next-auth/react"

export default function TestSession() {
  const { data: session, status } = useSession()

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Session Test Page</h1>
      <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ccc' }}>
        <h2>Session Status: {status}</h2>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>
      <div style={{ margin: '20px 0' }}>
        <a href="/api/auth/session" style={{ color: 'blue' }}>
          Check Session API Directly
        </a>
      </div>
    </div>
  )
}