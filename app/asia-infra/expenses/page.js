'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ExpensesPage() {

  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [parties, setParties] = useState([])
  const [expenses, setExpenses] = useState([])

  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    project_id: '',
    category_id: '',
    subcategory_id: '',
    party_id: '',
    payment_mode: 'Bank Transfer',
    amount: '',
    remarks: ''
  })

  async function loadMasters() {

    const { data: projectData } = await supabase
      .from('ai_project')
      .select('*')
      .order('project_name')

    const { data: categoryData } = await supabase
      .from('ai_expense_category')
      .select('*')
      .order('category_name')

    const { data: partyData } = await supabase
      .from('ai_party')
      .select('*')
      .order('party_name')

    setProjects(projectData || [])
    setCategories(categoryData || [])
    setParties(partyData || [])
  }

  async function loadExpenses() {

    const { data } = await supabase
      .from('ai_expense')
      .select(`
        *,
        ai_project(project_name),
        ai_expense_category(category_name),
        ai_party(party_name)
      `)
      .order('expense_date', { ascending: false })
      .limit(50)

    setExpenses(data || [])
  }

  async function loadSubcategories(categoryId) {

    if (!categoryId) {
      setSubcategories([])
      return
    }

    const { data } = await supabase
      .from('ai_expense_subcategory')
      .select('*')
      .eq('category_id', categoryId)
      .order('subcategory_name')

    setSubcategories(data || [])
  }

  async function saveExpense() {

    if (!form.project_id) {
      alert('Select Project')
      return
    }

    if (!form.category_id) {
      alert('Select Category')
      return
    }

    if (!form.amount) {
      alert('Enter Amount')
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('ai_expense')
      .insert({
        expense_date: form.expense_date,
        project_id: form.project_id,
        category_id: form.category_id,
        subcategory_id: form.subcategory_id || null,
        party_id: form.party_id || null,
        remarks:
          `[${form.payment_mode}] ${form.remarks}`,
        amount: Number(form.amount)
      })

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    alert('Expense Saved')

    setForm({
      ...form,
      amount: '',
      remarks: ''
    })

    loadExpenses()
  }

  useEffect(() => {
    loadMasters()
    loadExpenses()
  }, [])

  return (
    <div>

      <h1>Expenses</h1>

      <div
        style={{
          border: '1px solid #ddd',
          padding: '20px',
          marginBottom: '30px'
        }}
      >

        <h3>New Expense</h3>

        <input
          type="date"
          value={form.expense_date}
          onChange={(e) =>
            setForm({
              ...form,
              expense_date: e.target.value
            })
          }
        />

        <br /><br />

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

        <select
          value={form.category_id}
          onChange={(e) => {

            loadSubcategories(e.target.value)

            setForm({
              ...form,
              category_id: e.target.value,
              subcategory_id: ''
            })
          }}
        >
          <option value="">
            Select Category
          </option>

          {categories.map(category => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.category_name}
            </option>
          ))}
        </select>

        <br /><br />

        <select
          value={form.subcategory_id}
          onChange={(e) =>
            setForm({
              ...form,
              subcategory_id: e.target.value
            })
          }
        >
          <option value="">
            Select Sub Category
          </option>

          {subcategories.map(sub => (
            <option
              key={sub.id}
              value={sub.id}
            >
              {sub.subcategory_name}
            </option>
          ))}
        </select>

        <br /><br />

        <select
          value={form.party_id}
          onChange={(e) =>
            setForm({
              ...form,
              party_id: e.target.value
            })
          }
        >
          <option value="">
            Paid To
          </option>

          {parties.map(party => (
            <option
              key={party.id}
              value={party.id}
            >
              {party.party_name}
            </option>
          ))}
        </select>

        <br /><br />

        <select
          value={form.payment_mode}
          onChange={(e) =>
            setForm({
              ...form,
              payment_mode: e.target.value
            })
          }
        >
          <option>
            Bank Transfer
          </option>

          <option>
            PhonePe
          </option>

          <option>
            Cash
          </option>
        </select>

        <br /><br />

        <input
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) =>
            setForm({
              ...form,
              amount: e.target.value
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
              remarks: e.target.value
            })
          }
        />

        <br /><br />

        <button
          onClick={saveExpense}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Expense'}
        </button>

      </div>

      <h3>Recent Expenses</h3>

      <table
        border="1"
        cellPadding="8"
        width="100%"
      >
        <thead>
          <tr>
            <th>Date</th>
            <th>Project</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Paid To</th>
          </tr>
        </thead>

        <tbody>

          {expenses.map(expense => (

            <tr key={expense.id}>

              <td>
                {expense.expense_date}
              </td>

              <td>
                {expense.ai_project?.project_name}
              </td>

              <td>
                {expense.ai_expense_category?.category_name}
              </td>

              <td>
                ₹{Number(
                  expense.amount || 0
                ).toLocaleString('en-IN')}
              </td>

              <td>
                {expense.ai_party?.party_name}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  )
}
