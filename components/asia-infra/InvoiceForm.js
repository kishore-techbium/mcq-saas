'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function InvoiceForm({
  editingInvoice,
  setEditingInvoice,
  onSaved
}) {

  const [projects, setProjects] = useState([])

  const [form, setForm] = useState({
    project_id: '',
    running_bill_no: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],

    basic_amount: '',
    gst_amount: '',

    gross_amount: '',

    retention_type: 'Basic',
    retention_percentage: 5,
    retention_amount: '',

    tds_percent: 2,
    tds_amount: '',

    bill_period_from: '',
    bill_period_to: '',

    retention_release_date: '',

    submitted_to: '',
    remarks: ''
  })

  async function loadProjects() {

    const { data } = await supabase
      .from('ai_project')
      .select('*')
      .order('project_name')

    setProjects(data || [])
  }

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {

    const basic =
      Number(form.basic_amount || 0)

    const gst =
      Number(form.gst_amount || 0)

    const gross = basic + gst

    let retention = 0

    if (
      form.retention_type === 'Basic'
    ) {

      retention =
        basic *
        Number(
          form.retention_percentage || 0
        ) / 100

    } else if (
      form.retention_type === 'Gross'
    ) {

      retention =
        gross *
        Number(
          form.retention_percentage || 0
        ) / 100

    }

    const tds =
      basic *
      Number(form.tds_percent || 0) /
      100

    setForm(prev => ({
      ...prev,
      gross_amount: gross,
      retention_amount: retention,
      tds_amount: tds
    }))

  }, [
    form.basic_amount,
    form.gst_amount,
    form.retention_percentage,
    form.retention_type,
    form.tds_percent
  ])

  useEffect(() => {

    if (!editingInvoice) return

    setForm({
      ...editingInvoice
    })

  }, [editingInvoice])

  async function saveInvoice() {

    const payload = {
      ...form
    }

    let error

    if (editingInvoice?.id) {

      const result = await supabase
        .from('ai_invoice')
        .update(payload)
        .eq('id', editingInvoice.id)

      error = result.error

    } else {

      const result = await supabase
        .from('ai_invoice')
        .insert(payload)

      error = result.error
    }

    if (error) {
      alert(error.message)
      return
    }

    alert('Invoice Saved')

    setEditingInvoice(null)

    setForm({
      project_id: '',
      running_bill_no: '',
      invoice_number: '',
      invoice_date:
        new Date()
          .toISOString()
          .split('T')[0],

      basic_amount: '',
      gst_amount: '',
      gross_amount: '',

      retention_type: 'Basic',
      retention_percentage: 5,
      retention_amount: '',

      tds_percent: 2,
      tds_amount: '',

      bill_period_from: '',
      bill_period_to: '',

      retention_release_date: '',

      submitted_to: '',
      remarks: ''
    })

    onSaved()
  }

  return (

    <div
      style={{
        border: '1px solid #ddd',
        padding: '20px'
      }}
    >

      <h2>
        {editingInvoice
          ? 'Edit Invoice'
          : 'New Invoice'}
      </h2>

      <select
        value={form.project_id}
        onChange={(e) =>
          setForm({
            ...form,
            project_id: e.target.value
          })
        }
      >

        <option value="">
          Select Project
        </option>

        {projects.map(project => (

          <option
            key={project.id}
            value={project.id}
          >
            {project.project_name}
          </option>

        ))}

      </select>

      <br /><br />

      <input
        placeholder="Running Bill No"
        value={form.running_bill_no}
        onChange={(e) =>
          setForm({
            ...form,
            running_bill_no:
              e.target.value
          })
        }
      />

      <br /><br />

      <input
        placeholder="Invoice Number"
        value={form.invoice_number}
        onChange={(e) =>
          setForm({
            ...form,
            invoice_number:
              e.target.value
          })
        }
      />

      <br /><br />

      <input
        type="date"
        value={form.invoice_date}
        onChange={(e) =>
          setForm({
            ...form,
            invoice_date:
              e.target.value
          })
        }
      />

      <br /><br />

      <input
        type="number"
        placeholder="Basic Amount"
        value={form.basic_amount}
        onChange={(e) =>
          setForm({
            ...form,
            basic_amount:
              e.target.value
          })
        }
      />

      <br /><br />

      <input
        type="number"
        placeholder="GST Amount"
        value={form.gst_amount}
        onChange={(e) =>
          setForm({
            ...form,
            gst_amount:
              e.target.value
          })
        }
      />

      <br /><br />

      <input
        disabled
        value={form.gross_amount}
      />

      <br /><br />

      <select
        value={form.retention_type}
        onChange={(e) =>
          setForm({
            ...form,
            retention_type:
              e.target.value
          })
        }
      >
        <option>Basic</option>
        <option>Gross</option>
        <option>Fixed</option>
      </select>

      <br /><br />

      <input
        type="number"
        placeholder="Retention %"
        value={
          form.retention_percentage
        }
        onChange={(e) =>
          setForm({
            ...form,
            retention_percentage:
              e.target.value
          })
        }
      />

      <br /><br />

      <input
        disabled
        value={
          form.retention_amount
        }
      />

      <br /><br />

      <input
        type="number"
        placeholder="TDS %"
        value={form.tds_percent}
        onChange={(e) =>
          setForm({
            ...form,
            tds_percent:
              e.target.value
          })
        }
      />

      <br /><br />

      <input
        disabled
        value={form.tds_amount}
      />

      <br /><br />

      <input
        type="date"
        value={
          form.retention_release_date
        }
        onChange={(e) =>
          setForm({
            ...form,
            retention_release_date:
              e.target.value
          })
        }
      />

      <br /><br />

      <input
        placeholder="Submitted To"
        value={form.submitted_to}
        onChange={(e) =>
          setForm({
            ...form,
            submitted_to:
              e.target.value
          })
        }
      />

      <br /><br />

      <textarea
        rows="4"
        placeholder="Remarks"
        value={form.remarks}
        onChange={(e) =>
          setForm({
            ...form,
            remarks:
              e.target.value
          })
        }
      />

      <br /><br />

      <button onClick={saveInvoice}>
        {editingInvoice
          ? 'Update Invoice'
          : 'Save Invoice'}
      </button>

    </div>
  )
}
