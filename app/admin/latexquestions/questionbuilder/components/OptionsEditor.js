'use client'

import { useEffect } from 'react'

import SectionCard from './SectionCard'
import styles from '../styles'

export default function OptionsEditor({

    rawText,

    options,

    setOptions

}){

    useEffect(()=>{

        if(!rawText) return

        parseOptions(rawText)

    },[rawText])

    function parseOptions(text){

        let cleaned = text

        cleaned = cleaned.replace(/\r/g,'')

        const parts = cleaned.split(

            /\n\s*(?:A[\.\)]|\(A\)|B[\.\)]|\(B\)|C[\.\)]|\(C\)|D[\.\)]|\(D\)|1[\.\)]|2[\.\)]|3[\.\)]|4[\.\)])/i

        )

        const parsed = parts

            .map(x=>x.trim())

            .filter(x=>x.length)

        if(parsed.length){

            setOptions(parsed)

        }

    }

    function updateOption(index,value){

        const copy=[...options]

        copy[index]=value

        setOptions(copy)

    }

    function addOption(){

        setOptions([

            ...options,

            ""

        ])

    }

    return(

        <SectionCard

            title="Options Editor"

            subtitle="Review and edit parsed options"

        >

            {

                options.map((option,index)=>(

                    <div

                        key={index}

                        style={styles.optionRow}

                    >

                        <div style={styles.optionLabel}>

                            {

                                String.fromCharCode(

                                    65+index

                                )

                            }

                        </div>

                        <textarea

                            value={option}

                            onChange={(e)=>{

                                updateOption(

                                    index,

                                    e.target.value

                                )

                            }}

                            style={styles.optionTextarea}

                        />

                    </div>

                ))

            }

            <button

                style={styles.secondaryButton}

                onClick={addOption}

            >

                + Add Option

            </button>

        </SectionCard>

    )

}
