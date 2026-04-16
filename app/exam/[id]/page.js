'use client'

import { supabase } from '../../../lib/supabase'
import { getCurrentUser } from '../../../lib/auth'
import { useEffect, useRef, useState } from 'react'

function shuffleBySubject(questions) {
  const grouped = {}

  // group by subject
  questions.forEach(q => {
    if (!grouped[q.subject]) {
      grouped[q.subject] = []
    }
    grouped[q.subject].push(q)
  })

  // shuffle within each subject
  Object.keys(grouped).forEach(subject => {
    grouped[subject] = shuffleArray(grouped[subject])
  })

  // 🔥 FIX: enforce subject order
  const subjectOrder = ['Botany', 'Zoology', 'Physics', 'Chemistry']

  return subjectOrder.flatMap(sub => grouped[sub] || [])
}

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}
export default function ExamPage({ params }) {
  const examId = params.id
  const sessionId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('sessionId')
      : null

  if (!sessionId && typeof window !== 'undefined') {
    alert('Invalid exam session')
    window.location.href = '/dashboard'
  }

  const LS_KEY = `exam_session_${sessionId}`
  const [finalScore, setFinalScore] = useState(null)
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeSpent, setTimeSpent] = useState({})
  const questionStartTimeRef = useRef(Date.now())
  const [visited, setVisited] = useState(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [review, setReview] = useState(false)
  const [loading, setLoading] = useState(true)
const [showConfirm, setShowConfirm] = useState(false)  

  /* 🎥 PROCTORING REFS */
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const snapshotTimerRef = useRef(null)
  const captureIndexRef = useRef(0)

  /* ================= INIT (UNCHANGED) ================= */

  useEffect(() => {
    init()
    return () => stopProctoring()
  }, [])
useEffect(() => {
  const style = document.createElement('style')
  style.innerHTML = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)

  return () => {
    document.head.removeChild(style)
  }
}, [])
  
  async function init() {
   const currentUser = await getCurrentUser(supabase)

if (!currentUser) {
  window.location.href = '/'
  return
}

  const res = await fetch('/api/exam/full', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ examId })
})

const data = await res.json()

if (!res.ok || !data || data.error) {
  alert('Unable to load exam')
  window.location.href = '/dashboard'
  return
}

const examData = data.exam
    setExam(examData)
let finalQuestions = data.questions || []
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

if (examData && examData.camera_required && isMobile) {
  alert('Proctored exams must be taken on a desktop or laptop.')
  window.location.href = '/dashboard'
  return
}
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
    setAnswers(saved.answers || {})
    setCurrentIndex(saved.currentIndex || 0)
    setVisited(new Set(saved.visited || []))
    setTimeLeft(
                  saved.timeLeft ?? ((examData?.duration_minutes || 30) * 60)
                )
    setSubmitted(saved.submitted || false)
    setTimeSpent(saved.timeSpent || {})

console.log("API DATA:", data)
console.log("QUESTIONS:", data.questions)

// check if session already has order
const savedSession = JSON.parse(localStorage.getItem(LS_KEY) || '{}')

if (savedSession?.questionOrder && savedSession.examId === examId) {
  finalQuestions.sort(
    (a, b) =>
      savedSession.questionOrder.indexOf(a.id) -
      savedSession.questionOrder.indexOf(b.id)
  )
} else {
  // 🔥 NEW: subject-wise shuffle
  finalQuestions = shuffleBySubject(finalQuestions)

  persist({
    questionOrder: finalQuestions.map(q => q.id),
    examId: examId
  })
}

setQuestions(finalQuestions)
questionStartTimeRef.current = Date.now()    
    setLoading(false)

    /* 🎥 START PROCTORING IF REQUIRED */
   // if (examData.camera_required && !saved.submitted) {
   //   startProctoring()
   // }
  }

  /* ================= TIMER (UNCHANGED) ================= */

  useEffect(() => {
    if (loading || submitted || timeLeft <= 0) return

    const t = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1
        persist({ timeLeft: next })
        if (next <= 0) submitExam()
        return next
      })
    }, 1000)

    return () => clearInterval(t)
  }, [timeLeft, submitted, loading])


 const proctorStartedRef = useRef(false)

useEffect(() => {
  if (!exam) return
  if (!exam.camera_required) return
  if (!sessionId) return
  if (submitted) return
  
  if (proctorStartedRef.current) return

  proctorStartedRef.current = true
  startProctoring()

  return () => stopProctoring()
}, [exam, submitted])


useEffect(() => {
  if (questions.length > 0) {
    markVisited(currentIndex)
  }
}, [currentIndex, questions.length])

 
  /* ================= LOCAL STORAGE (UNCHANGED) ================= */

 function persist(extra = {}) {
  const existing = JSON.parse(localStorage.getItem(LS_KEY) || '{}')

  localStorage.setItem(
    LS_KEY,
    JSON.stringify({
      ...existing,
      answers,
      currentIndex,
      timeLeft,
      submitted,
      visited: Array.from(visited),
      timeSpent,
      ...extra
    })
  )
}

  function markVisited(index) {
    setVisited(prev => {
      const u = new Set(prev)
      u.add(index)
      persist({ visited: Array.from(u) })
      return u
    })
  }

  function selectAnswer(opt) {
    const qid = questions[currentIndex].id
    const updated = { ...answers, [qid]: opt }
    setAnswers(updated)
    persist({ answers: updated })
  }

function goToQuestion(i) {
  const currentQ = questions[currentIndex]

  if (currentQ) {
    const timeTaken = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)

    const updatedTime = {
      ...timeSpent,
      [currentQ.id]: (timeSpent[currentQ.id] || 0) + timeTaken
    }

    setTimeSpent(updatedTime)
    persist({ timeSpent: updatedTime })
  }

  setCurrentIndex(i)
  questionStartTimeRef.current = Date.now()

  markVisited(i)
  persist({ currentIndex: i })
}

  /* ================= 🎥 PROCTORING LOGIC ================= */

 async function startProctoring() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })

    streamRef.current = stream

    if (videoRef.current) {
      videoRef.current.srcObject = stream

      videoRef.current.play().catch(err => {
        console.warn("Play interrupted:", err)
      })
    }

    scheduleSnapshot()

  } catch (err) {
    console.error("Camera error:", err)
    alert("Camera initialization failed.")
    window.location.href = '/dashboard'
  }
}
  function scheduleSnapshot() {
     //const delay = 5000 // 5 seconds for testing
    const delay = Math.floor(Math.random() * 60000) + 20000 // 30–90 sec

    snapshotTimerRef.current = setTimeout(async () => {
      await captureSnapshot()
      scheduleSnapshot()
    }, delay)
  }
  /*
async function captureSnapshot() {
  console.log("📸 Attempting snapshot...")

  if (!videoRef.current) {
    console.log("❌ videoRef missing")
    return
  }

  console.log("Video dimensions:",
    videoRef.current.videoWidth,
    videoRef.current.videoHeight
  )

  if (videoRef.current.videoWidth === 0) {
    console.log("❌ Video not ready yet")
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = videoRef.current.videoWidth
  canvas.height = videoRef.current.videoHeight

  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoRef.current, 0, 0)

  const blob = await new Promise(res =>
    canvas.toBlob(res, 'image/jpeg', 0.8)
  )

  console.log("Blob created:", blob)

  if (!blob) {
    console.log("❌ Blob creation failed")
    return
  }

  captureIndexRef.current += 1
  const path = `${sessionId}/${captureIndexRef.current}.jpg`

  console.log("Uploading to:", path)

  const { error } = await supabase.storage
    .from('exam-proctoring')
    .upload(path, blob, { upsert: true })

  if (error) {
    console.error("❌ Upload failed:", error)
  } else {
    console.log("✅ Upload success:", path)
  }
}*/
  
  async function captureSnapshot() {
  console.log("📸 Capturing snapshot...")

  if (!videoRef.current) {
    console.log("❌ videoRef missing")
    return
  }
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0)

    const blob = await new Promise(res =>
      canvas.toBlob(res, 'image/jpeg', 0.8)
    )

    captureIndexRef.current += 1
    const path = `${sessionId}/${captureIndexRef.current}.jpg`

    const { error } = await supabase.storage
      .from('exam-proctoring')
      .upload(path, blob, { upsert: true })

    if (!error) {
    /*  const { data } = supabase.storage
        .from('exam-proctoring')
        .getPublicUrl(path)

      await supabase.from('proctoring_images').insert({
        exam_session_id: sessionId,
        image_url: data.publicUrl,
        capture_index: captureIndexRef.current
      })*/
      await supabase.from('proctoring_images').insert({
  exam_session_id: sessionId,
  image_url: path,   // store path only (NOT public URL)
  capture_index: captureIndexRef.current
})
    }
  }

function stopProctoring() {
  clearTimeout(snapshotTimerRef.current)

  if (streamRef.current) {
    streamRef.current.getTracks().forEach(t => t.stop())
  }
}


  /* ================= SUBMIT (MINIMAL ADD) ================= */
async function submitExam() {
const currentQ = questions[currentIndex]

if (currentQ) {
  const timeTaken = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)

  const updatedTime = {
    ...timeSpent,
    [currentQ.id]: (timeSpent[currentQ.id] || 0) + timeTaken
  }

  setTimeSpent(updatedTime)
  persist({ timeSpent: updatedTime })
}
  
  if (submitted) return

  setSubmitted(true)
  persist({ submitted: true })
  stopProctoring()

  let score = 0
  let correct = 0
  let wrong = 0

  const answerRows = [] // ✅ NEW

  questions.forEach(q => {
    const studentAnswer = answers[q.id]

    if (!studentAnswer) return

    const isCorrect = studentAnswer === q.correct_answer

    if (isCorrect) {
      score += exam.correct_marks || 4
      correct++
    } else {
      score -= Math.abs(exam.negative_marks || 1)
      wrong++
    }

    // ✅ NEW (analytics)
    answerRows.push({
      exam_session_id: sessionId,
      question_id: q.id,
      selected_answer: studentAnswer,
      correct_answer: q.correct_answer,
      is_correct: isCorrect
    })
  })

  const unattempted = questions.length - correct - wrong

  const accuracy =
    correct + wrong === 0
      ? 0
      : ((correct / (correct + wrong)) * 100).toFixed(2)

  setFinalScore({
    score,
    correct,
    wrong,
    unattempted,
    accuracy
  })

await fetch('/api/exam/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sessionId,
    answers,
    timeSpent,
    questionOrder: JSON.parse(localStorage.getItem(LS_KEY) || '{}')?.questionOrder,
    totalQuestions: questions.length, // 🔥 ADD THIS
    score
  })
})

  // ✅ NEW INSERT
  //if (answerRows.length > 0) {
   // await supabase.from('exam_answers').insert(answerRows)
  //}
}

  /* ================= UI (UNCHANGED) ================= */

  if (loading) return <p style={{ padding: 40 }}>Loading exam…</p>

  if (submitted && review) {
    return (
      <div style={styles.page}>
        <h1>📘 Exam Review</h1>
        <button onClick={() => window.location.href = '/dashboard'}>
          Back to Dashboard
        </button>
      </div>
    )
  }
function getRandomQuote() {
  const quotes = [
    "Success is the sum of small efforts repeated daily.",
    "Push yourself, because no one else will do it for you.",
    "Dream big. Start small. Act now.",
    "Consistency is what transforms average into excellence.",
    "Every expert was once a beginner.",
    "Your only limit is your mind.",
    "Hard work beats talent when talent doesn’t work hard.",
    "Stay focused and never give up."
  ]

  return quotes[Math.floor(Math.random() * quotes.length)]
}
if (submitted) {
  return (
    <div style={styles.successPage}>
      <div style={styles.successCard}>

        <div style={styles.successIcon}>🎉</div>

        <h1>Exam Submitted Successfully!</h1>

        <p style={{ color: '#555', marginTop: 10 }}>
          Great effort! Keep pushing your limits 🚀
        </p>

<p style={{ marginTop: 20, fontStyle: 'italic', color: '#444' }}>
  "{getRandomQuote()}"
</p>

        <p style={{ marginTop: 10, fontSize: 14, color: '#666' }}>
          You can view your results anytime from your dashboard.
        </p>

        <div style={{ marginTop: 25 }}>
          <button
            style={styles.primaryBtn}
            onClick={() => window.location.href = '/dashboard'}
          >
            🏠 Go to Dashboard
          </button>
        </div>

      </div>
    </div>
  )
}


  const q = questions[currentIndex]

  return (
    <div style={styles.page}>
      {/* 🎥 Hidden video */}
      <video
  ref={videoRef}
  autoPlay
  muted
  playsInline
  style={{ display: 'none' }}
/>


      <div style={styles.header}>
        <h2>{exam.title}</h2>
        <div style={styles.timer}>⏱ {formatTime(timeLeft)}</div>
      </div>

      <div style={styles.main}>
        <div style={styles.card}>
          <h3>
            Question {currentIndex + 1} of {questions.length}
          </h3>

          <div dangerouslySetInnerHTML={{ __html: q.question }} />

          {['A','B','C','D'].map(opt => (
            <label key={opt} style={styles.option}>
              <input
                type="radio"
                checked={answers[q.id] === opt}
                onChange={() => selectAnswer(opt)}
              />
             <span
  dangerouslySetInnerHTML={{
    __html: q.options
      ? q.options[opt.charCodeAt(0) - 65]
      : q[`option_${opt.toLowerCase()}`]
  }}
/>
            </label>
          ))}

          <div style={styles.nav}>
            <button
              disabled={currentIndex === 0}
              onClick={() => goToQuestion(currentIndex - 1)}
            >
              Prev
            </button>
            <button
              disabled={currentIndex === questions.length - 1}
              onClick={() => goToQuestion(currentIndex + 1)}
            >
              Next
            </button>
          <button
            style={styles.submitBtn}
            onClick={() => {
  if (timeLeft > 0) {
    setShowConfirm(true)
  } else {
    submitExam()
  }
}}
          >
          Submit
        </button>
          </div>
        </div>

   <div style={styles.paletteWrapper}>
  <div style={styles.paletteTitle}>Question Palette</div>

  {/* STATUS COUNTERS */}
  <div style={styles.statusGrid}>
    <div style={styles.statusItem}>
      <span style={{ ...styles.statusBox, background: '#16a34a' }} />
      Answered ({Object.keys(answers).length})
    </div>

    <div style={styles.statusItem}>
      <span style={{ ...styles.statusBox, background: '#dc2626' }} />
      Not Answered ({questions.filter((q, i) => visited.has(i) && !answers[q.id]).length})
    </div>

    <div style={styles.statusItem}>
      <span style={{ ...styles.statusBox, background: '#e5e7eb' }} />
      Not Visited ({questions.length - visited.size})
    </div>

    <div style={styles.statusItem}>
      <span style={{ ...styles.statusBox, background: '#2563eb' }} />
      Current
    </div>
  </div>

  {/* QUESTION GRID */}
  <div style={styles.palette}>
    {questions.map((q, i) => {

      let bg = '#e5e7eb' // Not Visited

      if (visited.has(i) && !answers[q.id]) {
        bg = '#dc2626' // Not Answered
      }

      if (answers[q.id]) {
        bg = '#16a34a' // Answered
      }

      if (i === currentIndex) {
        bg = '#2563eb' // Current
      }

      return (
        <button
          key={i}
          style={{
            ...styles.palBtn,
            backgroundColor: bg
          }}
          onClick={() => goToQuestion(i)}
        >
          {i + 1}
        </button>
      )
    })}
  </div>
</div>

        </div>
    {showConfirm && (
  <div style={styles.modalOverlay}>
    <div style={styles.modalBox}>
      <h3 style={{ marginBottom: 10 }}>⚠️ Submit Exam?</h3>

      <p style={{ color: '#555', marginBottom: 20 }}>
        You still have time left. Are you sure you want to submit?
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <button
          style={styles.secondaryBtn}
          onClick={() => setShowConfirm(false)}
        >
          Cancel
        </button>

        <button
          style={styles.primaryBtn}
onClick={() => {
  setShowConfirm(false)
  if (!submitted) submitExam()
}}
        >
          Submit
        </button>
      </div>
    </div>
  </div>
)}  
   
    </div>
   
  )
}

/* ================= HELPERS ================= */

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/* styles unchanged */



const styles = {
  page: {
    padding: 30,
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: 'system-ui, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  timer: {
    background: '#111827',
    color: '#fff',
    padding: '8px 14px',
    borderRadius: 8,
    fontWeight: 700
  },
main: {
  display: 'flex',
  gap: 20,
  flexWrap: 'wrap'
},
  card: {
    flex: 1,
    background: '#fff',
    padding: 24,
    borderRadius: 14,
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
  },
  option: {
    display: 'block',
    marginTop: 8
  },
  nav: {
    marginTop: 20,
    display: 'flex',
    gap: 10
  },
  submitBtn: {
    marginLeft: 'auto',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 6
  },
  paletteWrapper: {
  width: '100%',
  maxWidth: 280,
  background: '#ffffff',
  padding: 18,
  borderRadius: 18,
  boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
  alignSelf: 'flex-start'
},

paletteTitle: {
  marginBottom: 16,
  fontSize: 16,
  fontWeight: 700,
  textAlign: 'center',
  color: '#111827'
},

statusGrid: {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  marginBottom: 16,
  fontSize: 13,
  fontWeight: 500
},

statusItem: {
  display: 'flex',
  alignItems: 'center',
  gap: 6
},

statusBox: {
  width: 14,
  height: 14,
  borderRadius: 4
},

palette: {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 10
},

palBtn: {
  height: 44,
  border: 'none',
  borderRadius: 10,
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 14,
  boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
  transition: 'all 0.15s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
},
successPage: {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f1f5f9'
},

successCard: {
  background: '#ffffff',
  padding: 40,
  borderRadius: 16,
  textAlign: 'center',
  boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
  maxWidth: 400
},

successIcon: {
  fontSize: 50,
  marginBottom: 10
},

loader: {
  margin: '20px auto',
  width: 40,
  height: 40,
  border: '4px solid #e5e7eb',
  borderTop: '4px solid #2563eb',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
},

primaryBtn: {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '10px 16px',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer'
},

secondaryBtn: {
  background: '#e5e7eb',
  color: '#111',
  border: 'none',
  padding: '10px 16px',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer'
},

modalOverlay: {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
},

modalBox: {
  background: '#fff',
  padding: 24,
  borderRadius: 12,
  width: '90%',
  maxWidth: 400,
  textAlign: 'center'
}
}
