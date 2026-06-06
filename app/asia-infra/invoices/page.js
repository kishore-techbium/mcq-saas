'use client'

import { useEffect, useState } from 'react'

import { supabase }
from '../../../lib/supabase'

import InvoiceForm
from '../../../components/asia-infra/InvoiceForm'

import InvoiceList
from '../../../components/asia-infra/InvoiceList'

export default function InvoicesPage() {

  const [invoices, setInvoices] =
    useState([])

  const [
    editingInvoice,
    setEditingInvoice
  ] = useState(null)

  async function loadInvoices() {

    const { data, error } =
      await supabase
        .from('ai_invoice')
        .select(`
          *,
      ai_project(
  project_name,
  work_order_number
)
        `)
        .order(
         'invoice_date',
          {
            ascending: false
          }
        )

    if (error) {
      console.error(error)
      return
    }

    setInvoices(data || [])
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  return (

    <div>

      <h1>
        Invoices
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '450px 1fr',
          gap: '20px'
        }}
      >

        <InvoiceForm
          editingInvoice={
            editingInvoice
          }
          setEditingInvoice={
            setEditingInvoice
          }
          onSaved={
            loadInvoices
          }
        />

        <InvoiceList
          invoices={invoices}
          setEditingInvoice={
            setEditingInvoice
          }
          refresh={
            loadInvoices
          }
        />

      </div>

    </div>

  )
}
