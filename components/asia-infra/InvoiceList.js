'use client'

import { supabase } from '../../lib/supabase'

export default function InvoiceList({
  invoices,
  setEditingInvoice,
  refresh
}) {

  async function deleteInvoice(id) {

    const yes = confirm(
      'Delete this invoice?'
    )

    if (!yes) return

    const { error } = await supabase
      .from('ai_invoice')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    refresh()
  }

  function getStatusBadge(status) {

    let bg = '#e5e7eb'

    if (status === 'Received') {
      bg = '#dcfce7'
    }

    if (status === 'Partially Received') {
      bg = '#fef3c7'
    }

    return (
      <span
        style={{
          background: bg,
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '12px'
        }}
      >
        {status || 'Pending'}
      </span>
    )
  }

  return (

    <div>

      <h2>
        Invoice Register
      </h2>

      <table
        border="1"
        cellPadding="8"
        width="100%"
      >

        <thead>

          <tr>

            <th>
              Invoice No
            </th>

            <th>
              Project
            </th>

            <th>
              Basic
            </th>

            <th>
              GST
            </th>

            <th>
              Gross
            </th>

            <th>
              Retention
            </th>

            <th>
              TDS
            </th>

            <th>
              Status
            </th>

            <th>
              Edit
            </th>

            <th>
              Delete
            </th>

          </tr>

        </thead>

        <tbody>

          {invoices.map(invoice => (

            <tr key={invoice.id}>

              <td>
                {invoice.invoice_number}
              </td>

              <td>
                {
                  invoice.ai_project
                    ?.project_name
                }
              </td>

              <td>
                ₹
                {Number(
                  invoice.basic_amount || 0
                ).toLocaleString('en-IN')}
              </td>

              <td>
                ₹
                {Number(
                  invoice.gst_amount || 0
                ).toLocaleString('en-IN')}
              </td>

              <td>
                ₹
                {Number(
                  invoice.gross_amount || 0
                ).toLocaleString('en-IN')}
              </td>

              <td>
                ₹
                {Number(
                  invoice.retention_amount || 0
                ).toLocaleString('en-IN')}
              </td>

              <td>
                ₹
                {Number(
                  invoice.tds_amount || 0
                ).toLocaleString('en-IN')}
              </td>

              <td>
                {getStatusBadge(
                  invoice.invoice_status
                )}
              </td>

              <td>

                <button
                  onClick={() =>
                    setEditingInvoice(
                      invoice
                    )
                  }
                >
                  Edit
                </button>

              </td>

              <td>

                <button
                  onClick={() =>
                    deleteInvoice(
                      invoice.id
                    )
                  }
                >
                  Delete
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )
}
