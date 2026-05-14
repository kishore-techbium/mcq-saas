'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ApproveSchoolsPage() {

  const [loading, setLoading] = useState(true)

  const [requests, setRequests] = useState([])

  const [message, setMessage] = useState('')

  const [editingId, setEditingId] =
    useState(null)

  const [editForm, setEditForm] =
    useState({})

  useEffect(() => {
    checkAccess()
  }, [])

  async function checkAccess() {

    const { data: auth } =
      await supabase.auth.getUser()

    if (!auth.user) {
      window.location.href = '/'
      return
    }

    const { data: user } =
      await supabase
        .from('students')
        .select('role')
        .eq('user_id', auth.user.id)
        .maybeSingle()

    if (!user || user.role !== 'superadmin') {
      window.location.href = '/dashboard'
      return
    }

    await loadRequests()

    setLoading(false)
  }

  async function loadRequests() {

    const { data, error } =
      await supabase
        .from('school_registration_requests')
        .select('*')
        .order('created_at', {
          ascending: false
        })

    if (!error) {
      setRequests(data || [])
    }
  }

  function startEdit(r) {

    setEditingId(r.id)

    setEditForm(r)
  }

  function cancelEdit() {

    setEditingId(null)

    setEditForm({})
  }

  async function saveEdit() {

    await supabase

      .from('school_registration_requests')

      .update({

        school_name:
          editForm.school_name,

        coordinator_first_name:
          editForm.coordinator_first_name,

        coordinator_last_name:
          editForm.coordinator_last_name,

        phone:
          editForm.phone,

        email:
          editForm.email,

        city:
          editForm.city,

        district:
          editForm.district,

        state:
          editForm.state
      })

      .eq('id', editingId)

    setEditingId(null)

    loadRequests()
  }

  async function approveSchool(request) {

    setMessage('')

    try {

      const { data: olympiadCollege } =
        await supabase
          .from('colleges')
          .select('*')
          .eq('name', 'AURELIUS_OLYMPIAD')
          .single()

      if (!olympiadCollege) {

        throw new Error(
          'AURELIUS_OLYMPIAD college not found'
        )
      }

      const { data: existingSchool } =
        await supabase
          .from('schools')
          .select('*')
          .eq('name', request.school_name)
          .maybeSingle()

      let schoolId = null

      if (existingSchool) {

        schoolId = existingSchool.id

      } else {

        const {
          data: schoolData,
          error: schoolError
        } = await supabase
          .from('schools')
          .insert([
            {
              name: request.school_name,
              city: request.city,
              district: request.district,
              state: request.state
            }
          ])
          .select()
          .single()

        if (schoolError) {
          throw schoolError
        }

        schoolId = schoolData.id
      }

      const { data: existingAdmin } =
        await supabase
          .from('students')
          .select('*')
          .eq('phone', request.phone)
          .eq('role', 'school_admin')
          .maybeSingle()

      if (!existingAdmin) {

        const newId =
          crypto.randomUUID()

        const {
          data: adminData,
          error: studentError
        } = await supabase
          .from('students')
          .insert([
            {
              id: newId,

              user_id: newId,

              first_name:
                request.coordinator_first_name,

              last_name:
                request.coordinator_last_name,

              phone: request.phone,

              email: request.email,

              role: 'school_admin',

              college_id:
                olympiadCollege.id,

              school_id: schoolId,

              college_name:
                'AURELIUS_OLYMPIAD',

              address:
                `${request.city}, ` +
                `${request.district}, ` +
                `${request.state}`,

              exam_preference:
                'SCHOOL',

              is_active: true
            }
          ])
          .select()
          .single()

        if (studentError) {
          throw studentError
        }

        await supabase
          .from('schools')
          .update({
            school_admin_id:
              adminData.id
          })
          .eq('id', schoolId)
      }

      await supabase
        .from(
          'school_registration_requests'
        )
        .update({
          status: 'approved'
        })
        .eq('id', request.id)

      setMessage(
        '✅ School approved successfully'
      )

      loadRequests()

    } catch (err) {

      console.log(err)

      setMessage(
        '❌ Something went wrong'
      )
    }
  }

  async function rejectRequest(id) {

    await supabase
      .from('school_registration_requests')
      .update({
        status: 'rejected'
      })
      .eq('id', id)

    loadRequests()
  }

  if (loading) {

    return (
      <p style={{ padding: 40 }}>
        Loading...
      </p>
    )
  }

  return (

    <div style={{ padding: 30 }}>

      <div style={styles.header}>

        <div>

          <h1 style={styles.title}>
            🏫 Approve Schools
          </h1>

          <p style={styles.subtext}>
            Review and approve Aurelius school registration requests.
          </p>

        </div>

      </div>

      {message && (

        <div style={styles.message}>
          {message}
        </div>

      )}

      <div style={styles.card}>

        <table style={styles.table}>

          <thead>

            <tr>

              <th style={styles.th}>
                School
              </th>

              <th style={styles.th}>
                Coordinator
              </th>

              <th style={styles.th}>
                Phone
              </th>

              <th style={styles.th}>
                City
              </th>

              <th style={styles.th}>
                District
              </th>

              <th style={styles.th}>
                State
              </th>

              <th style={styles.th}>
                Status
              </th>

              <th style={styles.th}>
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {requests.map((r) => (

              <tr key={r.id}>

                <td style={styles.td}>

                  {editingId === r.id ? (

                    <input
                      style={styles.input}
                      value={
                        editForm.school_name || ''
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          school_name:
                            e.target.value
                        })
                      }
                    />

                  ) : (

                    r.school_name

                  )}

                </td>

                <td style={styles.td}>

                  {editingId === r.id ? (

                    <div
                      style={{
                        display: 'flex',
                        gap: 8
                      }}
                    >

                      <input
                        style={styles.input}
                        value={
                          editForm.coordinator_first_name || ''
                        }
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            coordinator_first_name:
                              e.target.value
                          })
                        }
                      />

                      <input
                        style={styles.input}
                        value={
                          editForm.coordinator_last_name || ''
                        }
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            coordinator_last_name:
                              e.target.value
                          })
                        }
                      />

                    </div>

                  ) : (

                    <>
                      {r.coordinator_first_name}
                      {' '}
                      {r.coordinator_last_name}
                    </>

                  )}

                </td>

                <td style={styles.td}>

                  {editingId === r.id ? (

                    <input
                      style={styles.input}
                      value={
                        editForm.phone || ''
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          phone:
                            e.target.value
                        })
                      }
                    />

                  ) : (
                    r.phone
                  )}

                </td>

                <td style={styles.td}>

                  {editingId === r.id ? (

                    <input
                      style={styles.input}
                      value={
                        editForm.city || ''
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          city:
                            e.target.value
                        })
                      }
                    />

                  ) : (
                    r.city
                  )}

                </td>

                <td style={styles.td}>

                  {editingId === r.id ? (

                    <input
                      style={styles.input}
                      value={
                        editForm.district || ''
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          district:
                            e.target.value
                        })
                      }
                    />

                  ) : (
                    r.district
                  )}

                </td>

                <td style={styles.td}>

                  {editingId === r.id ? (

                    <input
                      style={styles.input}
                      value={
                        editForm.state || ''
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          state:
                            e.target.value
                        })
                      }
                    />

                  ) : (
                    r.state
                  )}

                </td>

                <td style={styles.td}>

                  <span
                    style={{
                      ...styles.badge,

                      background:
                        r.status === 'approved'
                          ? '#dcfce7'
                          : r.status === 'rejected'
                          ? '#fee2e2'
                          : '#fef9c3',

                      color:
                        r.status === 'approved'
                          ? '#166534'
                          : r.status === 'rejected'
                          ? '#991b1b'
                          : '#854d0e'
                    }}
                  >
                    {r.status}
                  </span>

                </td>

                <td style={styles.td}>

                  {r.status === 'pending' && (

                    <div style={styles.actions}>

                      {editingId === r.id ? (

                        <>

                          <button
                            style={styles.saveBtn}
                            onClick={saveEdit}
                          >
                            Save
                          </button>

                          <button
                            style={styles.cancelBtn}
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>

                        </>

                      ) : (

                        <>

                          <button
                            style={styles.editBtn}
                            onClick={() =>
                              startEdit(r)
                            }
                          >
                            Edit
                          </button>

                          <button
                            style={styles.approveBtn}
                            onClick={() =>
                              approveSchool(r)
                            }
                          >
                            Approve
                          </button>

                          <button
                            style={styles.rejectBtn}
                            onClick={() =>
                              rejectRequest(r.id)
                            }
                          >
                            Reject
                          </button>

                        </>

                      )}

                    </div>

                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}

const styles = {

  header: {
    marginBottom: 25
  },

  title: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 8
  },

  subtext: {
    color: '#64748b'
  },

  message: {
    marginBottom: 20,
    padding: 14,
    borderRadius: 10,
    background: '#ecfdf5',
    color: '#166534',
    fontWeight: 600
  },

  card: {
    background: '#fff',
    borderRadius: 14,
    overflowX: 'auto',
    border: '1px solid #e2e8f0'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },

  th: {
    textAlign: 'left',
    padding: 16,
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    fontSize: 14
  },

  td: {
    padding: 16,
    borderBottom: '1px solid #f1f5f9',
    fontSize: 14
  },

  input: {
    padding: 8,
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    width: '100%'
  },

  badge: {
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize'
  },

  actions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap'
  },

  editBtn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600
  },

  saveBtn: {
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600
  },

  cancelBtn: {
    background: '#64748b',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600
  },

  approveBtn: {
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600
  },

  rejectBtn: {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600
  }

}
