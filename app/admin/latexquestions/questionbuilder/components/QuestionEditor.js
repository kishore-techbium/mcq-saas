'use client'

import { useRef } from 'react'

import SectionCard from './SectionCard'
import EditorToolbar from './EditorToolbar'
import QuestionCanvas from './QuestionCanvas'

import styles from '../styles'

export default function QuestionEditor({

    question,

    setQuestion

}){

    const canvasRef = useRef(null)

    function insertText(text){

        canvasRef.current?.insertText(text)

    }

    function copyQuestion(){

        navigator.clipboard.writeText(question)

    }

    function clearQuestion(){

        if(confirm("Clear question?")){

            setQuestion("")

            canvasRef.current?.focus()

        }

    }

    return(

        <SectionCard

            title="Question Editor"

            subtitle="Final editable question"

        >

            <EditorToolbar

                onInsert={insertText}

                onCopy={copyQuestion}

                onClear={clearQuestion}

            />

            <QuestionCanvas

                ref={canvasRef}

                value={question}

                onChange={setQuestion}

            />

            <div style={styles.editorFooter}>

                <div>

                    Characters : {question.length}

                </div>

                <div>

                    Lines : {

                        question
                        ? question.split("\n").length
                        : 0

                    }

                </div>

            </div>

        </SectionCard>

    )

}
