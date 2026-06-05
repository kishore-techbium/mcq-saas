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

  return (
    <div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
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

      <table
        border="1"
        cellPadding="10"
        width="100%"
      >

        <thead>
          <tr>
            <th>Project</th>
            <th>Client</th>
            <th>WO Value</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          {projects.map(project => (

            <tr key={project.id}>

             <td>
  <a
    href={`/asia-infra/projects/${project.id}`}
    style={{
      color: '#2563eb',
      textDecoration: 'none',
      fontWeight: '600'
    }}
  >
    {project.project_name}
  </a>
</td>
              <td>
                {project.client_name}
              </td>

              <td>
                ₹
                {Number(
                  project.work_order_value || 0
                ).toLocaleString('en-IN')}
              </td>

              <td>
                {project.status}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  )
}
