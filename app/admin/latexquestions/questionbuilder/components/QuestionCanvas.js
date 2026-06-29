'use client'

import { useRef, useImperativeHandle, forwardRef } from 'react'
import styles from '../styles'

const QuestionCanvas = forwardRef(function QuestionCanvas({

    value,

    onChange,

    placeholder = "Type your question here..."

}, ref){

    const textareaRef = useRef(null)

    useImperativeHandle(ref,()=>({

        insertText(text){

            const textarea = textareaRef.current

            if(!textarea) return

            const start = textarea.selectionStart
            const end = textarea.selectionEnd

            const updated =
                value.substring(0,start) +
                text +
                value.substring(end)

            onChange(updated)

            requestAnimationFrame(()=>{

                textarea.focus()

                const position = start + text.length

                textarea.selectionStart = position
                textarea.selectionEnd = position

            })

        },

        replaceSelection(text){

            const textarea = textareaRef.current

            if(!textarea) return

            const start = textarea.selectionStart
            const end = textarea.selectionEnd

            const updated =
                value.substring(0,start) +
                text +
                value.substring(end)

            onChange(updated)

            requestAnimationFrame(()=>{

                textarea.focus()

                const position = start + text.length

                textarea.selectionStart = position
                textarea.selectionEnd = position

            })

        },

        focus(){

            textareaRef.current?.focus()

        }

    }))

    return(

        <textarea

            ref={textareaRef}

            style={styles.editorTextarea}

            value={value}

            placeholder={placeholder}

            onChange={(e)=>onChange(e.target.value)}

        />

    )

})

export default QuestionCanvas
