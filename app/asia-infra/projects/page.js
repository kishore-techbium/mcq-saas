'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
        <h1>Projects</h1>

        <Link href="/asia-infra/projects/new">
          <button>
            + New Project
          </button>
        </Link>

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

                <span
                  style={{
                    background:
                      project.status === 'active'
                        ? '#dcfce7'
                        : '#e5e7eb',
                    padding:
                      '4px 8px',
                    borderRadius:
                      '6px'
                  }}
                >
                  {project.status}
                </span>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )
}
