'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ExpensesPage() {

  const amountRef = useRef(null)

  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [parties, setParties] = useState([])

  const [todayExpenses, setTodayExpenses] = useState([])
  const [todayTotal, setTodayTotal] = useState(0)
const [summary, setSummary] = useState([])
  const [saving, setSaving] = useState(false)

  const [showPartyBox, setShowPartyBox] = useState(false)
  const [showSubBox, setShowSubBox] = useState(false)

  const [newParty, setNewParty] = useState('')
  const [newSubCategory, setNewSubCategory] = useState('')

  const [lastEntry, setLastEntry] = useState(null)
  const [editingExpense, setEditingExpense] = useState(null)

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

  async function loadTodayExpenses() {

    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('ai_expense')
.select(`
  *,
  ai_project(project_name),
  ai_expense_category(category_name),
  ai_expense_subcategory(subcategory_name),
  ai_party(party_name)
`)
      .eq('expense_date', today)
      .order('created_at', { ascending: false })

  const rows = data || []

setTodayExpenses(rows)

let total = 0

const categoryTotals = {}

rows.forEach(row => {

  total += Number(row.amount || 0)

  const category =
    row.ai_expense_category?.category_name ||
    'Others'

  categoryTotals[category] =
    (categoryTotals[category] || 0) +
    Number(row.amount || 0)

})

setTodayTotal(total)

const summaryRows =
  Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount
    }))
    .sort((a, b) => b.amount - a.amount)

setSummary(summaryRows)
  }

  async function addParty() {

    if (!newParty.trim()) return

    const { data, error } = await supabase
      .from('ai_party')
      .insert({
        party_name: newParty,
        party_type: 'vendor'
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    await loadMasters()

    setForm({
      ...form,
      party_id: data.id
    })

    setNewParty('')
    setShowPartyBox(false)
  }

  async function addSubCategory() {

    if (!newSubCategory.trim()) {
      alert('Enter sub category')
      return
    }

    if (!form.category_id) {
      alert('Select category first')
      return
    }

    const { data, error } = await supabase
      .from('ai_expense_subcategory')
      .insert({
        category_id: form.category_id,
        subcategory_name: newSubCategory
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    await loadSubcategories(form.category_id)

    setForm({
      ...form,
      subcategory_id: data.id
    })

    setNewSubCategory('')
    setShowSubBox(false)
  }

  async function saveExpense() {

    if (!form.project_id) {
      alert('Select project')
      return
    }

    if (!form.category_id) {
      alert('Select category')
      return
    }

    if (!form.amount) {
      alert('Enter amount')
      return
    }

    setSaving(true)

    const payload = {
      expense_date: form.expense_date,
      project_id: form.project_id,
      category_id: form.category_id,
      subcategory_id: form.subcategory_id || null,
      party_id: form.party_id || null,
      payment_mode: form.payment_mode,
      amount: Number(form.amount),
      remarks: form.remarks
    }

  let error

if (editingExpense) {

  const result = await supabase
    .from('ai_expense')
    .update(payload)
    .eq('id', editingExpense)

  error = result.error

} else {

  const result = await supabase
    .from('ai_expense')
    .insert(payload)

  error = result.error
}

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    setLastEntry({
      project_id: form.project_id,
      category_id: form.category_id,
      subcategory_id: form.subcategory_id,
      payment_mode: form.payment_mode
    })

    setForm({
      ...form,
      party_id: '',
      amount: '',
      remarks: ''
    })
setEditingExpense(null)
    await loadTodayExpenses()

    if (amountRef.current) {
      amountRef.current.focus()
    }
  }
function editExpense(row) {

  setEditingExpense(row.id)

  setForm({
    expense_date: row.expense_date,
    project_id: row.project_id,
    category_id: row.category_id,
    subcategory_id: row.subcategory_id || '',
    party_id: row.party_id || '',
    payment_mode: row.payment_mode || 'Bank Transfer',
    amount: row.amount,
    remarks: row.remarks || ''
  })

  loadSubcategories(row.category_id)

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
  async function deleteExpense(id) {

  const yes = confirm(
    'Delete this expense?'
  )

  if (!yes) return

  const { error } = await supabase
    .from('ai_expense')
    .delete()
    .eq('id', id)

  if (error) {
    alert(error.message)
    return
  }

  loadTodayExpenses()
}
  function copyPrevious() {

    if (!lastEntry) {
      alert('No previous entry')
      return
    }

    setForm({
      ...form,
      ...lastEntry
    })

    loadSubcategories(lastEntry.category_id)
  }

  useEffect(() => {
    loadMasters()
    loadTodayExpenses()
  }, [])

return (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '500px 1fr',
      gap: '20px'
    }}
  >
 <div>

<h1>Expenses</h1>

<div>

  <div
    style={{
      border: '1px solid #ddd',
      padding: '20px'
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
          <option value="">Select Project</option>

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
          <option value="">Select Category</option>

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

        <button
          onClick={() =>
            setShowSubBox(!showSubBox)
          }
          style={{ marginLeft: '10px' }}
        >
          + Add Sub Category
        </button>

        {showSubBox && (
          <div style={{ marginTop: '10px' }}>
            <input
              placeholder="New Sub Category"
              value={newSubCategory}
              onChange={(e) =>
                setNewSubCategory(e.target.value)
              }
            />

            <button onClick={addSubCategory}>
              Save
            </button>
          </div>
        )}

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

        <button
          onClick={() =>
            setShowPartyBox(!showPartyBox)
          }
          style={{ marginLeft: '10px' }}
        >
          + Add Party
        </button>

        {showPartyBox && (
          <div style={{ marginTop: '10px' }}>
            <input
              placeholder="Party Name"
              value={newParty}
              onChange={(e) =>
                setNewParty(e.target.value)
              }
            />

            <button onClick={addParty}>
              Save
            </button>
          </div>
        )}

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
          <option>Bank Transfer</option>
          <option>PhonePe</option>
          <option>Cash</option>
        </select>

        <br /><br />

        <input
          ref={amountRef}
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
          rows="3"
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
          saving
  ? 'Saving...'
  : editingExpense
    ? 'Update Expense'
    : 'Save & Next'
        </button>

               <button
          onClick={copyPrevious}
          style={{ marginLeft: '10px' }}
        >
          Copy Previous
        </button>

      </div>

    </div>

</div>

<div>
            <div
  style={{
    background: '#f8fafc',
    border: '1px solid #ddd',
    padding: '15px',
    marginBottom: '20px'
  }}
>

  <h3>Today's Summary</h3>

  {summary.map(item => (

    <div
      key={item.category}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}
    >

      <span>
        {item.category}
      </span>

      <strong>
        ₹{item.amount.toLocaleString('en-IN')}
      </strong>

    </div>

  ))}

  <hr />

  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between'
    }}
  >

    <strong>Total</strong>

    <strong>
      ₹{todayTotal.toLocaleString('en-IN')}
    </strong>

  </div>

</div>

      <h3>Today's Entries</h3>

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

      <th>Sub Category</th>
<th>Mode</th>
      <th>Amount</th>

      <th>Paid To</th>

      <th>Remarks</th>
<th>Edit</th>
<th>Delete</th>
    </tr>
  </thead>

  <tbody>

    {todayExpenses.map(row => (

      <tr key={row.id}>

        <td>
          {row.expense_date}
        </td>

        <td>
          {row.ai_project?.project_name}
        </td>

        <td>
          {row.ai_expense_category?.category_name}
        </td>

        <td>
          {row.ai_expense_subcategory?.subcategory_name}
        </td>

     <td>
  {row.payment_mode}
</td>

<td>
  ₹
  {Number(row.amount || 0)
    .toLocaleString('en-IN')}
</td>
        <td>
          {row.ai_party?.party_name}
        </td>

        <td>
          {row.remarks}
        </td>
<td>
  <button
    onClick={() =>
      editExpense(row)
    }
  >
    Edit
  </button>
</td>

<td>
  <button
    onClick={() =>
      deleteExpense(row.id)
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

  </div>

  )
}
