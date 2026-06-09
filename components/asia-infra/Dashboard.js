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
