export default function AsiaInfraDashboard() {

  return (

    <div>

      <h1>
        Asia Infra Dashboard
      </h1>

      <br />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(3, 1fr)',
          gap: '20px'
        }}
      >

        <div className="card">
          Total WO Value
        </div>

        <div className="card">
          Total Expenses
        </div>

        <div className="card">
          Total Collections
        </div>

      </div>

    </div>

  )
}
