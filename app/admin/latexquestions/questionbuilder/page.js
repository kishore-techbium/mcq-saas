'use client'

import { useState } from 'react'

import Header from './components/Header'

import LeftPanel from './components/layout/LeftPanel'
import MiddlePanel from './components/layout/MiddlePanel'
import RightPanel from './components/layout/RightPanel'

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

                    <LeftPanel

                        setQuestion={setQuestion}

                        setOptionsRaw={setOptionsRaw}

                    />

                </div>

                {/* MIDDLE */}

                <div style={styles.middle}>

                    <MiddlePanel

                        question={question}
                        setQuestion={setQuestion}

                        optionsRaw={optionsRaw}

                        options={options}
                        setOptions={setOptions}

                    />

                </div>

                {/* RIGHT */}

                <div style={styles.right}>

                    <RightPanel

                        question={question}

                        options={options}

                    />

                </div>

            </div>

        </div>

    )

}
