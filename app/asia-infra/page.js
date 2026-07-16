'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AsiaInfraDashboard() {

  const [projects, setProjects] = useState([])
  const [cashflow, setCashflow] = useState([])
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
const { data: cashflowData } =
await supabase
.from('ai_project_cashflow')
.select('*')
.order('transaction_date')

setCashflow(cashflowData || [])
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

function getPeakCapital(projectId){

    const rows =
        cashflow
        .filter(
            row =>
            row.project_id === projectId
        )

    let running = 0

    let peak = 0

    rows.forEach(row=>{

        if(
            row.transaction_type === 'Expense'
        ){

            running += Number(row.amount)

        }else{

            running -= Number(row.amount)

        }

        if(running > peak){

            peak = running

        }

    })

    return Math.max(peak,0)

}
function getCurrentCapitalBlocked(project){

  return Math.max(

    Number(
      project.expenses || 0
    )

    -

    Number(
      project.collections || 0
    ),

    0

  )

}
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

  <div
    style={{
      maxWidth:'1700px',
      margin:'0 auto',
      padding:'20px'
    }}
  >

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

          onChange={e => {

  setStatusFilter(
    e.target.value
  )

  setClientFilter(
    'all'
  )

  setProjectFilter(
    'all'
  )

}}
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

       onChange={e => {

  setClientFilter(
    e.target.value
  )

  setProjectFilter(
    'all'
  )

}}
            
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
  projects
    .filter(project => {

      if (
        statusFilter !== 'all' &&
        project.status !== statusFilter
      ) {
        return false
      }

      if (
        clientFilter !== 'all' &&
        project.client_name !== clientFilter
      ) {
        return false
      }

      return true

    })
    .map((project,index) => (

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
'repeat(auto-fit,minmax(220px,1fr))',

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
<br />

<h2>

Running Projects (

{

filteredProjects.filter(

project =>

project.status !== 'closed'

).length

}

)

</h2>
<table
  border="1"
  cellPadding="10"
  width="100%"
>

<thead
style={{
position:'sticky',
top:0,
background:'#f8fafc'
}}
>

<tr>

<th>Project</th>

<th>Client</th>

<th>WO Value</th>

<th>Gross Invoiced</th>

<th>Collections</th>

<th>Outstanding</th>

<th>Current Blocked</th>

<th>Peak Blocked</th>

<th>Capital Recycled</th>

</tr>

</thead>

<tbody>

{

filteredProjects

.filter(

project=>

project.status!=='closed'

)

.map((project,index) => (

<tr
key={project.id}
style={{
background:
index % 2 === 0
? '#fff'
: '#f9fafb'
}}
>

<td>

<Link
href={`/asia-infra/projects/${project.id}`}
style={{
textDecoration:'none',
color:'#2563eb',
fontWeight:'600'
}}
>

{project.project_name}

</Link>

</td>

<td>

{project.client_name}

</td>

<td style={{textAlign:'right'}}>

₹{

Number(

project.work_order_value||0

).toLocaleString('en-IN')

}

</td>

<td style={{textAlign:'right'}}>

₹{

Number(

project.gross_invoiced||0

).toLocaleString('en-IN')

}

</td>

<td style={{textAlign:'right'}}>

₹{

Number(

project.collections||0

).toLocaleString('en-IN')

}

</td>

<td style={{textAlign:'right'}}>

₹{

Number(

project.outstanding||0

).toLocaleString('en-IN')

}

</td>

<td
style={{
textAlign:'right',
fontWeight:'bold',
color:
getCurrentCapitalBlocked(project)>0
?
'#ea580c'
:
'#16a34a'
}}
>
₹{

getCurrentCapitalBlocked(

project

).toLocaleString('en-IN')

}

</td>

<td
style={{
textAlign:'right',
fontWeight:'bold'
}}
>

₹{

getPeakCapital(
project.id
).toLocaleString('en-IN')

}

</td>
<td
style={{
textAlign:'center',
fontWeight:'bold'
}}
>

{

getPeakCapital(project.id)>0

?

(

Number(project.collections||0)

/

getPeakCapital(project.id)

).toFixed(2)

:1

}x

</td>

</tr>

))

}

</tbody>

</table>

<br />

<h2>

Closed Projects (

{

filteredProjects.filter(

project =>

project.status === 'closed'

).length

}

)

</h2>

<table
border="1"
cellPadding="10"
width="100%"
>

<thead
style={{
position:'sticky',
top:0,
background:'#f8fafc'
}}
>

<tr>

<th>Project</th>

<th>Client</th>

<th>Basic Revenue</th>

<th>Expenses</th>

<th>Net Profit</th>

<th>Margin %</th>

<th>Capital Recycling</th>

</tr>

</thead>

<tbody>

{

filteredProjects

.filter(

project=>

project.status==='closed'

)

.map((project,index)=>{

const profit=

Number(

project.basic_revenue||0

)

-

Number(

project.expenses||0

)

const margin=

project.basic_revenue>0

?

(

profit/

Number(

project.basic_revenue

)

)*100

:

0

return(

<tr
key={project.id}
style={{
background:
index % 2 === 0
? '#fff'
: '#f9fafb'
}}
>
<td>

<Link
href={`/asia-infra/projects/${project.id}`}
style={{
textDecoration:'none',
color:'#2563eb',
fontWeight:'600'
}}
>

{project.project_name}

</Link>

</td>
<td>

{project.client_name}

</td>

<td style={{textAlign:'right'}}>

₹{

Number(

project.basic_revenue||0

).toLocaleString('en-IN')

}

</td>

<td style={{textAlign:'right'}}>

₹{

Number(

project.expenses||0

).toLocaleString('en-IN')

}

</td>

<td
style={{
color:
profit>=0
?
'green'
:
'red',
fontWeight:'bold',
textAlign:'right'
}}
>

₹{

profit.toLocaleString('en-IN')

}

</td>

<td style={{textAlign:'right'}}>

{

margin.toFixed(2)

}%

</td>

<td
style={{
textAlign:'right',
fontWeight:'bold'
}}
>

₹{

getPeakCapital(
project.id
).toLocaleString('en-IN')

}

</td>

</tr>

)

})

}

</tbody>

</table>
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
