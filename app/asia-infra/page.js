'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AsiaInfraDashboard() {

  const [projects, setProjects] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [statusFilter,
    setStatusFilter] =
    useState('all')

  const [clientFilter,
    setClientFilter] =
    useState('all')

  const [projectFilter,
    setProjectFilter] =
    useState('all')

  async function loadDashboard() {

    const { data, error } =
      await supabase
        .from(
          'ai_dashboard_project_summary'
        )
        .select('*')
        .order(
          'project_name'
        )

    if (!error) {

      setProjects(data || [])

    }

    setLoading(false)

  }

  useEffect(() => {

    loadDashboard()

  }, [])

  const filteredProjects =
    useMemo(() => {

      return projects.filter(row => {

        if (

          statusFilter !== 'all' &&

          row.status !== statusFilter

        ) {

          return false

        }

        if (

          clientFilter !== 'all' &&

          row.client_name !== clientFilter

        ) {

          return false

        }

        if (

          projectFilter !== 'all' &&

          row.id !== projectFilter

        ) {

          return false

        }

        return true

      })

    }, [

      projects,

      statusFilter,

      clientFilter,

      projectFilter

    ])

  const totalProjects =
    filteredProjects.length

  const totalWO =
    filteredProjects.reduce(

      (sum, row) =>

        sum +

        Number(
          row.work_order_value || 0
        ),

      0

    )

  const totalInvoices =
    filteredProjects.reduce(

      (sum, row) =>

        sum +

        Number(
          row.gross_invoiced || 0
        ),

      0

    )

  const totalCollections =
    filteredProjects.reduce(

      (sum, row) =>

        sum +

        Number(
          row.collections || 0
        ),

      0

    )

  const totalOutstanding =
    filteredProjects.reduce(

      (sum, row) =>

        sum +

        Number(
          row.outstanding || 0
        ),

      0

    )

  const currentCapitalBlocked =
    filteredProjects.reduce(

      (sum, row) =>

        sum +

        Math.max(

          Number(
            row.expenses || 0
          ) -

          Number(
            row.collections || 0
          ),

          0

        ),

      0

    )

  const clients =

    [...new Set(

      projects.map(

        x => x.client_name

      )

    )].sort()

  if (loading) {

    return <div>

      Loading...

    </div>

  }

  return (

    <div>

      <h1>

        Asia Infra Dashboard

      </h1>

      <br />

      <div
        style={{
          display:'grid',
          gridTemplateColumns:
            'repeat(4,1fr)',
          gap:'15px',
          marginBottom:'25px'
        }}
      >

        <div>

          <label>

            Status

          </label>

          <br />

          <select

            value={
              statusFilter
            }

            onChange={e =>

              setStatusFilter(

                e.target.value

              )

            }

          >

            <option value="all">

              All

            </option>

            <option value="active">

              Active

            </option>

            <option value="semi_closed">

              Semi Closed

            </option>

            <option value="closed">

              Closed

            </option>

          </select>

        </div>

        <div>

          <label>

            Client

          </label>

          <br />

          <select

            value={
              clientFilter
            }

            onChange={e =>

              setClientFilter(

                e.target.value

              )

            }

          >

            <option value="all">

              All

            </option>

            {

              clients.map(client => (

                <option

                  key={client}

                  value={client}

                >

                  {client}

                </option>

              ))

            }

          </select>

        </div>

        <div>

          <label>

            Project

          </label>

          <br />

          <select

            value={
              projectFilter
            }

            onChange={e =>

              setProjectFilter(

                e.target.value

              )

            }

          >

            <option value="all">

              All

            </option>

            {

              projects.map(project => (

                <option

                  key={project.id}

                  value={project.id}

                >

                  {project.project_name}

                </option>

              ))

            }

          </select>

        </div>

        <div>

          <label>

            Financial Year

          </label>

          <br />

          <select>

            <option>

              All

            </option>

          </select>

        </div>

      </div>

      <div

        style={{

          display:'grid',

          gridTemplateColumns:

            'repeat(6,1fr)',

          gap:'15px'

        }}

      >

        <Card

          title="Projects"

          value={

            totalProjects

          }

        />

        <Card

          title="WO Value"

          value={

            '₹'+

            totalWO.toLocaleString(

              'en-IN'

            )

          }

        />

        <Card

          title="Gross Invoiced"

          value={

            '₹'+

            totalInvoices.toLocaleString(

              'en-IN'

            )

          }

        />

        <Card

          title="Collections"

          value={

            '₹'+

            totalCollections.toLocaleString(

              'en-IN'

            )

          }

        />

        <Card

          title="Outstanding"

          value={

            '₹'+

            totalOutstanding.toLocaleString(

              'en-IN'

            )

          }

        />

        <Card

          title="Current Capital Blocked"

          value={

            '₹'+

            currentCapitalBlocked.toLocaleString(

              'en-IN'

            )

          }

        />

      </div>

    </div>

  )

}

function Card({

  title,

  value

}) {

  return (

    <div

      style={{

        border:'1px solid #ddd',

        borderRadius:'8px',

        padding:'15px',

        background:'#fff'

      }}

    >

      <div

        style={{

          color:'#666',

          fontSize:'14px'

        }}

      >

        {title}

      </div>

      <h2>

        {value}

      </h2>

    </div>

  )

}
