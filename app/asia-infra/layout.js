'use client'

import Link from 'next/link'
const navStyle = {
  color: '#e2e8f0',
  textDecoration: 'none',
  padding: '12px 14px',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.03)',
  transition: '0.2s'
}
export default function AsiaInfraLayout({
  children
}) {

  return (

    <div
      style={{
        display: 'flex',
        minHeight: '100vh'
      }}
    >

      <aside
  style={{
    width: '260px',
    background:
      'linear-gradient(180deg,#0f172a,#1e293b)',
    color: '#fff',
    padding: '24px',
    boxShadow:
      '4px 0 15px rgba(0,0,0,0.15)'
  }}
>

  <h2
    style={{
      margin: 0,
      fontSize: '24px',
      fontWeight: '700'
    }}
  >
    🏗️ Asia Infra
  </h2>

  <div
    style={{
      color: '#94a3b8',
      fontSize: '13px',
      marginTop: '4px',
      marginBottom: '25px'
    }}
  >
    ERP & Project Accounts
  </div>

  <div
    style={{
      borderTop:
        '1px solid rgba(255,255,255,0.1)',
      marginBottom: '20px'
    }}
  />

  <nav
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}
  >

    <Link
      href="/asia-infra"
      style={navStyle}
    >
       Dashboard
    </Link>

    <Link
      href="/asia-infra/projects"
      style={navStyle}
    >
       Projects
    </Link>

    <Link
      href="/asia-infra/expenses"
      style={navStyle}
    >
      Expenses
    </Link>

    <Link
      href="/asia-infra/invoices"
      style={navStyle}
    >
       Invoices
    </Link>

    <Link
      href="/asia-infra/collections"
      style={navStyle}
    >
       Collections
    </Link>

    <Link
      href="/asia-infra/parties"
      style={navStyle}
    >
       Parties
    </Link>

    <Link
      href="/asia-infra/investors"
      style={navStyle}
    >
       Investors
    </Link>

    <Link
      href="/asia-infra/loans"
      style={navStyle}
    >
       Loans
    </Link>

    <Link
      href="/asia-infra/reports"
      style={navStyle}
    >
      Reports
    </Link>

  </nav>

</aside>

      <main
        style={{
          flex: 1,
          padding: '30px',
background: '#f8fafc'
        }}
      >
        {children}
      </main>

    </div>
  )
}
