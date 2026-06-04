'use client'

import Link from 'next/link'

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
          width: '240px',
          background: '#111827',
          color: '#fff',
          padding: '20px'
        }}
      >

        <h2>Asia Infra ERP</h2>

        <hr />

        <div style={{ marginTop: '20px' }}>

          <p>
            <Link href="/asia-infra">
              Dashboard
            </Link>
          </p>

          <p>
            <Link href="/asia-infra/projects">
              Projects
            </Link>
          </p>

          <p>
            <Link href="/asia-infra/expenses">
              Expenses
            </Link>
          </p>

          <p>
            <Link href="/asia-infra/invoices">
              Invoices
            </Link>
          </p>

          <p>
            <Link href="/asia-infra/collections">
              Collections
            </Link>
          </p>

          <p>
            <Link href="/asia-infra/investors">
              Investors
            </Link>
          </p>

          <p>
            <Link href="/asia-infra/loans">
              Loans
            </Link>
          </p>

          <p>
            <Link href="/asia-infra/reports">
              Reports
            </Link>
          </p>
<p>
        <Link href="/asia-infra/parties">
  Parties
</Link>
           </p>

        </div>

      </aside>

      <main
        style={{
          flex: 1,
          padding: '30px'
        }}
      >
        {children}
      </main>

    </div>
  )
}
