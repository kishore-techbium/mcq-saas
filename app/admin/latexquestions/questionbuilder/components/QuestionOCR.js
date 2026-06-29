
'use client'

import { useRef, useState, useEffect } from 'react'
import { recognizeImage } from '../services/ocr'
import styles from '../styles'

export default function QuestionOCR({

    onApply

}){

    const fileInputRef = useRef(null)

    const [image,setImage] = useState(null)

    const [imageUrl,setImageUrl] = useState("")

    const [ocrText,setOcrText] = useState("")

    const [loading,setLoading] = useState(false)

    const [progress,setProgress] = useState(0)

    useEffect(()=>{

        function handlePaste(e){

            const items = e.clipboardData?.items

            if(!items) return

            for(const item of items){

                if(item.type.startsWith("image/")){

                    const file = item.getAsFile()

                    loadImage(file)

                    e.preventDefault()

                    break

                }

            }

        }

        window.addEventListener("paste",handlePaste)

        return ()=>window.removeEventListener("paste",handlePaste)

    },[])

    async function loadImage(file){

        if(!file) return

        setImage(file)

        setImageUrl(URL.createObjectURL(file))

        setLoading(true)

        setProgress(0)

        try{

            const text = await recognizeImage(

                file,

                setProgress

            )

            setOcrText(text)

        }

        catch(err){

            console.error(err)

            alert("OCR Failed")

        }

        finally{

            setLoading(false)

        }

    }

    function chooseImage(){

        fileInputRef.current.click()

    }

    function clearAll(){

        setImage(null)

        setImageUrl("")

        setOcrText("")

        setProgress(0)

    }

    return(

        <div style={styles.card}>

            <div style={styles.cardHeader}>

                Question Capture

            </div>

            <div style={styles.cardBody}>

                <input

                    ref={fileInputRef}

                    type="file"

                    accept="image/*"

                    style={{display:"none"}}

                    onChange={(e)=>loadImage(e.target.files[0])}

                />

                <button

                    style={styles.primaryButton}

                    onClick={chooseImage}

                >

                    Upload Image

                </button>

                <div style={styles.helperText}>

                    or press <b>Ctrl + V</b> to paste a screenshot

                </div>

                {

                    imageUrl && (

                        <img

                            src={imageUrl}

                            alt="Question"

                            style={styles.previewImage}

                        />

                    )

                }

                {

                    loading && (

                        <div style={styles.progressBox}>

                            Running OCR...

                            <br/>

                            {progress}%

                        </div>

                    )

                }

                <div style={styles.sectionTitle}>

                    OCR Review

                </div>

                <textarea

                    style={styles.editorTextarea}

                    value={ocrText}

                    onChange={(e)=>setOcrText(e.target.value)}

                    placeholder="OCR output will appear here..."

                />

                <div style={styles.buttonRow}>

                    <button

                        style={styles.primaryButton}

                        onClick={()=>onApply(ocrText)}

                        disabled={!ocrText}

                    >

                        Apply

                    </button>

                    <button

                        style={styles.secondaryButton}

                        onClick={clearAll}

                    >

                        Clear

                    </button>

                </div>

            </div>

        </div>

    )

}
