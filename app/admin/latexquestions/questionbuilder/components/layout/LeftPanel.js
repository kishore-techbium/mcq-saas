'use client'

import OCRPanel from '../OCRPanel'

export default function LeftPanel({

    setQuestion,

    setOptionsRaw

}){

    return(

        <>

            <OCRPanel

                title="Question OCR"

                subtitle="Capture only the question statement"

                applyLabel="Apply to Question"

                onApply={setQuestion}

            />

            <OCRPanel

                title="Options OCR"

                subtitle="Capture only the answer choices"

                applyLabel="Apply to Options"

                onApply={setOptionsRaw}

            />

        </>

    )

}
