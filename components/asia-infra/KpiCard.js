'use client'

export default function KpiCard({
  title,
  value,
  color = '#2563eb'
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderLeft: `5px solid ${color}`,
        borderRadius: '10px',
        padding: '16px',
        boxShadow:
          '0 1px 3px rgba(0,0,0,0.08)'
      }}
    >
      <div
        style={{
          fontSize: '13px',
          color: '#6b7280',
          marginBottom: '8px'
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: '24px',
          fontWeight: '700'
        }}
      >
        {value}
      </div>
    </div>
  )
}
