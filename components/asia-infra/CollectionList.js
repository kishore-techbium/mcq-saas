'use client'

import { supabase } from '../../lib/supabase'

export default function CollectionList({
  collections,
  setEditingCollection,
  refresh
}) {

  async function deleteCollection(id) {

    const yes = confirm(
      'Delete this collection?'
    )

    if (!yes) return

    const { error } = await supabase
      .from('ai_collection')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    refresh()
  }

  return (

    <div>

      <h2>
        Collection Register
      </h2>

      <table
        border="1"
        cellPadding="8"
        width="100%"
      >

        <thead>

          <tr>

            <th>
              Date
            </th>

            <th>
              Invoice No
            </th>

            <th>
              Project
            </th>

            <th>
              Component
            </th>

            <th>
              Amount
            </th>

         
            <th>
              Accounted
            </th>

            <th>
              Reference
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

          {collections.map(
            collection => (

              <tr
                key={collection.id}
              >

                <td>
                  {collection.received_date
                    ? new Date(
                        collection.received_date
                      ).toLocaleDateString(
                        'en-IN'
                      )
                    : '-'}
                </td>

                <td>
                  {
                    collection
                      .ai_invoice
                      ?.invoice_number
                  }
                </td>

                <td>
                  {
                    collection
                      .ai_invoice
                      ?.ai_project
                      ?.project_name
                  }
                </td>

                <td>
                  {
                    collection.payment_component
                  }
                </td>

                <td>
                  ₹
                  {Number(
                    collection.amount_received || 0
                  ).toLocaleString(
                    'en-IN'
                  )}
                </td>

            
                <td>
                  ₹
                  {Number(
                    collection.amount_accounted || 0
                  ).toLocaleString(
                    'en-IN'
                  )}
                </td>

                <td>
                  {
                    collection.reference_number
                  }
                </td>

                <td>

                  <button
                    onClick={() =>
                      setEditingCollection(
                        collection
                      )
                    }
                  >
                    Edit
                  </button>

                </td>

                <td>

                  <button
                    onClick={() =>
                      deleteCollection(
                        collection.id
                      )
                    }
                  >
                    Delete
                  </button>

                </td>

              </tr>

            )
          )}

        </tbody>

      </table>

    </div>

  )
}
