'use client'

import { useEffect } from 'react'

import SectionCard from './SectionCard'
import { parseOptions } from '../services/optionsParser'
import styles from '../styles'

export default function OptionsEditor({

    rawText,

    options,

    setOptions

}){

    useEffect(()=>{

        if(!rawText){

            setOptions([])

            return

        }

        const parsed = parseOptions(rawText)

        setOptions(parsed)

    },[rawText])

    function updateOption(index,value){

        const updated=[...options]

        updated[index]=value

        setOptions(updated)

    }

    function addOption(){

        setOptions([

            ...options,

            ""

        ])

    }

    function removeOption(index){

        const updated=options.filter((_,i)=>i!==index)

        setOptions(updated)

    }

    return(

        <SectionCard

            title="Options Editor"

            subtitle="Review and edit answer choices"

        >

            {

                options.length===0 && (

                    <div style={styles.emptyState}>

                        Run Options OCR and click Apply.

                    </div>

                )

            }

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

                            style={styles.optionTextarea}

                            value={option}

                            onChange={(e)=>{

                                updateOption(

                                    index,

                                    e.target.value

                                )

                            }}

                        />

                        <button

                            style={styles.deleteOptionButton}

                            onClick={()=>removeOption(index)}

                        >

                            ✕

                        </button>

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
