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

    function handleTool(tool){

        switch(tool){

            case "pi":

                canvasRef.current?.insertText("\\(\\pi\\)")
                break

            case "alpha":

                canvasRef.current?.insertText("α")
                break

            case "beta":

                canvasRef.current?.insertText("β")
                break

            case "theta":

                canvasRef.current?.insertText("θ")
                break

            case "delta":

                canvasRef.current?.insertText("Δ")
                break

            case "sum":

                canvasRef.current?.insertText("\\(\\sum\\)")
                break

            case "int":

                canvasRef.current?.insertText("\\(\\int\\)")
                break

case "sqrt":

    canvasRef.current?.convertSelectedFormula()

    break

            case "frac":
canvasRef.current?.convertSelectedFormula()
                break

            case "sup":

                canvasRef.current?.convertSelectedFormula()
                break

            case "sub":

                canvasRef.current?.convertSelectedFormula()
                break

            case "le":

                canvasRef.current?.insertText("≤")
                break

            case "ge":

                canvasRef.current?.insertText("≥")
                break

            case "neq":

                canvasRef.current?.insertText("≠")
                break

            case "inf":

                canvasRef.current?.insertText("\\(\\infty\\)")
                break

            case "rightarrow":

                canvasRef.current?.insertText("→")
                break

            case "equilibrium":

                canvasRef.current?.insertText("⇌")
                break

            case "degree":

                canvasRef.current?.insertText("°")
                break

            default:

                break

        }

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

            subtitle="Edit the OCR result"

        >

            <EditorToolbar

                onToolClick={handleTool}

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

                    Lines :

                    {

                        question

                        ?

                        question.split("\n").length

                        :

                        0

                    }

                </div>

            </div>

        </SectionCard>

    )

}
