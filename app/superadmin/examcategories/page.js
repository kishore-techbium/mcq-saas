'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ExamCategoriesPage() {

  const [categories, setCategories] = useState([])

  const [code, setCode] = useState('')
  const [parentCode, setParentCode] = useState('')

  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {

    const { data, error } = await supabase
      .from('exam_categories')
      .select('*')
      .order('name')

    if (!error) {
      setCategories(data || [])
    }
  }

  async function addCategory() {

    if (!code || !parentCode) {
      setMsg('❌ Code and parent code required')
      return
    }

    const finalCode = code.toUpperCase()
    const finalParent = parentCode.toUpperCase()

    const { error } = await supabase
      .from('exam_categories')
      .insert({
        name: finalCode,
        code: finalCode,
        parent_code: finalParent,
        active: true
      })

    if (error) {
      setMsg('❌ ' + error.message)
      return
    }

    setMsg('✅ Category added')

    setCode('')
    setParentCode('')

    loadCategories()
  }

  async function toggleActive(id, current) {

    const { error } = await supabase
      .from('exam_categories')
      .update({
        active: !current
      })
      .eq('id', id)

    if (!error) {
      loadCategories()
    }
  }

  return (
    <div>

      <h1>Exam Categories</h1>

      <div style={styles.box}>

        <input
          placeholder="Category Code"
          value={code}
          style={{ padding: 8 }}
          onChange={(e) => setCode(e.target.value)}
        />

        <input
          placeholder="Parent Code"
          value={parentCode}
          style={{ padding: 8 }}
          onChange={(e) => setParentCode(e.target.value)}
        />

        <button
          onClick={addCategory}
          style={styles.button}
        >
          Add Category
        </button>

      </div>

      <p style={{ marginBottom: 20 }}>
        Examples:
        <br />
        JEE → JEE
        <br />
        JEE_MAINS → JEE
        <br />
        CLASS_6 → SCHOOL
      </p>

      {msg && <p>{msg}</p>}

      <h2 style={{ marginTop: 30 }}>
        Available Exam Categories
      </h2>

      <table style={styles.table}>

        <thead>

          <tr style={styles.headerRow}>
            <th style={styles.th}>Code</th>
            <th style={styles.th}>Parent</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Status</th>
          </tr>

        </thead>

        <tbody>

          {categories.length === 0 && (

            <tr>
              <td
                colSpan="4"
                style={{
                  padding: 20,
                  textAlign: 'center'
                }}
              >
                No categories found
              </td>
            </tr>

          )}

          {categories.map(cat => {

            const isParent =
              cat.code === cat.parent_code

            return (

              <tr key={cat.id} style={styles.tr}>

                <td style={styles.td}>
                  {cat.code}
                </td>

                <td style={styles.td}>
                  {cat.parent_code}
                </td>

                <td style={styles.td}>
                  {isParent
                    ? 'PARENT'
                    : 'CHILD'}
                </td>

                <td style={styles.td}>

                  <button
                    onClick={() =>
                      toggleActive(
                        cat.id,
                        cat.active
                      )
                    }
                    style={{
                      background: cat.active
                        ? '#16a34a'
                        : '#dc2626',

                      color: '#fff',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
                  >
                    {cat.active
                      ? 'ACTIVE'
                      : 'DISABLED'}
                  </button>

                </td>

              </tr>

            )
          })}

        </tbody>

      </table>

    </div>
  )
}

const styles = {

  headerRow: {
    background: '#f1f5f9'
  },

  th: {
    textAlign: 'left',
    padding: 12,
    borderBottom: '1px solid #ddd'
  },

  td: {
    padding: 12,
    borderBottom: '1px solid #eee'
  },

  tr: {
    background: '#fff'
  },

  box: {
    display: 'flex',
    gap: 10,
    marginBottom: 20
  },

  button: {
    padding: '8px 14px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse'
  }
}
