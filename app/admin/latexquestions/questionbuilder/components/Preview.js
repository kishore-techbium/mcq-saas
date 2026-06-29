'use client'

import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

import SectionCard from './SectionCard'
import styles from '../styles'

export default function Preview({

    question,

    options = []

}){

    function renderLatex(text){

        if(!text) return null

        const parts = text.split(/(\\\(.*?\\\)|\\\[.*?\\\])/gs)

        return parts.map((part,index)=>{

            if(part.startsWith("\\(") && part.endsWith("\\)")){

                return(

                    <InlineMath

                        key={index}

                        math={part.slice(2,-2)}

                    />

                )

            }

            if(part.startsWith("\\[") && part.endsWith("\\]")){

                return(

                    <BlockMath

                        key={index}

                        math={part.slice(2,-2)}

                    />

                )

            }

            return(

                <span

                    key={index}

                    style={{whiteSpace:"pre-wrap"}}

                >

                    {part}

                </span>

            )

        })

    }

    return(

        <SectionCard

            title="Live Preview"

            subtitle="Exactly how the question will appear"

        >

            <div style={styles.previewContainer}>

                <div style={styles.previewQuestion}>

                    {renderLatex(question)}

                </div>

                {

                    options.length>0 && (

                        <div style={styles.previewOptions}>

                            {

                                options.map((option,index)=>(

                                    <div

                                        key={index}

                                        style={styles.previewOption}

                                    >

                                        <div style={styles.previewOptionLabel}>

                                            {

                                                String.fromCharCode(

                                                    65+index

                                                )

                                            }.

                                        </div>

                                        <div style={styles.previewOptionText}>

                                            {

                                                renderLatex(option)

                                            }

                                        </div>

                                    </div>

                                ))

                            }

                        </div>

                    )

                }

            </div>

        </SectionCard>

    )

}
