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

gst_percent: 18,

gst_amount: '',
    gross_amount: '',

    
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
  basic *
  Number(
    form.gst_percent || 0
  ) / 100
    const gross = basic + gst

    const retention =
  basic *
  Number(
    form.retention_percentage || 0
  ) / 100

    

    const tds =
      basic *
      Number(form.tds_percent || 0) /
      100

setForm(prev => {

  const newValues = {
    ...prev,
gst_amount:
  Number(gst || 0).toFixed(2),

gross_amount:
  Number(gross || 0).toFixed(2),

retention_amount:
  Number(retention || 0).toFixed(2),

tds_amount:
  Number(tds || 0).toFixed(2)
  }

  if (
    prev.gst_amount === newValues.gst_amount &&
    prev.gross_amount === newValues.gross_amount &&
    prev.retention_amount === newValues.retention_amount &&
    prev.tds_amount === newValues.tds_amount
  ) {
    return prev
  }

  return newValues
})

  }, [
  form.basic_amount,
  form.gst_percent,
  form.retention_percentage,
  form.tds_percent
])

useEffect(() => {

  if (!editingInvoice) return

  const {
    ai_project,
    ...cleanInvoice
  } = editingInvoice

  setForm({
    gst_percent: 18,
    retention_percentage: 5,
    tds_percent: 2,

    ...cleanInvoice
  })

}, [editingInvoice])
  async function saveInvoice() {

 const {
  ai_project,
  ...payload
} = form

payload.invoice_amount =
  Number(form.gross_amount || 0)

payload.invoice_status =
  payload.invoice_status || 'Pending'

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

gst_percent: 18,

gst_amount: '',

gross_amount: '',

      
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
<div
  style={{
    background: '#f3f4f6',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px'
  }}
>
  Default:
  GST 18% | TDS 2% | Retention 5%
</div>
      <h2>
        {editingInvoice
          ? 'Edit Invoice'
          : 'New Invoice'}
      </h2>
<label>
  Project
</label>
<br />
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

<label>
  Running Bill No
</label>
<br />

<input
  placeholder="RA-01 / RA-02"
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

      <label>
  Invoice Number
</label>
<br />

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

      <label>
  Invoice Date
</label>
<br />

<input
  type="date"
  value={form.invoice_date}
  onChange={(e) =>
    setForm({
      ...form,
      invoice_date: e.target.value
    })
  }
/>

      <br /><br />
<label>
  Bill Period From
</label>
<br />

<input
  type="date"
  value={form.bill_period_from}
  onChange={(e) =>
    setForm({
      ...form,
      bill_period_from: e.target.value
    })
  }
/>

<br /><br />

<label>
  Bill Period To
</label>
<br />

<input
  type="date"
  value={form.bill_period_to}
  onChange={(e) =>
    setForm({
      ...form,
      bill_period_to: e.target.value
    })
  }
/>

<br /><br />
<label>
  Taxable Value
</label>
<br />

<input
autoFocus
  type="number"
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
<label>
  GST %
</label>
<br />

<input
  type="number"
  value={form.gst_percent}
  onChange={(e) =>
    setForm({
      ...form,
      gst_percent:
        e.target.value
    })
  }
/>

<br /><br />

<label>
  GST Amount
</label>
<br />

<input
  disabled
  value={
    Number(
      form.gst_amount || 0
    ).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

      />

      <br /><br />
<label>
  Gross Invoice Value
</label>
<br />
      <input
        disabled
        value={
  Number(
    form.gross_amount || 0
  ).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
      />

      <br /><br />
<div
  style={{
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '10px',
    marginBottom: '15px'
  }}
>
  <strong>Invoice Summary</strong>

  <div>
    Taxable:
    ₹{Number(form.basic_amount || 0)
      .toLocaleString('en-IN')}
  </div>

  <div>
    GST:
    ₹{Number(form.gst_amount || 0)
      .toLocaleString('en-IN')}
  </div>

  <div>
    Gross:
    ₹{Number(form.gross_amount || 0)
      .toLocaleString('en-IN')}
  </div>

  <div>
    Retention:
    ₹{Number(form.retention_amount || 0)
      .toLocaleString('en-IN')}
  </div>

  <div>
    TDS:
    ₹{Number(form.tds_amount || 0)
      .toLocaleString('en-IN')}
  </div>

    <div>
  Net Receivable:
  ₹{
    (
      Number(form.gross_amount || 0)
      -
      Number(form.retention_amount || 0)
      -
      Number(form.tds_amount || 0)
    ).toLocaleString('en-IN')
  }
</div>
</div>
<label>
  Retention %
</label>
<br />
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
<label>
  Retention Amount
</label>
<br />
  <input
  disabled
  value={
    Number(
      form.retention_amount || 0
    ).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
/>

      <br /><br />
<label>
  TDS %
</label>
<br />
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
<label>
  TDS Amount
</label>
<br />
      <input
        disabled
        value={
  Number(
    form.tds_amount || 0
  ).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
      />

      <br /><br />
<label>
  Retention Release Date
</label>
<br />

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
<label>
  Submitted To
</label>
<br />

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

      <label>
  Remarks
</label>
<br />

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

      <button
  onClick={saveInvoice}
  style={{
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer'
  }}
>
        {editingInvoice
          ? 'Update Invoice'
          : 'Save Invoice'}
      </button>

    </div>
  )
}
