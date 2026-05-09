'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function Admins() {

  const [admins, setAdmins] = useState([])
  const [colleges, setColleges] = useState([])

  const [email, setEmail] = useState('')
  const [collegeId, setCollegeId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('admin')

  const [roleFilter, setRoleFilter] =
    useState('ALL')

  useEffect(() => {
    loadData()
  }, [roleFilter])

  async function loadData() {

    let query = supabase
      .from('students')
      .select('*')
      .in('role', [
        'admin',
        'school_admin'
      ])

    // FILTERING FIX

    if (roleFilter !== 'ALL') {

      query = query.eq(
        'role',
        roleFilter
      )
    }

    const {
      data: adminsData
    } = await query.order(
      'created_at',
      { ascending: false }
    )

    const {
      data: collegesData
    } = await supabase
      .from('colleges')
      .select('*')

    const {
      data: students
    } = await supabase
      .from('students')
      .select(`
        id,
        role,
        college_id,
        school_id
      `)
      .eq('role', 'student')

    const updatedAdmins =
      (adminsData || []).map(admin => {

        let totalStudents = 0

        // SCHOOL ADMIN

        if (
          admin.role ===
          'school_admin'
        ) {

          totalStudents =
            (students || []).filter(
              s =>
                s.school_id &&
                s.school_id ===
                admin.school_id
            ).length

        } else {

          // COLLEGE ADMIN

          totalStudents =
            (students || []).filter(
              s =>
                s.college_id ===
                admin.college_id
            ).length
        }

        return {
          ...admin,
          totalStudents
        }
      })

    setAdmins(updatedAdmins || [])
    setColleges(collegesData || [])
  }

  function getCollegeName(id) {

    return (
      colleges.find(
        c => c.id === id
      )?.name || '—'
    )
  }

  async function createAdmin() {

    if (!email || !collegeId) {

      alert('Fill required fields')
      return
    }

    const selectedCollege =
      colleges.find(
        c => c.id === collegeId
      )

    if (!selectedCollege) {

      alert('Invalid college')
      return
    }

    const { error } =
      await supabase
        .from('students')
        .insert({

          email,

          role,

          college_id: collegeId,

          college_name:
            selectedCollege.name,

          first_name:
            firstName || null,

          last_name:
            lastName || null,

          phone:
            phone || null,

          is_active: true
        })

    if (error) {

      alert(error.message)
      return
    }

    setEmail('')
    setCollegeId('')
    setFirstName('')
    setLastName('')
    setPhone('')
    setRole('admin')

    loadData()
  }

  async function deleteAdmin(id) {

    if (
      !confirm(
        'Delete this admin?'
      )
    ) return

    await supabase
      .from('students')
      .delete()
      .eq('id', id)

    loadData()
  }

  async function toggleStatus(admin) {

    const newStatus =
      !admin.is_active

    // UPDATE ADMIN

    const { error } =
      await supabase
        .from('students')
        .update({
          is_active: newStatus
        })
        .eq('id', admin.id)

    if (error) {

      alert(error.message)
      return
    }

    // UPDATE STUDENTS ALSO

    if (
      admin.role ===
      'school_admin'
    ) {

      await supabase
        .from('students')
        .update({
          is_active: newStatus
        })
        .eq('role', 'student')
        .eq(
          'school_id',
          admin.school_id
        )

    } else {

      await supabase
        .from('students')
        .update({
          is_active: newStatus
        })
        .eq('role', 'student')
        .eq(
          'college_id',
          admin.college_id
        )
    }

    loadData()
  }

  return (

    <div style={styles.page}>

      <h1 style={styles.heading}>
        Admins
      </h1>

      {/* CREATE FORM */}

      <div style={styles.form}>

        <input
          placeholder="Email"
          value={email}
          onChange={e =>
            setEmail(e.target.value)
          }
          style={styles.input}
        />

        <input
          placeholder="First Name"
          value={firstName}
          onChange={e =>
            setFirstName(
              e.target.value
            )
          }
          style={styles.input}
        />

        <input
          placeholder="Last Name"
          value={lastName}
          onChange={e =>
            setLastName(
              e.target.value
            )
          }
          style={styles.input}
        />

        <input
          placeholder="Phone"
          value={phone}
          onChange={e =>
            setPhone(e.target.value)
          }
          style={styles.input}
        />

        <select
          value={role}
          onChange={e =>
            setRole(e.target.value)
          }
          style={styles.input}
        >

          <option value="admin">
            College Admin
          </option>

          <option value="school_admin">
            School Admin
          </option>

        </select>

        <select
          value={collegeId}
          onChange={e =>
            setCollegeId(
              e.target.value
            )
          }
          style={styles.input}
        >

          <option value="">
            Select College
          </option>

          {colleges.map(c => (

            <option
              key={c.id}
              value={c.id}
            >
              {c.name}
            </option>

          ))}

        </select>

        <button
          onClick={createAdmin}
          style={styles.btn}
        >
          Create Admin
        </button>

      </div>

      {/* FILTER */}

      <div
        style={{
          marginBottom: 20
        }}
      >

        <select
          value={roleFilter}
          onChange={e =>
            setRoleFilter(
              e.target.value
            )
          }
          style={styles.filter}
        >

          <option value="ALL">
            All Roles
          </option>

          <option value="admin">
            College Admins
          </option>

          <option value="school_admin">
            School Admins
          </option>

        </select>

      </div>

      {/* TABLE */}

      <table style={styles.table}>

        <thead>

          <tr>

            <th style={styles.th}>
              Email
            </th>

            <th style={styles.th}>
              Name
            </th>

            <th style={styles.th}>
              Phone
            </th>

            <th style={styles.th}>
              Role
            </th>

            <th style={styles.th}>
              College
            </th>

            <th style={styles.th}>
              Students
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

          {admins.map(a => (

            <tr key={a.id}>

              <td style={styles.td}>
                {a.email}
              </td>

              <td style={styles.td}>
                {a.first_name}
                {' '}
                {a.last_name}
              </td>

              <td style={styles.td}>
                {a.phone}
              </td>

              <td style={styles.td}>

                {a.role === 'admin'
                  ? 'College Admin'
                  : 'School Admin'}

              </td>

              <td style={styles.td}>
                {getCollegeName(
                  a.college_id
                )}
              </td>

              <td style={styles.td}>
                {a.totalStudents}
              </td>

              <td style={styles.td}>

                <button
                  onClick={() =>
                    toggleStatus(a)
                  }
                  style={{
                    ...styles.toggleBtn,

                    background:
                      a.is_active
                        ? '#16a34a'
                        : '#dc2626'
                  }}
                >

                  {a.is_active
                    ? 'ACTIVE'
                    : 'INACTIVE'}

                </button>

              </td>

              <td style={styles.td}>

                <button
                  onClick={() =>
                    deleteAdmin(a.id)
                  }
                  style={
                    styles.deleteBtn
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

const styles = {

  page: {
    padding: 30,
    color: '#111'
  },

  heading: {
    fontSize: 28,
    marginBottom: 25
  },

  form: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 25
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc',
    minWidth: 180
  },

  filter: {
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc',
    minWidth: 220
  },

  btn: {
    padding: '10px 18px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff'
  },

  th: {
    padding: 12,
    background: '#f1f5f9',
    border: '1px solid #ddd',
    textAlign: 'left'
  },

  td: {
    padding: 12,
    border: '1px solid #ddd'
  },

  deleteBtn: {
    background: '#dc2626',
    color: '#fff',
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600
  },

  toggleBtn: {
    color: '#fff',
    padding: '8px 14px',
    borderRadius: 20,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    minWidth: 100
  }
}
