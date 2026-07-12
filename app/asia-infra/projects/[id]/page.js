'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import * as XLSX from 'xlsx'
export default function ProjectDashboard({
  params
}) {

  const [project, setProject] = useState(null)
const [invoiceDetails,
  setInvoiceDetails] =
  useState([])

const [invoices,
  setInvoices] =
  useState([])

  const [expenses, setExpenses] = useState([])
  const [collections, setCollections] = useState([])
  const [expenseTotal, setExpenseTotal] = useState(0)
const [invoiceTotal, setInvoiceTotal] =
  useState(0)

const [collectionTotal, setCollectionTotal] =
  useState(0)

const [outstandingTotal, setOutstandingTotal] =
  useState(0)
const [basicRevenue,
  setBasicRevenue] =
  useState(0)
const [capitalBlocked,
  setCapitalBlocked] =
  useState(0)
const [peakCapitalBlocked,
  setPeakCapitalBlocked] =
  useState(0)
  const [categorySummary, setCategorySummary] =
    useState([])

  async function loadProject() {

    const { data } = await supabase
      .from('ai_project')
      .select('*')
      .eq('id', params.id)
      .single()

    setProject(data)
  }

  async function loadExpenses() {

    const { data } = await supabase
      .from('ai_expense')
      .select(`
        *,
        ai_expense_category(category_name),
        ai_expense_subcategory(subcategory_name)
      `)
      .eq('project_id', params.id)
      .order('expense_date', {
        ascending: false
      })

    const rows = data || []

    setExpenses(rows)

    let total = 0

    const categoryTotals = {}

    rows.forEach(row => {

      total += Number(row.amount || 0)

      const category =
        row.ai_expense_category?.category_name ||
        'Others'

      categoryTotals[category] =
        (categoryTotals[category] || 0) +
        Number(row.amount || 0)

    })

    setExpenseTotal(total)

    setCategorySummary(
      Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount
        }))
        .sort((a, b) =>
          b.amount - a.amount
        )
    )
  }

  async function loadFinancials() {

  const { data: invoicesData } =
    await supabase
      .from('ai_invoice')
      .select('*')
      .eq('project_id', params.id)

  const { data: collectionsData } =
    await supabase
      .from('ai_collection')
      .select('*')
      .eq('project_id', params.id)
setCollections(
  collectionsData || []
)
  setInvoices(
    invoicesData || []
  )

  setCollections(
    collectionsData || []
  )

  const totalInvoices =
    (invoicesData || []).reduce(
      (sum, row) =>
        sum +
        Number(
          row.gross_amount || 0
        ),
      0
    )
const totalBasicRevenue =
  (invoicesData || []).reduce(
    (sum, row) =>
      sum +
      Number(
        row.basic_amount || 0
      ),
    0
  )
  const totalCollections =
    (collectionsData || []).reduce(
      (sum, row) =>
        sum +
        Number(
          row.amount_accounted || 0
        ),
      0
    )

  setInvoiceTotal(
    totalInvoices
  )
setBasicRevenue(
  totalBasicRevenue
)
  setCollectionTotal(
    totalCollections
  )

  setOutstandingTotal(
    totalInvoices -
    totalCollections
  )
setCapitalBlocked(
  Math.max(
    expenseTotal -
    totalCollections,
    0
  )
)
  const invoiceRows =
    (invoicesData || []).map(
      invoice => {

        const collected =
          (collectionsData || [])
            .filter(
              c =>
                c.invoice_id ===
                invoice.id
            )
            .reduce(
              (sum, c) =>
                sum +
                Number(
                  c.amount_accounted || 0
                ),
              0
            )

        return {

          invoice_date:
            invoice.invoice_date,

          invoice_number:
            invoice.invoice_number,

          invoice_value:
            Number(
              invoice.gross_amount || 0
            ),

          collected,

          pending:
            Number(
              invoice.gross_amount || 0
            ) - collected

        }

      }
    )

  setInvoiceDetails(
    invoiceRows
  )
}
function calculatePeakCapitalBlocked() {

  const events = []

  expenses.forEach(exp => {

    events.push({

      date: exp.expense_date,

      type: 'expense',

      amount: Number(exp.amount || 0)

    })

  })

  collections.forEach(col => {

    events.push({

      date: col.received_date,

      type: 'collection',

      amount: Number(col.amount_accounted || 0)

    })

  })

  events.sort((a, b) => {

    if (a.date === b.date) {

      if (
        a.type === 'expense' &&
        b.type === 'collection'
      ) {
        return -1
      }

      if (
        a.type === 'collection' &&
        b.type === 'expense'
      ) {
        return 1
      }

      return 0

    }

    return new Date(a.date) - new Date(b.date)

  })

  let running = 0

  let peak = 0

  events.forEach(event => {

    if (event.type === 'expense') {

      running += event.amount

    } else {

      running -= event.amount

    }

    if (running > peak) {

      peak = running

    }

  })

  setPeakCapitalBlocked(peak)

}

  async function updateStatus(
  newStatus
) {

  const { error } =
    await supabase
      .from('ai_project')
      .update({
        status: newStatus
      })
      .eq(
        'id',
        project.id
      )

  if (error) {
    alert(error.message)
    return
  }

  loadProject()

  alert(
    'Project Status Updated'
  )
}
useEffect(() => {

  loadProject()
  loadExpenses()
  loadFinancials()

}, [])
function exportExpenses() {

  const data =
    expenses.map(row => ({

      Date:
        row.expense_date,

      Category:
        row.ai_expense_category
          ?.category_name,

      SubCategory:
        row.ai_expense_subcategory
          ?.subcategory_name,

      Amount:
        row.amount,

      Remarks:
        row.remarks

    }))

  const ws =
    XLSX.utils.json_to_sheet(data)

  const wb =
    XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    'Expenses'
  )

  XLSX.writeFile(
    wb,
    `${project.project_name}_Expenses.xlsx`
  )
}

function exportInvoices() {

  const ws =
    XLSX.utils.json_to_sheet(
      invoiceDetails
    )

  const wb =
    XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    wb,
    ws,
    'Invoices'
  )

  XLSX.writeFile(
    wb,
    `${project.project_name}_Invoices.xlsx`
  )
}
  useEffect(() => {

  setCapitalBlocked(

    Math.max(

      expenseTotal -
      collectionTotal,

      0

    )

  )

}, [

  expenseTotal,

  collectionTotal

])
useEffect(() => {

  calculatePeakCapitalBlocked()

}, [

  expenses,

  collections

])
useEffect(() => {

  calculatePeakCapital()

}, [

  expenses,

  collections

])
  if (!project) {
    return <div>Loading...</div>
  }
console.log(
  'Peak Capital Blocked',
  peakCapitalBlocked
)
  return (

    <div>

      <h1>
        {project.project_name}
      </h1>
<div
  style={{
    marginBottom:'20px'
  }}
>

  <button
    onClick={exportExpenses}
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
    Download Expenses
  </button>

  <button
    onClick={exportInvoices}
    style={{
      background:'#2563eb',
      color:'#fff',
      border:'none',
      padding:'8px 14px',
      borderRadius:'6px',
      cursor:'pointer'
    }}
  >
    Download Invoice Ledger
  </button>

</div>
      <p>
        Client:
        {' '}
        {project.client_name}
      </p>
<p>
  Status:
  {' '}

  {project.status === 'active'
    ? '🟢 Active'
    : project.status === 'semi_closed'
    ? '🟡 Semi Closed'
    : '⚫ Closed'}
</p>
      <h2>
        WO Value:
        {' '}
        ₹
        {Number(
          project.work_order_value || 0
        ).toLocaleString('en-IN')}
      </h2>

      <br />
<div
  style={{
    marginBottom: '20px'
  }}
>

  <button
    onClick={() =>
      updateStatus(
        'active'
      )
    }
    style={{
      marginRight: '10px'
    }}
  >
    Active
  </button>

  <button
    onClick={() =>
      updateStatus(
        'semi_closed'
      )
    }
    style={{
      marginRight: '10px'
    }}
  >
    Semi Closed
  </button>

  <button
    onClick={() =>
      updateStatus(
        'closed'
      )
    }
  >
    Closed
  </button>

</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(7,1fr)',
          gap: '15px'
        }}
      >

        <div
          style={{
            border:'1px solid #ddd',
            padding:'15px'
          }}
        >
          <h3>Total Expenses</h3>

          <h2>
            ₹
            {expenseTotal
              .toLocaleString('en-IN')}
          </h2>
        </div>

        <div
          style={{
            border:'1px solid #ddd',
            padding:'15px'
          }}
        >
     <h3>Gross Invoiced</h3>

<h2>
  ₹
  {invoiceTotal
    .toLocaleString('en-IN')}
</h2>
        </div>
<div
  style={{
    border:'1px solid #ddd',
    padding:'15px',
    background:'#f0fdf4'
  }}
>
  <h3>Basic Revenue</h3>

  <h2>
    ₹
    {basicRevenue.toLocaleString('en-IN')}
  </h2>

  <div
    style={{
      fontSize:'12px',
      color:'#666'
    }}
  >
    Excluding GST
  </div>

</div>
        <div
          style={{
            border:'1px solid #ddd',
            padding:'15px'
          }}
        >
  <h3>Collections</h3>

<h2>
  ₹
  {collectionTotal
    .toLocaleString('en-IN')}
</h2>
        </div>

        <div
          style={{
            border:'1px solid #ddd',
            padding:'15px'
          }}
        >
    <h3>Outstanding</h3>

<h2>
  ₹
  {outstandingTotal
    .toLocaleString('en-IN')}
</h2>
        </div>
<div
  style={{
    border:'1px solid #ddd',
    padding:'15px',
    background:'#dcfce7'
  }}
>
  <h3>
    Current Capital Blocked
  </h3>

  <h2>
    ₹
    {capitalBlocked.toLocaleString('en-IN')}
  </h2>

  <div
    style={{
      fontSize:'12px',
      color:'#666'
    }}
  >
    Expenses - Collections
  </div>

</div>

<div
  style={{
    border:'1px solid #ddd',
    padding:'15px',
    background:'#dbeafe'
  }}
>
  <h3>
    Peak Capital
  </h3>

  <h2>
    ₹
    {peakCapitalBlocked.toLocaleString('en-IN')}
  </h2>

  <div
    style={{
      fontSize:'12px',
      color:'#666'
    }}
  >
    Maximum Capital Used
  </div>

</div>
      </div>

      <br />

<h2>
  Invoice Ledger
</h2>

<table
  border="1"
  cellPadding="8"
  width="100%"
>

  <thead>

    <tr>

      <th>Date</th>

      <th>Invoice No</th>

      <th>Invoice Value</th>

      <th>Collections</th>

      <th>Pending</th>

    </tr>

  </thead>

  <tbody>

    {invoiceDetails.map(
      row => (

        <tr
          key={
            row.invoice_number
          }
        >

          <td>
            {row.invoice_date}
          </td>

          <td>
            {row.invoice_number}
          </td>

          <td>
            ₹
            {row.invoice_value
              .toLocaleString(
                'en-IN'
              )}
          </td>

          <td>
            ₹
            {row.collected
              .toLocaleString(
                'en-IN'
              )}
          </td>

          <td>
            ₹
            {row.pending
              .toLocaleString(
                'en-IN'
              )}
          </td>

        </tr>

      )
    )}

  </tbody>

</table>

<br />
      <div
        style={{
          display:'grid',
          gridTemplateColumns:
            '300px 1fr',
          gap:'20px'
        }}
      >

        <div>

          <h3>
            Expense Breakdown
          </h3>

          <table
            border="1"
            cellPadding="8"
            width="100%"
          >

            <tbody>

              {categorySummary.map(item => (

                <tr
                  key={item.category}
                >

                  <td>
                    {item.category}
                  </td>

                  <td>
                    ₹
                    {item.amount
                      .toLocaleString('en-IN')}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        <div>

          <h3>
            Recent Expenses
          </h3>

          <table
            border="1"
            cellPadding="8"
            width="100%"
          >

            <thead>

              <tr>

                <th>Date</th>

                <th>Category</th>

                <th>Sub Category</th>

                <th>Amount</th>

                <th>Remarks</th>

              </tr>

            </thead>

            <tbody>

              {expenses
                .slice(0,20)
                .map(row => (

                <tr
                  key={row.id}
                >

                  <td>
                    {row.expense_date}
                  </td>

                  <td>
                    {row
                      .ai_expense_category
                      ?.category_name}
                  </td>

                  <td>
                    {row
                      .ai_expense_subcategory
                      ?.subcategory_name}
                  </td>

                  <td>
                    ₹
                    {Number(
                      row.amount || 0
                    ).toLocaleString('en-IN')}
                  </td>

                  <td>
                    {row.remarks}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  )
}
