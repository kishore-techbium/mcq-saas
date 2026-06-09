'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import KpiCard from './KpiCard'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

import {
  Pie
} from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

export default function Dashboard() {

  const [loading, setLoading] =
    useState(true)

  const [projects, setProjects] =
    useState([])

  const [invoices, setInvoices] =
    useState([])

  const [collections, setCollections] =
    useState([])

  const [expenses, setExpenses] =
    useState([])

  async function loadDashboard() {

    setLoading(true)

    const [
      projectResult,
      invoiceResult,
      collectionResult,
      expenseResult
    ] = await Promise.all([

      supabase
        .from('ai_project')
        .select('*'),

      supabase
        .from('ai_invoice')
        .select('*'),

      supabase
        .from('ai_collection')
        .select('*'),

      supabase
        .from('ai_expense')
        .select('*')

    ])

    setProjects(
      projectResult.data || []
    )

    setInvoices(
      invoiceResult.data || []
    )

    setCollections(
      collectionResult.data || []
    )

    setExpenses(
      expenseResult.data || []
    )

    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div>
        Loading Dashboard...
      </div>
    )
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

  const totalInvoiced =
    invoices.reduce(
      (sum, invoice) =>
        sum +
        Number(
          invoice.gross_amount || 0
        ),
      0
    )

  const totalCollections =
    collections.reduce(
      (sum, collection) =>
        sum +
        Number(
          collection.amount_accounted || 0
        ),
      0
    )

  const totalExpenses =
    expenses.reduce(
      (sum, expense) =>
        sum +
        Number(
          expense.amount || 0
        ),
      0
    )

  const totalRetention =
    invoices.reduce(
      (sum, invoice) =>
        sum +
        Number(
          invoice.retention_amount || 0
        ),
      0
    )

  const totalGST =
    invoices.reduce(
      (sum, invoice) =>
        sum +
        Number(
          invoice.gst_amount || 0
        ),
      0
    )

  const outstanding =
    totalInvoiced -
    totalCollections

  const netProfit =
    totalCollections -
    totalExpenses

  const profitPercent =
    totalCollections > 0
      ? (
          netProfit /
          totalCollections
        ) * 100
      : 0

  const collectionEfficiency =
    totalInvoiced > 0
      ? (
          totalCollections /
          totalInvoiced
        ) * 100
      : 0

  const runningProjects =
    projects.filter(
      p =>
        p.status?.toLowerCase() !==
        'closed'
    ).length

  const closedProjects =
    projects.filter(
      p =>
        p.status?.toLowerCase() ===
        'closed'
    ).length

  const revenueByProject =
    projects.map(project => {

      const projectInvoices =
        invoices.filter(
          invoice =>
            invoice.project_id ===
            project.id
        )

      const invoiced =
        projectInvoices.reduce(
          (sum, invoice) =>
            sum +
            Number(
              invoice.gross_amount || 0
            ),
          0
        )

      return {
        name:
          project.project_name,
        revenue:
          invoiced
      }
    })
    .filter(
      x => x.revenue > 0
    )

  const pieData = {

    labels:
      revenueByProject.map(
        x => x.name
      ),

    datasets: [
      {
        data:
          revenueByProject.map(
            x => x.revenue
          )
      }
    ]
  }

  const projectPerformance =
    projects.map(project => {

      const projectInvoices =
        invoices.filter(
          invoice =>
            invoice.project_id ===
            project.id
        )

      const invoiced =
        projectInvoices.reduce(
          (sum, invoice) =>
            sum +
            Number(
              invoice.gross_amount || 0
            ),
          0
        )

      const collected =
        collections
          .filter(
            collection =>
              collection.project_id ===
              project.id
          )
          .reduce(
            (sum, collection) =>
              sum +
              Number(
                collection.amount_accounted || 0
              ),
            0
          )

      const expense =
        expenses
          .filter(
            exp =>
              exp.project_id ===
              project.id
          )
          .reduce(
            (sum, exp) =>
              sum +
              Number(
                exp.amount || 0
              ),
            0
          )

      const profit =
        collected - expense

      const profitPct =
        collected > 0
          ? (
              profit /
              collected
            ) * 100
          : 0

      const woUtilization =
        Number(
          project.work_order_value || 0
        ) > 0
          ? (
              invoiced /
              Number(
                project.work_order_value
              )
            ) * 100
          : 0

      return {
        ...project,
        invoiced,
        collected,
        expense,
        profit,
        profitPct,
        woUtilization,
        outstanding:
          invoiced - collected
      }
    })
  const closedProjectData =
    projectPerformance.filter(
      project =>
        project.status?.toLowerCase() ===
        'closed'
    )

  return (

    <div
      style={{
        padding: '20px'
      }}
    >

      <h1>
        Asia Infra Dashboard
      </h1>

      <br />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, 1fr)',
          gap: '15px'
        }}
      >

        <KpiCard
          title="Total WO Value"
          value={`₹${totalWOValue.toLocaleString('en-IN')}`}
          color="#2563eb"
        />

        <KpiCard
          title="Total Invoiced"
          value={`₹${totalInvoiced.toLocaleString('en-IN')}`}
          color="#10b981"
        />

        <KpiCard
          title="Total Collections"
          value={`₹${totalCollections.toLocaleString('en-IN')}`}
          color="#14b8a6"
        />

        <KpiCard
          title="Outstanding"
          value={`₹${outstanding.toLocaleString('en-IN')}`}
          color="#ef4444"
        />

      </div>

      <br />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, 1fr)',
          gap: '15px'
        }}
      >

        <KpiCard
          title="Total Expenses"
          value={`₹${totalExpenses.toLocaleString('en-IN')}`}
          color="#dc2626"
        />

        <KpiCard
          title="Net Profit"
          value={`₹${netProfit.toLocaleString('en-IN')}`}
          color={
            netProfit >= 0
              ? '#16a34a'
              : '#dc2626'
          }
        />

        <KpiCard
          title="Profit %"
          value={`${profitPercent.toFixed(2)}%`}
          color="#7c3aed"
        />

        <KpiCard
          title="Retention Held"
          value={`₹${totalRetention.toLocaleString('en-IN')}`}
          color="#f59e0b"
        />

      </div>

      <br />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, 1fr)',
          gap: '15px'
        }}
      >

        <KpiCard
          title="GST Billed"
          value={`₹${totalGST.toLocaleString('en-IN')}`}
          color="#0891b2"
        />

        <KpiCard
          title="Collection Efficiency"
          value={`${collectionEfficiency.toFixed(2)}%`}
          color="#0f766e"
        />

        <KpiCard
          title="Running Projects"
          value={runningProjects}
          color="#2563eb"
        />

        <KpiCard
          title="Closed Projects"
          value={closedProjects}
          color="#6b7280"
        />

      </div>

      <br /><br />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '400px 1fr',
          gap: '20px'
        }}
      >

        <div
          style={{
            background: '#fff',
            border:
              '1px solid #e5e7eb',
            padding: '20px',
            borderRadius: '10px'
          }}
        >

          <h3>
            Revenue Share by Project
          </h3>

          <Pie
            data={pieData}
          />

        </div>

        <div
          style={{
            background: '#fff',
            border:
              '1px solid #e5e7eb',
            padding: '20px',
            borderRadius: '10px'
          }}
        >

          <h3>
            Executive Summary
          </h3>

          <table
            width="100%"
          >

            <tbody>

              <tr>
                <td>
                  Work Orders
                </td>
                <td>
                  ₹
                  {totalWOValue.toLocaleString(
                    'en-IN'
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  Invoiced
                </td>
                <td>
                  ₹
                  {totalInvoiced.toLocaleString(
                    'en-IN'
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  Collections
                </td>
                <td>
                  ₹
                  {totalCollections.toLocaleString(
                    'en-IN'
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  Expenses
                </td>
                <td>
                  ₹
                  {totalExpenses.toLocaleString(
                    'en-IN'
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  Net Profit
                </td>
                <td
                  style={{
                    color:
                      netProfit >= 0
                        ? 'green'
                        : 'red',
                    fontWeight:
                      'bold'
                  }}
                >
                  ₹
                  {netProfit.toLocaleString(
                    'en-IN'
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  Profit %
                </td>
                <td>
                  {profitPercent.toFixed(
                    2
                  )}
                  %
                </td>
              </tr>

            </tbody>

          </table>

        </div>

      </div>

      <br /><br />
        <h2>
        Project Performance
      </h2>

      <table
        border="1"
        cellPadding="8"
        width="100%"
      >

        <thead>

          <tr>

            <th>
              Project
            </th>

            <th>
              WO Value
            </th>

            <th>
              Invoiced
            </th>

            <th>
              Collected
            </th>

            <th>
              Expenses
            </th>

            <th>
              Profit
            </th>

            <th>
              Profit %
            </th>

            <th>
              Outstanding
            </th>

            <th>
              WO Utilization
            </th>

          </tr>

        </thead>

        <tbody>

          {projectPerformance
            .sort(
              (a, b) =>
                b.invoiced -
                a.invoiced
            )
            .map(project => (

              <tr
                key={project.id}
              >

                <td>
                  {
                    project.project_name
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
                  ₹
                  {project.invoiced
                    .toLocaleString(
                      'en-IN'
                    )}
                </td>

                <td>
                  ₹
                  {project.collected
                    .toLocaleString(
                      'en-IN'
                    )}
                </td>

                <td>
                  ₹
                  {project.expense
                    .toLocaleString(
                      'en-IN'
                    )}
                </td>

                <td
                  style={{
                    color:
                      project.profit >= 0
                        ? 'green'
                        : 'red',
                    fontWeight:
                      'bold'
                  }}
                >
                  ₹
                  {project.profit
                    .toLocaleString(
                      'en-IN'
                    )}
                </td>

                <td
                  style={{
                    color:
                      project.profitPct >= 15
                        ? 'green'
                        : project.profitPct > 0
                        ? '#f59e0b'
                        : 'red'
                  }}
                >
                  {project.profitPct
                    .toFixed(2)}
                  %
                </td>

                <td>
                  ₹
                  {project.outstanding
                    .toLocaleString(
                      'en-IN'
                    )}
                </td>

                <td>
                  {project.woUtilization
                    .toFixed(2)}
                  %
                </td>

              </tr>

            ))}

        </tbody>

      </table>

      <br /><br />

      <h2>
        Closed Project Profitability
      </h2>

      <table
        border="1"
        cellPadding="8"
        width="100%"
      >

        <thead>

          <tr>

            <th>
              Project
            </th>

            <th>
              WO Value
            </th>

            <th>
              Invoiced
            </th>

            <th>
              Expenses
            </th>

            <th>
              Profit
            </th>

            <th>
              Profit %
            </th>

            <th>
              Variance
            </th>

          </tr>

        </thead>

        <tbody>

          {closedProjectData.map(
            project => {

              const variance =
                project.invoiced -
                Number(
                  project.work_order_value || 0
                )

              return (

                <tr
                  key={project.id}
                >

                  <td>
                    {
                      project.project_name
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
                    ₹
                    {project.invoiced
                      .toLocaleString(
                        'en-IN'
                      )}
                  </td>

                  <td>
                    ₹
                    {project.expense
                      .toLocaleString(
                        'en-IN'
                      )}
                  </td>

                  <td>
                    ₹
                    {project.profit
                      .toLocaleString(
                        'en-IN'
                      )}
                  </td>

                  <td>
                    {project.profitPct
                      .toFixed(2)}
                    %
                  </td>

                  <td
                    style={{
                      color:
                        variance >= 0
                          ? 'green'
                          : 'red',
                      fontWeight:
                        'bold'
                    }}
                  >
                    ₹
                    {variance
                      .toLocaleString(
                        'en-IN'
                      )}
                  </td>

                </tr>

              )
            }
          )}

        </tbody>

      </table>

    </div>

  )
}
