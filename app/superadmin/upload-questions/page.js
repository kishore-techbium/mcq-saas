'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { supabase } from '../../../lib/supabase'

import 'katex/dist/katex.min.css'
import renderMathInElement from 'katex/contrib/auto-render'

const BATCH_SIZE = 25

export default function UploadGlobalQuestions() {

  const [excelFile, setExcelFile] = useState(null)
  const [zipFile, setZipFile] = useState(null)

  const [batches, setBatches] = useState([])
  const [currentBatch, setCurrentBatch] = useState(0)

  const [imageMap, setImageMap] = useState({})
  const [uploadedImageUrls, setUploadedImageUrls] = useState({})

  const [uploading, setUploading] = useState(false)

  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')

  const [toast, setToast] = useState(null)

  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState('')

  // =========================================
  // LOAD GLOBAL EXAMS
  // =========================================
  useEffect(() => {
    loadGlobalExams()
  }, [])

  async function loadGlobalExams() {

  /* ================= GET GLOBAL EXAMS ================= */

  const {
    data: exams,
    error
  } = await supabase

    .from('exams')

    .select('id, title')

    .eq('is_global', true)

  if (error) {

    console.error(error)

    return
  }

  if (!exams || exams.length === 0) {

    setExams([])

    return
  }

  /* ================= GET ALREADY MAPPED EXAMS ================= */

  const examIds =
    exams.map(e => e.id)

  const {
    data: mapped
  } = await supabase

    .from('exam_questions')

    .select('exam_id')

    .in('exam_id', examIds)

  const mappedIds =
    [...new Set(
      (mapped || [])
        .map(m => m.exam_id)
    )]

  /* ================= REMOVE ALREADY UPLOADED ================= */

  const available =
    exams.filter(e =>
      !mappedIds.includes(e.id)
    )

  /* ================= SORT ALPHABETICALLY ================= */

  available.sort((a, b) =>
    a.title.localeCompare(b.title)
  )

  setExams(available)
}

  // =========================================
  // TOAST
  // =========================================
  function showToast(msg, type = 'success') {

    setToast({ msg, type })

    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  // =========================================
  // LATEX RENDER
  // =========================================
  function renderContent(el, text) {

    if (!el) return

    const value =
      text === null || text === undefined
        ? ''
        : String(text)

    el.innerHTML = value

    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    })
  }

  // =========================================
  // PROCESS ZIP
  // =========================================
  async function processZip(file) {

    if (!file) return {}

    const zip = await JSZip.loadAsync(file)

    const map = {}

    for (const f in zip.files) {

      const fileObj = zip.files[f]

      if (!fileObj.dir) {

        const cleanName = fileObj.name
          .split('/')
          .pop()
          .trim()
          .toLowerCase()

        map[cleanName] =
          await fileObj.async('blob')
      }
    }

    console.log('ZIP FILES:', Object.keys(map))

    return map
  }

  // =========================================
  // PREVIEW
  // =========================================
  async function handlePreview() {

    if (!excelFile) {
      return alert('Select Excel File')
    }

    const buffer = await excelFile.arrayBuffer()

    const wb = XLSX.read(buffer)

    const rawRows = XLSX.utils.sheet_to_json(
      wb.Sheets[wb.SheetNames[0]],
      { defval: '' }
    )

    const rows = rawRows.filter(
      r => Object.keys(r).length > 0
    )

    const zipMap = await processZip(zipFile)

    setImageMap(zipMap)

    const enriched = rows.map(r => ({

      ...r,

      image_name:
        r.image_name ||
        r['Image Name'] ||
        '',

      explanation_image_name:
        r.explanation_image_name ||
        r['Explanation Image Name'] ||
        '',

      rejected: false
    }))

    const temp = []

    for (
      let i = 0;
      i < enriched.length;
      i += BATCH_SIZE
    ) {
      temp.push(
        enriched.slice(i, i + BATCH_SIZE)
      )
    }

    setBatches(temp)

    setCurrentBatch(0)
  }

  // =========================================
  // UPDATE FIELD
  // =========================================
  function updateField(i, field, value) {

    const copy = [...batches]

    copy[currentBatch][i][field] = value

    setBatches(copy)
  }

  // =========================================
  // SINGLE IMAGE UPLOAD
  // =========================================
  async function uploadImage(blob, name) {

    const fileName =
      `question_images/${Date.now()}_${name}`

    const { error } = await supabase.storage
      .from('question-images')
      .upload(fileName, blob)

    if (error) {

      console.error(
        'IMAGE UPLOAD ERROR:',
        error
      )

      return null
    }

    const { data } = supabase.storage
      .from('question-images')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  // =========================================
  // PRE-UPLOAD ALL IMAGES
  // =========================================
  async function uploadAllImages() {

    const uploadedMap = {}

    const names = Object.keys(imageMap)

    if (names.length === 0) {
      return uploadedMap
    }

    setStatus('Uploading images...')

    let uploaded = 0

    for (const name of names) {

      const blob = imageMap[name]

      const url =
        await uploadImage(blob, name)

      if (url) {
        uploadedMap[name] = url
      }

      uploaded++

      const percent = Math.round(
        (uploaded / names.length) * 100
      )

      setProgress(percent)
    }

    return uploadedMap
  }

  // =========================================
  // UPLOAD BATCH
  // =========================================
  async function uploadBatch() {

    try {

      if (!selectedExam) {
        return alert('Select Global Exam')
      }

      setUploading(true)

      setProgress(0)

      setStatus('Preparing upload...')

      let uploadedUrls = uploadedImageUrls

      // upload images once
      if (
        Object.keys(uploadedUrls).length === 0 &&
        Object.keys(imageMap).length > 0
      ) {

        uploadedUrls =
          await uploadAllImages()

        setUploadedImageUrls(uploadedUrls)
      }

      const batch = batches[currentBatch]

      let uploadedCount = 0

      for (const r of batch) {

        if (r.rejected) continue

        setStatus(
          `Uploading question ${uploadedCount + 1} of ${batch.length}`
        )

        let q = r.question || ''

        let e = r.explanation || ''

        const qImg =
          (r.image_name || '')
            .trim()
            .toLowerCase()

        const eImg =
          (r.explanation_image_name || '')
            .trim()
            .toLowerCase()

        if (qImg && uploadedUrls[qImg]) {

          q += `
            <br/>
            <img 
              src="${uploadedUrls[qImg]}" 
              style="max-width:100%;margin-top:10px;"
            />
          `
        }

        if (eImg && uploadedUrls[eImg]) {

          e += `
            <br/>
            <img 
              src="${uploadedUrls[eImg]}" 
              style="max-width:100%;margin-top:10px;"
            />
          `
        }

        const payload = {

          exam_category:
            r.exam_category || '',

          subject:
            r.subject || '',

          chapter:
            r.chapter || '',

          subtopic:
            r.subtopic || '',

          difficulty:
            r.difficulty || '',

          question: q,

          option_a:
            r.option_a || '',

          option_b:
            r.option_b || '',

          option_c:
            r.option_c || '',

          option_d:
            r.option_d || '',

          correct_answer:
            r.correct_answer || '',

          explanation: e,

          college_id: null,

          is_active: true
        }

        const { data, error } =
          await supabase
            .from('question_bank')
            .insert([payload])
            .select()

        if (error) {

          console.error(error)

          showToast(
            'Question upload failed',
            'error'
          )

          setUploading(false)

          return
        }

        // MAP TO EXAM
        if (data && data.length > 0) {

          const { error: mapError } =
            await supabase
              .from('exam_questions')
              .insert([{
                exam_id: selectedExam,
                question_id: data[0].id,
                college_id: null
              }])

          if (mapError) {

            console.error(
              'MAPPING ERROR:',
              mapError
            )
          }
        }

        uploadedCount++

        const percent = Math.round(
          (uploadedCount / batch.length) * 100
        )

        setProgress(percent)
      }

      setUploading(false)

      if (
        currentBatch + 1 < batches.length
      ) {

        setCurrentBatch(
          currentBatch + 1
        )

        showToast(
          `Batch ${currentBatch + 1} uploaded`
        )

      } else {

        showToast(
          'All batches uploaded successfully ✅'
        )
      }

    } catch (err) {

      console.error(
        'UPLOAD CRASH:',
        err
      )

      showToast(
        'Unexpected error occurred',
        'error'
      )

      setUploading(false)
    }
  }

  // =========================================
  // CURRENT BATCH
  // =========================================
  const batch =
    batches[currentBatch] || []

  return (

    <div
      style={{
        maxWidth: 1100,
        margin: 'auto',
        padding: 20
      }}
    >

      {/* EXAM SELECT */}
      <div style={{ marginBottom: 15 }}>

        <label>
          <b>🎯 Select Global Exam</b>
        </label>

        <br />

        <select
          value={selectedExam}
          onChange={e =>
            setSelectedExam(e.target.value)
          }
          style={{
            width: '100%',
            padding: 10
          }}
        >

          <option value="">
            Select Global Exam
          </option>

          {exams.map(e => (
            <option
              key={e.id}
              value={e.id}
            >
              {e.title}
            </option>
          ))}
        </select>
      </div>

      <h2>
        📊 Upload Questions
      </h2>

      {/* EXCEL */}
      <label>
        📄 Select Excel File
      </label>

      <br />

      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={e =>
          setExcelFile(
            e.target.files[0]
          )
        }
      />

      <br /><br />

      {/* ZIP */}
      <label>
        🖼️ Select Images ZIP
      </label>

      <br />

      <input
        type="file"
        accept=".zip"
        onChange={e =>
          setZipFile(
            e.target.files[0]
          )
        }
      />

      <br /><br />

      <button onClick={handlePreview}>
        Preview
      </button>

      <br /><br />

      {/* PREVIEW */}
      {batch.map((r, i) => {

        const qImg =
          (r.image_name || '')
            .trim()
            .toLowerCase()

        const eImg =
          (r.explanation_image_name || '')
            .trim()
            .toLowerCase()

        return (

          <div
            key={i}
            style={{
              display: 'flex',
              gap: 20,
              marginBottom: 20,
              border: '1px solid #ddd',
              padding: 10
            }}
          >

            {/* LEFT */}
            <div
              style={{
                flex: 1,
                minWidth: 400
              }}
            >

              <textarea
                value={r.question || ''}
                onChange={e =>
                  updateField(
                    i,
                    'question',
                    e.target.value
                  )
                }
                style={{
                  width: '100%',
                  minHeight: 80,
                  marginBottom: 6,
                  padding: 6
                }}
              />

              {[
                'option_a',
                'option_b',
                'option_c',
                'option_d'
              ].map(op => (

                <textarea
                  key={op}
                  value={r[op] || ''}
                  onChange={e =>
                    updateField(
                      i,
                      op,
                      e.target.value
                    )
                  }
                  style={{
                    width: '100%',
                    minHeight: 50,
                    marginBottom: 6,
                    padding: 6,
                    border: '1px solid #ccc',
                    borderRadius: 4
                  }}
                />
              ))}

              <textarea
                value={
                  r.explanation || ''
                }
                onChange={e =>
                  updateField(
                    i,
                    'explanation',
                    e.target.value
                  )
                }
                style={{
                  width: '100%',
                  minHeight: 70,
                  marginTop: 8,
                  padding: 6,
                  border: '1px solid #ccc',
                  borderRadius: 4
                }}
              />
            </div>

            {/* RIGHT */}
            <div
              style={{
                flex: 1,
                minWidth: 400
              }}
            >

              <div
                ref={el =>
                  renderContent(
                    el,
                    r.question
                  )
                }
              />

              {qImg &&
                imageMap[qImg] && (
                  <img
                    src={URL.createObjectURL(
                      imageMap[qImg]
                    )}
                    width={200}
                  />
                )}

              {[
                'option_a',
                'option_b',
                'option_c',
                'option_d'
              ].map((op, idx) => (

                <div key={op}>

                  <b>
                    {String.fromCharCode(
                      65 + idx
                    )}.
                  </b>

                  <span
                    ref={el =>
                      renderContent(
                        el,
                        r[op]
                      )
                    }
                  />
                </div>
              ))}

              {r.explanation && (

                <div
                  ref={el =>
                    renderContent(
                      el,
                      r.explanation
                    )
                  }
                />
              )}

              {eImg &&
                imageMap[eImg] && (
                  <img
                    src={URL.createObjectURL(
                      imageMap[eImg]
                    )}
                    width={200}
                  />
                )}
            </div>
          </div>
        )
      })}

      {/* PAGINATION */}
      {batches.length > 0 && (
        <>
          <div>

            <button
              disabled={currentBatch === 0}
              onClick={() =>
                setCurrentBatch(
                  p => p - 1
                )
              }
            >
              Prev
            </button>

            <span>
              {' '}
              {currentBatch + 1} / {batches.length}{' '}
            </span>

            <button
              disabled={
                currentBatch ===
                batches.length - 1
              }
              onClick={() =>
                setCurrentBatch(
                  p => p + 1
                )
              }
            >
              Next
            </button>
          </div>

          <br />

          <button
            onClick={uploadBatch}
            disabled={uploading}
          >
            {uploading
              ? 'Uploading...'
              : 'Upload Batch'}
          </button>
        </>
      )}

      {/* PROGRESS */}
      {uploading && (

        <div
          style={{
            marginTop: 15
          }}
        >

          <div>{status}</div>

          <div
            style={{
              width: '100%',
              height: 20,
              background: '#eee'
            }}
          >

            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: '#22c55e'
              }}
            />
          </div>

          <div>{progress}%</div>
        </div>
      )}

      {/* TOAST */}
      {toast && (

        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background:
              toast.type === 'error'
                ? '#ef4444'
                : '#22c55e',
            color: '#fff',
            padding: 10,
            borderRadius: 5
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
