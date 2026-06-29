'use client'

import { useState } from 'react'

import Header from './components/Header'
import QuestionEditor from './components/QuestionEditor'
import Preview from './components/Preview'

import styles from './styles'

export default function QuestionBuilderPage(){

  /* ================= STATES ================= */

  const [question,setQuestion] = useState("")

  const [questionImage,setQuestionImage] = useState(null)

  const [ocrLoading,setOcrLoading] = useState(false)

  const [ocrProgress,setOcrProgress] = useState(0)

  /* ================= IMAGE SELECT ================= */

  function handleImageSelected(file){

    console.log(file)

    // OCR will be added in the next phase

  }

  return(

    <div style={styles.page}>

      <Header/>

      <div style={styles.container}>

        {/* LEFT */}

        <div style={styles.left}>

          <QuestionEditor

            question={question}
            setQuestion={setQuestion}

            questionImage={questionImage}
            setQuestionImage={setQuestionImage}

            ocrLoading={ocrLoading}
            ocrProgress={ocrProgress}

            onImageSelected={handleImageSelected}

          />

        </div>

        {/* RIGHT */}

        <div style={styles.right}>

          <Preview

            question={question}

          />

        </div>

      </div>

    </div>

  )

}
