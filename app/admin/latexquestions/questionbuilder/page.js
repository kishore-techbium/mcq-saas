'use client'

import { useState } from 'react'

import Header from './components/Header'
import OCRPanel from './components/OCRPanel'
import QuestionEditor from './components/QuestionEditor'
import OptionsEditor from './components/OptionsEditor'
import Preview from './components/Preview'

import styles from './styles'

export default function QuestionBuilderPage(){

    const [question,setQuestion] = useState("")

    const [optionsRaw,setOptionsRaw] = useState("")

    const [options,setOptions] = useState([])

    return(

        <div style={styles.page}>

            <Header/>

            <div style={styles.container}>

                {/* LEFT */}

                <div style={styles.left}>

                    <OCRPanel

                        title="Question OCR"

                        subtitle="Capture only the question statement"

                        applyLabel="Apply to Question"

                        onApply={setQuestion}

                    />

                    <QuestionEditor

                        question={question}

                        setQuestion={setQuestion}

                    />

                    <OCRPanel

                        title="Options OCR"

                        subtitle="Capture only the answer choices"

                        applyLabel="Apply to Options"

                        onApply={setOptionsRaw}

                    />

                    <OptionsEditor

                        rawText={optionsRaw}

                        options={options}

                        setOptions={setOptions}

                    />

                </div>

                {/* RIGHT */}

                <div style={styles.right}>

                    <Preview

                        question={question}

                        options={options}

                    />

                </div>

            </div>

        </div>

    )

}
