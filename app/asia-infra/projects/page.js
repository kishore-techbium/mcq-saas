'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { supabase } from '../../../lib/supabase'

export default function ProjectsPage() {

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadProjects() {

    const { data, error } = await supabase
      .from('ai_project')
      .select('*')
      .order('project_name')

    if (!error) {
      setProjects(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  const totalWOValue =
    projects.reduce(
      (sum, project) =>
        sum +
        Number(
          project.work_order_value || 0
        ),
      0
    )

  const activeProjects =
    projects.filter(
      project =>
        project.status === 'active'
    ).length
const semiClosedProjects =
  projects.filter(
    project =>
      project.status === 'semi_closed'
  ).length

const closedProjects =
  projects.filter(
    project =>
      project.status === 'closed'
  ).length

function exportProjects() {

  const data =
    projects.map(project => ({

      Project:
        project.project_name,

      Client:
        project.client_name,

      WO_No:
        project.work_order_number,

WO_Date:
  project.work_order_date
    ? new Date(
        project.work_order_date
      ).toLocaleDateString('en-IN')
    : '',

      WO_Value:
        project.work_order_value,

Status:
  project.status === 'active'
    ? 'Active'
    : project.status === 'semi_closed'
    ? 'Semi Closed'
    : 'Closed'

    }))
data.push({

  Project: 'TOTAL',

  Client: '',

  WO_No: '',

  WO_Date: '',

  WO_Value: totalWOValue,

  Status: ''

})
  const ws =
    XLSX.utils.json_to_sheet(data)

  const wb =
    XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    'Projects'
  )

  XLSX.writeFile(
    wb,
    'AsiaInfraProjects.xlsx'
  )
}
  return (

    <div>

    <div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  }}
>

  <h1>
    Projects
  </h1>

  <div>

    <button
      onClick={exportProjects}
      style={{
        marginRight:'10px',
        background:'#16a34a',
        color:'#fff',
        border:'none',
        padding:'8px 14px',
        borderRadius:'6px',
        cursor:'pointer'
      }}
    >
      Download Excel
    </button>

    <Link href="/asia-infra/projects/new">

      <button>
        + New Project
      </button>

    </Link>

  </div>

</div>

      <div
        style={{
          background: '#eff6ff',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}
      >

        <h3
          style={{
            margin: 0
          }}
        >
          Total Work Order Value
        </h3>

        <h2
          style={{
            marginTop: '10px',
            marginBottom: '10px'
          }}
        >
          ₹
          {totalWOValue.toLocaleString(
            'en-IN'
          )}
        </h2>

        <div>
          Total Projects:
          {' '}
          {projects.length}
        </div>

   <div>
  Active Projects:
  {' '}
  {activeProjects}
</div>

<div>
  Semi Closed:
  {' '}
  {semiClosedProjects}
</div>

<div>
  Closed Projects:
  {' '}
  {closedProjects}
</div>

      </div>

      <table
        border="1"
        cellPadding="10"
        width="100%"
      >

        <thead>

          <tr>

            <th>
              Project
            </th>

            <th>
              Client
            </th>

            <th>
              WO No
            </th>

            <th>
              WO Date
            </th>

            <th>
              WO Value
            </th>

            <th>
              Status
            </th>

          </tr>

        </thead>

        <tbody>

          {projects.map(project => (

            <tr key={project.id}>

              <td>

                <Link
                  href={`/asia-infra/projects/${project.id}`}
                  style={{
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  {project.project_name}
                </Link>

              </td>

              <td>
                {project.client_name}
              </td>

              <td>
                {project.work_order_number || '-'}
              </td>

              <td>
                {
                  project.work_order_date
                    ? new Date(
                        project.work_order_date
                      ).toLocaleDateString(
                        'en-IN'
                      )
                    : '-'
                }
              </td>

              <td>

                ₹

                {Number(
                  project.work_order_value || 0
                ).toLocaleString(
                  'en-IN'
                )}

              </td>

            <td>

  {project.status === 'active'
    ? '🟢 Active'
    : project.status === 'semi_closed'
    ? '🟡 Semi Closed'
    : '⚫ Closed'}

</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )
}
