'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ApproveSchoolStudentsPage() {

  const [loading, setLoading] =
    useState(true)

  const [requests, setRequests] =
    useState([])

  const [message, setMessage] =
    useState('')

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

    if (
      !user ||
      user.role !== 'superadmin'
    ) {

      window.location.href =
        '/dashboard'

      return
    }

    await loadRequests()

    setLoading(false)
  }

  async function loadRequests() {

    const { data, error } =
      await supabase
        .from(
          'student_ofschool_registration_requests'
        )
        .select('*')
        .order('created_at', {
          ascending: false
        })

    if (!error) {

      setRequests(data || [])
    }
  }

  async function approveStudent(
    request
  ) {

    setMessage('')

    try {

      // FIND SCHOOL

      const { data: school } =
        await supabase
          .from('schools')
          .select('*')
          .eq(
            'name',
            request.school_name
          )
          .maybeSingle()

      if (!school) {

        throw new Error(
          'School not found'
        )
      }

      // SHARED OLYMPIAD COLLEGE

      const {
        data: olympiadCollege
      } = await supabase
        .from('colleges')
        .select('*')
        .eq(
          'name',
          'AURELIUS_OLYMPIAD'
        )
        .single()

      if (!olympiadCollege) {

        throw new Error(
          'Olympiad college missing'
        )
      }

      // CHECK EXISTING STUDENT

      const {
        data: existingStudent
      } = await supabase
        .from('students')
        .select('*')
        .eq('phone', request.phone)
        .maybeSingle()

      if (!existingStudent) {

        await supabase
          .from('students')
          .insert([
            {

              first_name:
                request.first_name,

              last_name:
                request.last_name,

              phone:
                request.phone,

              email:
                request.email,

              role: 'student',

              exam_preference:
                'SCHOOL',

              college_id:
                olympiadCollege.id,

              college_name:
                'AURELIUS_OLYMPIAD',

              school_id:
                school.id,

              study_year: 4,

              address:
                `${request.city}, ${request.district}, ${request.state}`,

              is_active: true
            }
          ])
      }

      // UPDATE REQUEST STATUS

      await supabase
        .from(
          'student_ofschool_registration_requests'
        )
        .update({
          status: 'approved'
        })
        .eq('id', request.id)

      setMessage(
        '✅ Student approved successfully'
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
      .from(
        'student_ofschool_registration_requests'
      )
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
            👨‍🎓 Approve School Students
          </h1>

          <p style={styles.subtext}>
            Review and approve
            school student
            registration requests.
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
                Student
              </th>

              <th style={styles.th}>
                School
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

            {requests.map(r => (

              <tr key={r.id}>

                <td style={styles.td}>
                  {r.first_name}
                  {' '}
                  {r.last_name}
                </td>

                <td style={styles.td}>
                  {r.school_name}
                </td>

                <td style={styles.td}>
                  {r.phone}
                </td>

                <td style={styles.td}>
                  {r.city}
                </td>

                <td style={styles.td}>
                  {r.district}
                </td>

                <td style={styles.td}>
                  {r.state}
                </td>

                <td style={styles.td}>

                  <span
                    style={{
                      ...styles.badge,

                      background:
                        r.status ===
                        'approved'
                          ? '#dcfce7'
                          : r.status ===
                            'rejected'
                          ? '#fee2e2'
                          : '#fef9c3',

                      color:
                        r.status ===
                        'approved'
                          ? '#166534'
                          : r.status ===
                            'rejected'
                          ? '#991b1b'
                          : '#854d0e'
                    }}
                  >

                    {r.status}

                  </span>

                </td>

                <td style={styles.td}>

                  {r.status ===
                    'pending' && (

                    <div
                      style={
                        styles.actions
                      }
                    >

                      <button
                        style={
                          styles.approveBtn
                        }
                        onClick={() =>
                          approveStudent(r)
                        }
                      >
                        Approve
                      </button>

                      <button
                        style={
                          styles.rejectBtn
                        }
                        onClick={() =>
                          rejectRequest(
                            r.id
                          )
                        }
                      >
                        Reject
                      </button>

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
    overflow: 'hidden',
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
    borderBottom:
      '1px solid #e2e8f0',
    fontSize: 14
  },

  td: {
    padding: 16,
    borderBottom:
      '1px solid #f1f5f9',
    fontSize: 14
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
    gap: 10
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
