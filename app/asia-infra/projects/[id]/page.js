'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

export default function ProjectDashboard({
  params
}) {

  const [project, setProject] = useState(null)

  const [expenses, setExpenses] = useState([])
  const [expenseTotal, setExpenseTotal] = useState(0)
const [invoiceTotal, setInvoiceTotal] =
  useState(0)

const [collectionTotal, setCollectionTotal] =
  useState(0)

const [outstandingTotal, setOutstandingTotal] =
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

  const { data: invoices } =
    await supabase
      .from('ai_invoice')
      .select('*')
      .eq('project_id', params.id)

  const { data: collections } =
    await supabase
      .from('ai_collection')
      .select('*')
      .eq('project_id', params.id)

  const totalInvoices =
    (invoices || []).reduce(
      (sum, row) =>
        sum +
        Number(
          row.gross_amount || 0
        ),
      0
    )

  const totalCollections =
    (collections || []).reduce(
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

  setCollectionTotal(
    totalCollections
  )

  setOutstandingTotal(
    totalInvoices -
    totalCollections
  )
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
  if (!project) {
    return <div>Loading...</div>
  }

  return (

    <div>

      <h1>
        {project.project_name}
      </h1>

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
            'repeat(4,1fr)',
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
     <h3>Invoices</h3>

<h2>
  ₹
  {invoiceTotal
    .toLocaleString('en-IN')}
</h2>
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

      </div>

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
