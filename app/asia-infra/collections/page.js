'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

import CollectionForm
from '../../../components/asia-infra/CollectionForm'

import CollectionList
from '../../../components/asia-infra/CollectionList'

export default function CollectionsPage() {

  const [collections, setCollections] =
    useState([])

  const [
    editingCollection,
    setEditingCollection
  ] = useState(null)

  async function loadCollections() {

    const { data, error } =
      await supabase
        .from('ai_collection')
        .select(`
          *,
          ai_invoice (
            invoice_number,
            gross_amount,
            ai_project (
              project_name
            )
          )
        `)
        .order(
          'received_date',
          {
            ascending: false
          }
        )

    if (error) {
      console.error(error)
      return
    }

    setCollections(data || [])
  }

  useEffect(() => {
    loadCollections()
  }, [])

  return (

    <div>

      <h1>
        Collections
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '450px 1fr',
          gap: '20px'
        }}
      >

        <CollectionForm
          editingCollection={
            editingCollection
          }
          setEditingCollection={
            setEditingCollection
          }
          onSaved={
            loadCollections
          }
        />

        <CollectionList
          collections={
            collections
          }
          setEditingCollection={
            setEditingCollection
          }
          refresh={
            loadCollections
          }
        />

      </div>

    </div>

  )
}
