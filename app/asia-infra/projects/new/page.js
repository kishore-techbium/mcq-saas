'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

export default function NewProjectPage() {

  const router = useRouter()

  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    project_name: '',
    client_name: '',
    work_order_number: '',
    work_order_value: '',
    retention_percentage: '5',
    status: 'active'
  })

  async function saveProject() {

    if (!form.project_name) {
      alert('Project Name Required')
      return
    }

    if (!form.client_name) {
      alert('Client Name Required')
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('ai_project')
      .insert({
        project_name: form.project_name,
        client_name: form.client_name,
        work_order_number: form.work_order_number,
        work_order_value:
          Number(form.work_order_value || 0),
        retention_percentage:
          Number(form.retention_percentage || 0),
        status: form.status
      })

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    alert('Project Created')

    router.push('/asia-infra/projects')
  }

  return (

    <div>

      <h1>New Project</h1>

      <br />

      <div>

        <label>
          Project Name
        </label>

        <br />

        <input
          value={form.project_name}
          onChange={(e) =>
            setForm({
              ...form,
              project_name: e.target.value
            })
          }
        />

      </div>

      <br />

      <div>

        <label>
          Client Name
        </label>

        <br />

        <input
          value={form.client_name}
          onChange={(e) =>
            setForm({
              ...form,
              client_name: e.target.value
            })
          }
        />

      </div>

      <br />

      <div>

        <label>
          WO Number
        </label>

        <br />

        <input
          value={form.work_order_number}
          onChange={(e) =>
            setForm({
              ...form,
              work_order_number: e.target.value
            })
          }
        />

      </div>

      <br />

      <div>

        <label>
          WO Value
        </label>

        <br />

        <input
          type="number"
          value={form.work_order_value}
          onChange={(e) =>
            setForm({
              ...form,
              work_order_value: e.target.value
            })
          }
        />

      </div>

      <br />

      <div>

        <label>
          Retention %
        </label>

        <br />

        <input
          type="number"
          value={form.retention_percentage}
          onChange={(e) =>
            setForm({
              ...form,
              retention_percentage: e.target.value
            })
          }
        />

      </div>

      <br />

      <button
        onClick={saveProject}
        disabled={saving}
      >
        {saving
          ? 'Saving...'
          : 'Save Project'}
      </button>

    </div>

  )
}
