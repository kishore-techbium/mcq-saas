'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
getCurrentCapitalBlocked,
getPeakCapital,
getCapitalRecycling,
getInvoiceTotal,
getCollectionTotal,
getExpenseTotal
} from '../../lib/ai_cashflow'
export default function AsiaInfraDashboard() {

  const [projects, setProjects] = useState([])
  const [transactions,setTransactions]=useState([])
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
  const [periodFilter,setPeriodFilter]=useState('overall')

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
const {
  data: transactionData,
  count,
  error
} = await supabase
  .from("ai_dashboard_transactions")
  .select("*", { count: "exact" })
  .order("transaction_date")
  .range(0, 9999)

console.log("Error:", error)
console.log("Count:", count)
console.log("Returned:", transactionData?.length)

setTransactions(transactionData || [])
    if (!error) {

      setProjects(data || [])

    }

    setLoading(false)

  }

  useEffect(() => {

    loadDashboard()

  }, [])

function getFinancialYear(date){

const d=new Date(date)

const y=d.getFullYear()

const m=d.getMonth()+1

return m>=4
?`${y}-${String(y+1).slice(-2)}`
:`${y-1}-${String(y).slice(-2)}`

}
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
const filteredTransactions=
transactions.filter(t=>{

if(periodFilter==='overall')
return true

return getFinancialYear(
t.transaction_date
)===periodFilter

})

const transactionSummary = useMemo(() => {

const summary = {}

filteredTransactions.forEach(t => {

if(!summary[t.project_id]){

summary[t.project_id]={
invoice:0,
collection:0,
expense:0
}

}

if(t.transaction_type==='Invoice')
summary[t.project_id].invoice+=Number(t.amount||0)

if(t.transaction_type==='Collection')
summary[t.project_id].collection+=Number(t.amount||0)

if(t.transaction_type==='Expense')
summary[t.project_id].expense+=Number(t.amount||0)

})

return summary

},[filteredTransactions])


  
const activeProjectIds = new Set(
filteredTransactions.map(t=>t.project_id)
)

console.log("Period:", periodFilter)

console.log(
"KTIPL in activeProjectIds:",
activeProjectIds.has("a744a2ba-bf16-4cf5-8f77-829ba9cf82f9")
)

console.log(
filteredTransactions.filter(
t=>t.project_id==="a744a2ba-bf16-4cf5-8f77-829ba9cf82f9"
)
)

const runningProjects =
filteredProjects.filter(project=>
project.status!=='closed' &&
activeProjectIds.has(project.id)
)
console.log(
"KTIPL Project",
filteredProjects.find(
p => p.project_name === "KTIPL FOB painting"
)
)

console.log(
"KTIPL Running",
runningProjects.find(
p => p.project_name === "KTIPL FOB painting"
)
)

console.log(
"Active IDs",
Array.from(activeProjectIds)
)

const closedProjects =
filteredProjects.filter(project=>
project.status==='closed' &&
activeProjectIds.has(project.id)
)
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

  const totalInvoices=
  getInvoiceTotal(filteredTransactions)
  const totalCollections=
  getCollectionTotal(filteredTransactions)
  const totalExpenses=
  getExpenseTotal(filteredTransactions)
  const totalOutstanding=
  Object.values(transactionSummary).reduce(
  (sum,row)=>
  sum+
  Math.max(
  row.invoice-row.collection,
  0
  ),
  0
  )

  const currentCapitalBlocked=
Object.values(transactionSummary).reduce(
(sum,row)=>
sum+
Math.max(
row.expense-row.collection,
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
const totalClients=clients.length
const periods=[
...new Set(
transactions.map(
t=>getFinancialYear(t.transaction_date)
)
)
].sort().reverse()

periods.unshift('overall')
  
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

Period

</label>

<br />
<select
value={periodFilter}
onChange={e=>setPeriodFilter(e.target.value)}
>

{
periods.map(period=>(

<option
key={period}
value={period}
>

{
period==='overall'
?
'Overall'
:
`FY ${period}`
}

</option>

))
}

</select>

        </div>

      </div>

  
<h2
style={{
marginTop:'20px',
marginBottom:'15px'
}}
>
Company Snapshot
</h2>
  
 <div
style={{
display:'grid',
gridTemplateColumns:'repeat(3,1fr)',
gap:'15px',
marginBottom:'25px'
}}
>

<Card
title="Total Projects"
value={projects.length}
color="#2563eb"
/>

<Card
title="Clients"
value={totalClients}
color="#0f766e"
/>

<Card
title="Total WO Value"
value={'₹'+totalWO.toLocaleString('en-IN')}
color="#7c3aed"
/>

</div>
<h2
style={{
marginBottom:'15px'
}}
>

Performance

{

periodFilter==='overall'

?

' (Overall)'

:

` (FY ${periodFilter})`

}

</h2>

<div
style={{
display:'grid',
gridTemplateColumns:'repeat(5,1fr)',
gap:'15px',
marginBottom:'30px'
}}
>

<Card
title="Invoice Value"
value={'₹'+totalInvoices.toLocaleString('en-IN')}
color="#0891b2"
/>

<Card
title="Collections"
value={'₹'+totalCollections.toLocaleString('en-IN')}
color="#16a34a"
/>

<Card
title="Expenses"
value={'₹'+totalExpenses.toLocaleString('en-IN')}
color="#dc2626"
/>

<Card
title="Outstanding"
value={'₹'+totalOutstanding.toLocaleString('en-IN')}
color="#ea580c"
/>

<Card
title="Capital Blocked"
value={'₹'+currentCapitalBlocked.toLocaleString('en-IN')}
color="#7c2d12"
/>

</div>
<br />

<h2>

Running Projects (

{

runningProjects.length

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
background:'#1e293b',
color:'#fff'
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

runningProjects.map((project,index) => (

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
target="_blank"
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

<div>

<div>

{project.client_name}

</div>

<div
style={{
marginTop:'4px'
}}
>

<span
style={{
padding:'3px 8px',
borderRadius:'20px',
fontSize:'12px',
fontWeight:'600',
background:
project.status==='active'
?'#dcfce7'
:
project.status==='semi_closed'
?'#fef3c7'
:'#fee2e2',
color:
project.status==='active'
?'#166534'
:
project.status==='semi_closed'
?'#92400e'
:'#991b1b'
}}
>

{project.status.replace('_',' ')}

</span>

</div>

</div>

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

transactionSummary[project.id]?.invoice||0

).toLocaleString('en-IN')

}

</td>

<td style={{textAlign:'right'}}>

₹{

Number(

transactionSummary[project.id]?.collection||0

).toLocaleString('en-IN')

}

</td>

<td style={{textAlign:'right'}}>

₹{

Number(

Math.max(
(transactionSummary[project.id]?.invoice||0)
-
(transactionSummary[project.id]?.collection||0),
0
)

).toLocaleString('en-IN')

}

</td>

<td
style={{
textAlign:'right',
fontWeight:'bold',
color:
Math.max(
(transactionSummary[project.id]?.expense||0)
-
(transactionSummary[project.id]?.collection||0),
0
)>0
?
'#ea580c'
:
'#16a34a'
}}
>
₹{
Math.max(
(transactionSummary[project.id]?.expense||0)
-
(transactionSummary[project.id]?.collection||0),
0
).toLocaleString('en-IN')

}

</td>

<td
style={{
textAlign:'right',
fontWeight:'bold'
}}
>
{
getPeakCapital(project.id,filteredTransactions)>0
?
'₹'+getPeakCapital(project.id,filteredTransactions).toLocaleString('en-IN')
:
'-'
}
</td>
<td
style={{
textAlign:'center',
fontWeight:'bold'
}}
>
{
getPeakCapital(project.id,filteredTransactions)>0
?
getCapitalRecycling(project,filteredTransactions).toFixed(2)+'x'
:
'-'
}

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

closedProjects.length

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
background:'#1e293b',
color:'#fff'
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

closedProjects.map((project,index)=>{

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
target="_blank"
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
'#15803d'
:
'#dc2626',
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
textAlign:'center',
fontWeight:'bold'
}}
>
{
getPeakCapital(project.id,transactions)>0
?
getCapitalRecycling(project,transactions).toFixed(2)+'x'
:
'-'
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
value,
color='#2563eb'
}){

return(

<div
style={{
background:'#fff',
borderLeft:`6px solid ${color}`,
borderRadius:'10px',
padding:'18px',
boxShadow:'0 2px 8px rgba(0,0,0,0.08)'
}}
>

<div
style={{
fontSize:'14px',
color:'#666',
marginBottom:'8px'
}}
>

{title}

</div>

<div
style={{
fontSize:'28px',
fontWeight:'700',
color
}}
>

{value}

</div>

</div>

)

}
