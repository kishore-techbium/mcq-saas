'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function CollectionForm({
  editingCollection,
  setEditingCollection,
  onSaved
}) {
const [projects, setProjects] =
  useState([])
  const [invoices, setInvoices] = useState([])

  const [selectedInvoice, setSelectedInvoice] =
    useState(null)

  const [alreadyCollected,
    setAlreadyCollected] = useState(0)

 const [form, setForm] = useState({

  collection_type: 'Invoice',

  project_id: '',

  invoice_id: '',

  received_date:
    new Date()
      .toISOString()
      .split('T')[0],

    payment_component: 'Mixed',

    amount_received: '',

    

    reference_number: '',

    remarks: ''
  })

  async function loadInvoices() {

    const { data } = await supabase
      .from('ai_invoice')
      .select(`
        *,
        ai_project (
          project_name
        )
      `)
      .order(
        'invoice_date',
        { ascending: false }
      )

    setInvoices(data || [])
  }

async function loadProjects() {

  const { data } =
    await supabase
      .from('ai_project')
      .select('*')
      .order('project_name')

  setProjects(data || [])
}
  
  async function loadInvoiceTotals(
    invoiceId
  ) {

    if (!invoiceId) {
      setSelectedInvoice(null)
      setAlreadyCollected(0)
      return
    }

    const invoice =
      invoices.find(
        x => x.id === invoiceId
      )

    setSelectedInvoice(invoice)

    const { data } = await supabase
      .from('ai_collection')
      .select(
        'amount_accounted'
      )
      .eq(
        'invoice_id',
        invoiceId
      )

    const total =
      (data || []).reduce(
        (sum, row) =>
          sum +
          Number(
            row.amount_accounted || 0
          ),
        0
      )

    setAlreadyCollected(total)
  }

useEffect(() => {

  loadInvoices()

  loadProjects()

}, [])

  useEffect(() => {

    if (
      form.invoice_id &&
      invoices.length
    ) {
      loadInvoiceTotals(
        form.invoice_id
      )
    }

  }, [
    form.invoice_id,
    invoices
  ])

  useEffect(() => {

    if (!editingCollection)
      return

    setForm({
      ...editingCollection
    })

  }, [editingCollection])

  async function saveCollection() {

 if (
  form.collection_type ===
  'Invoice' &&
  !form.invoice_id
) {
  alert(
    'Select Invoice'
  )
  return
}

if (
  form.collection_type ===
  'On Account' &&
  !form.project_id
) {
  alert(
    'Select Project'
  )
  return
}

    const amountReceived =
      Number(
        form.amount_received || 0
      )

 
    const amountAccounted =
      amountReceived

    const payload = {

  collection_type:
    form.collection_type,

  project_id:
    form.project_id || null,

  invoice_id:
    form.collection_type ===
    'Invoice'
      ? form.invoice_id
      : null,

      received_date:
        form.received_date,

      payment_component:
        form.payment_component,

      amount_received:
        amountReceived,

    
      amount_accounted:
        amountAccounted,

      reference_number:
        form.reference_number,

      remarks:
        form.remarks
    }

    let error

    if (
      editingCollection?.id
    ) {

      const result =
        await supabase
          .from(
            'ai_collection'
          )
          .update(payload)
          .eq(
            'id',
            editingCollection.id
          )

      error = result.error

    } else {

      const result =
        await supabase
          .from(
            'ai_collection'
          )
          .insert(payload)

      error = result.error
    }

    if (error) {
      alert(error.message)
      return
    }

   if (
  form.collection_type ===
  'Invoice'
) {

  await updateInvoice(
    form.invoice_id
  )

}

    alert(
      'Collection Saved'
    )

    setEditingCollection(
      null
    )

setForm({

  collection_type:
    'Invoice',

  project_id: '',

  invoice_id: '',

  received_date:
    new Date()
      .toISOString()
      .split('T')[0],

  payment_component:
    'Mixed',

  amount_received: '',

  reference_number: '',

  remarks: ''
})
    setSelectedInvoice(null)
    setAlreadyCollected(0)

    onSaved()
  }

  async function updateInvoice(
    invoiceId
  ) {

    const invoice =
      invoices.find(
        x => x.id === invoiceId
      )

    if (!invoice) return

    const { data } =
      await supabase
        .from(
          'ai_collection'
        )
        .select(
          'amount_accounted'
        )
        .eq(
          'invoice_id',
          invoiceId
        )

    const totalCollected =
      (data || []).reduce(
        (sum, row) =>
          sum +
          Number(
            row.amount_accounted || 0
          ),
        0
      )

    const outstanding =
      Number(
        invoice.gross_amount || 0
      ) -
      totalCollected

    let status =
      'Pending'

    if (
      outstanding <= 0
    ) {

      status =
        'Received'

    } else if (
      totalCollected > 0
    ) {

      status =
        'Partially Received'
    }

    await supabase
      .from('ai_invoice')
      .update({
        amount_outstanding:
          outstanding,

        invoice_status:
          status
      })
      .eq(
        'id',
        invoiceId
      )
  }

  const outstanding =
    Number(
      selectedInvoice
        ?.gross_amount || 0
    ) -
    alreadyCollected

  return (

    <div
      style={{
        border:
          '1px solid #ddd',
        padding: '20px'
      }}
    >

      <h2>
        {
          editingCollection
            ? 'Edit Collection'
            : 'New Collection'
        }
      </h2>
<label>
  Collection Type
</label>

<br />

<select
  value={
    form.collection_type
  }
onChange={(e) =>
  setForm({
    ...form,

    collection_type:
      e.target.value,

    invoice_id: '',

    project_id: ''
  })
}
>
  <option value="Invoice">
    Invoice
  </option>

  <option value="On Account">
    On Account
  </option>
</select>

<br /><br />
{
  form.collection_type ===
  'Invoice' && (

    <>

      <label>
        Invoice
      </label>

      <br />

      <select
        value={form.invoice_id}
        onChange={(e) =>
          setForm({
            ...form,
            invoice_id:
              e.target.value
          })
        }
      >

        <option value="">
          Select Invoice
        </option>

        {invoices.map(
          invoice => (

            <option
              key={invoice.id}
              value={invoice.id}
            >
              {invoice.invoice_number}
              {' | '}
              {invoice.ai_project?.project_name}
              {' | ₹'}
              {Number(
                invoice.gross_amount || 0
              ).toLocaleString('en-IN')}
            </option>

          )
        )}

      </select>

      <br /><br />

    </>

  )
}
{
  form.collection_type ===
  'On Account' && (

    <>

      <label>
        Project
      </label>

      <br />

      <select
        value={
          form.project_id
        }
        onChange={(e) =>
          setForm({
            ...form,
            project_id:
              e.target.value
          })
        }
      >

        <option value="">
          Select Project
        </option>

        {projects.map(
          project => (

            <option
              key={
                project.id
              }
              value={
                project.id
              }
            >
              {
                project.project_name
              }
            </option>

          )
        )}

      </select>

      <br /><br />

    </>

  )
}
      <br /><br />

      {selectedInvoice && (

        <div
          style={{
            background:
              '#f9fafb',
            padding:
              '12px',
            borderRadius:
              '8px',
            marginBottom:
              '15px'
          }}
        >

          <div>
            Invoice Value:
            ₹
            {Number(
              selectedInvoice.gross_amount
            ).toLocaleString(
              'en-IN'
            )}
          </div>

          <div>
            Already Collected:
            ₹
            {alreadyCollected
              .toLocaleString(
                'en-IN'
              )}
          </div>

          <div>
            Outstanding:
            ₹
            {outstanding
              .toLocaleString(
                'en-IN'
              )}
          </div>

        </div>

      )}

      <label>
        Received Date
      </label>

      <br />

      <input
        type="date"
        value={
          form.received_date
        }
        onChange={(e) =>
          setForm({
            ...form,
            received_date:
              e.target.value
          })
        }
      />

      <br /><br />

      <label>
        Component
      </label>

      <br />

      <select
        value={
          form.payment_component
        }
        onChange={(e) =>
          setForm({
            ...form,
            payment_component:
              e.target.value
          })
        }
      >
        <option>
          Mixed
        </option>
        <option>
          Basic
        </option>
        <option>
          GST
        </option>
        <option>
          Retention
        </option>
      </select>

      <br /><br />

      <label>
        Amount Received
      </label>

      <br />

      <input
        type="number"
        value={
          form.amount_received
        }
        onChange={(e) =>
          setForm({
            ...form,
            amount_received:
              e.target.value
          })
        }
      />

      <br /><br />

     

      <label>
        Reference Number
      </label>

      <br />

      <input
        value={
          form.reference_number
        }
        onChange={(e) =>
          setForm({
            ...form,
            reference_number:
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
        value={
          form.remarks
        }
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
        onClick={
          saveCollection
        }
      >
        {
          editingCollection
            ? 'Update Collection'
            : 'Save Collection'
        }
      </button>

    </div>
  )
}
