'use client'

import SectionCard from './SectionCard'
import styles from '../styles'

export default function QuestionEditor({

  question,

  setQuestion

}) {

  const characterCount = question.length

  const lineCount = question
    ? question.split('\n').length
    : 0

  return (

    <SectionCard

      title="Question Editor"

      subtitle="Edit the final question after reviewing OCR"

    >

      <textarea

        value={question}

        onChange={(e) => setQuestion(e.target.value)}

        placeholder="Start typing your question here..."

        style={styles.editorTextarea}

      />

      <div style={styles.editorFooter}>

        <div>

          <strong>Characters:</strong> {characterCount}

        </div>

        <div>

          <strong>Lines:</strong> {lineCount}

        </div>

      </div>

    </SectionCard>

  )

}
