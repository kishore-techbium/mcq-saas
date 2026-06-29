'use client'

import { useEffect, useRef, useState } from 'react'

import SectionCard from './SectionCard'
import { recognizeImage } from '../services/ocr'
import styles from '../styles'

export default function OCRPanel({

    title = "OCR",

    subtitle = "",

    applyLabel = "Apply",

    onApply

}) {

    const fileInputRef = useRef(null)

    const [image, setImage] = useState(null)

    const [imageUrl, setImageUrl] = useState("")

    const [ocrText, setOcrText] = useState("")

    const [loading, setLoading] = useState(false)

    const [progress, setProgress] = useState(0)

    useEffect(() => {

        function handlePaste(e) {

            const items = e.clipboardData?.items

            if (!items) return

            for (const item of items) {

                if (item.type.startsWith("image/")) {

                    const file = item.getAsFile()

                    loadImage(file)

                    e.preventDefault()

                    break

                }

            }

        }

        window.addEventListener("paste", handlePaste)

        return () => window.removeEventListener("paste", handlePaste)

    }, [])

    async function loadImage(file) {

        if (!file) return

        setImage(file)

        setImageUrl(URL.createObjectURL(file))

        setLoading(true)

        setProgress(0)

        try {

            const text = await recognizeImage(
                file,
                setProgress
            )

            setOcrText(text)

        }

        catch (err) {

            console.error(err)

            alert("OCR Failed")

        }

        finally {

            setLoading(false)

        }

    }

    function openFileDialog() {

        fileInputRef.current.click()

    }

    function clearAll() {

        setImage(null)

        setImageUrl("")

        setOcrText("")

        setProgress(0)

    }

    function applyOCR() {

        if (!onApply) return

        onApply(ocrText)

    }

    return (

        <SectionCard

            title={title}

            subtitle={subtitle}

        >

            <input

                ref={fileInputRef}

                type="file"

                accept="image/*"

                style={{ display: "none" }}

                onChange={(e) => loadImage(e.target.files[0])}

            />

            <div style={styles.buttonRow}>

                <button

                    style={styles.primaryButton}

                    onClick={openFileDialog}

                >

                    Upload Image

                </button>

                <button

                    style={styles.secondaryButton}

                    onClick={clearAll}

                >

                    Clear

                </button>

            </div>

            <div style={styles.helperText}>

                Tip: Press <strong>Ctrl + V</strong> to paste a screenshot.

            </div>

            {

                imageUrl && (

                    <img

                        src={imageUrl}

                        alt="OCR Preview"

                        style={styles.previewImage}

                    />

                )

            }

            {

                loading && (

                    <div style={styles.progressBox}>

                        Running OCR...

                        <br />

                        {progress}%

                    </div>

                )

            }

            <div style={styles.sectionTitle}>

                OCR Review

            </div>

            <textarea

                value={ocrText}

                onChange={(e) => setOcrText(e.target.value)}

                style={styles.editorTextarea}

                placeholder="OCR output will appear here..."

            />

            <div style={styles.buttonRow}>

                <button

                    style={styles.primaryButton}

                    disabled={!ocrText}

                    onClick={applyOCR}

                >

                    {applyLabel}

                </button>

            </div>

        </SectionCard>

    )

}
