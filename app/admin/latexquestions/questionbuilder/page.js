'use client'


import { useState, useEffect } from 'react'
import Header from './components/Header'
import QuestionEditor from './components/QuestionEditor'
import Preview from './components/Preview'
import { recognizeImage } from "./services/ocr"
import styles from './styles'

export default function QuestionBuilderPage(){

  /* ================= STATES ================= */

  const [question,setQuestion] = useState("")

  const [questionImage,setQuestionImage] = useState(null)

  const [ocrLoading,setOcrLoading] = useState(false)

  const [ocrProgress,setOcrProgress] = useState(0)

  /* ================= IMAGE SELECT ================= */

async function handleImageSelected(file){

    try{

        setOcrLoading(true)

        setOcrProgress(0)

        const text = await recognizeImage(

            file,

            setOcrProgress

        )

        setQuestion(text)

    }

    catch(err){

        console.error(err)

        alert("OCR Failed")

    }

    finally{

        setOcrLoading(false)

    }

}
useEffect(()=>{

  function handlePaste(e){

    const items = e.clipboardData?.items

    if(!items) return

    for(const item of items){

      if(item.type.startsWith("image/")){

        const file = item.getAsFile()

        setQuestionImage(file)

        handleImageSelected(file)

        e.preventDefault()

        break

      }

    }

  }

  window.addEventListener("paste",handlePaste)

  return ()=>window.removeEventListener("paste",handlePaste)

},[])
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
