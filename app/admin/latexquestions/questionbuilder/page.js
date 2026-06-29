'use client'

import { useState } from 'react'

import Header from './components/Header'
import QuestionOCR from './components/QuestionOCR'
import QuestionEditor from './components/QuestionEditor'
import Preview from './components/Preview'

import styles from './styles'

export default function QuestionBuilderPage() {

  /* ============================
     QUESTION STATE
  ============================ */

  const [question, setQuestion] = useState("")

  /* ============================
     OCR APPLY
  ============================ */

  function handleApplyOCR(text) {
    setQuestion(text)
  }

  return (
    <div style={styles.page}>

      <Header />

      <div style={styles.container}>

        {/* LEFT PANEL */}

        <div style={styles.left}>

          <QuestionOCR
            onApply={handleApplyOCR}
          />

          <QuestionEditor
            question={question}
            setQuestion={setQuestion}
          />

        </div>

        {/* RIGHT PANEL */}

        <div style={styles.right}>

          <Preview
            question={question}
          />

        </div>

      </div>

    </div>
  )
}
