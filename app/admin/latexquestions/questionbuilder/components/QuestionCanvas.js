'use client'

import {
    forwardRef,
    useImperativeHandle,
    useRef
} from 'react'

import { convertFormula } from '../services/formulaConverter'
import styles from '../styles'

const QuestionCanvas = forwardRef(function QuestionCanvas({

    value,

    onChange

},ref){

    const textareaRef = useRef(null)

    useImperativeHandle(ref,()=>({

        focus(){

            textareaRef.current.focus()

        },

        insertText(text){

            const textarea = textareaRef.current

            const start = textarea.selectionStart
            const end = textarea.selectionEnd

            const updated =

                value.substring(0,start)+
                text+
                value.substring(end)

            onChange(updated)

            requestAnimationFrame(()=>{

                textarea.focus()

                textarea.selectionStart =
                textarea.selectionEnd =
                start + text.length

            })

        },

        convertSelectedFormula(){

            const textarea = textareaRef.current

            const start = textarea.selectionStart
            const end = textarea.selectionEnd

            if(start===end){

                alert("Select a formula first.")

                return

            }

            const selected = value.substring(start,end)

            const converted = convertFormula(selected)

            const updated =

                value.substring(0,start)+
                converted+
                value.substring(end)

            onChange(updated)

            requestAnimationFrame(()=>{

                textarea.focus()

                textarea.selectionStart=start

                textarea.selectionEnd=start+converted.length

            })

        }

    }))

    return(

        <textarea

            ref={textareaRef}

            value={value}

            onChange={(e)=>onChange(e.target.value)}

            spellCheck={false}

            placeholder="Question..."

            style={styles.editorTextarea}

        />

    )

})

export default QuestionCanvas
