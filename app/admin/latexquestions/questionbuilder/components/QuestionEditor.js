'use client'

import styles from '../styles'

export default function QuestionEditor({

  question,
  setQuestion,

  questionImage,

  setQuestionImage,

  ocrLoading,

  ocrProgress,

  onImageSelected

}){

  return(

    <div style={styles.card}>

      <h2 style={styles.cardTitle}>
        📷 Question OCR
      </h2>

      {/* ================= DROP ZONE ================= */}

      <div style={styles.dropZone}>

        <div style={styles.uploadIcon}>
          📄
        </div>

        <div style={styles.uploadTitle}>
          Paste or Upload Question Screenshot
        </div>

        <div style={styles.uploadText}>

          Press

          <b> Ctrl + V </b>

          after taking a screenshot

          <br/>

          or choose an image below.

        </div>

        <input

          type="file"

          accept="image/*"

          onChange={(e)=>{

            if(!e.target.files[0]) return

            const file = e.target.files[0]

            setQuestionImage(file)

            if(onImageSelected){

              onImageSelected(file)

            }

          }}

          style={{

            marginTop:20

          }}

        />

      </div>

      {/* ================= IMAGE ================= */}

      {questionImage && (

        <img

          src={URL.createObjectURL(questionImage)}

          alt="Question"

          style={styles.imagePreview}

        />

      )}

      {/* ================= OCR ================= */}

      {ocrLoading && (

        <div style={styles.progress}>

          Reading Question...

          {ocrProgress}%

        </div>

      )}

      {/* ================= EDITOR ================= */}

      <div style={{marginTop:25}}>

        <h3>

          Question

        </h3>

        <textarea

          value={question}

          onChange={(e)=>setQuestion(e.target.value)}

          placeholder="OCR result will appear here..."

          spellCheck={false}

          style={styles.textarea}

        />

      </div>

    </div>

  )

}
