'use client'

import { useMemo, useState } from 'react'

import SectionCard from './SectionCard'
import insertLibrary from '../data/insertLibrary'
import styles from '../styles'

export default function InsertPalette({

    onInsert

}){

    const [search,setSearch] = useState("")

    const items = useMemo(()=>{

        const keyword = search.trim().toLowerCase()

        if(!keyword){

            return insertLibrary

        }

        return insertLibrary.filter(item=>{

            if(item.label.toLowerCase().includes(keyword)){

                return true

            }

            return item.keywords.some(k=>

                k.toLowerCase().includes(keyword)

            )

        })

    },[search])

    function handleInsert(item){

        if(onInsert){

            onInsert(item.insert)

        }

    }

    return(

        <SectionCard

            title="Insert"

            subtitle="Search symbols and templates"

        >

            <input

                type="text"

                value={search}

                onChange={(e)=>setSearch(e.target.value)}

                placeholder="Search..."

                style={styles.searchInput}

            />

            <div style={styles.insertGrid}>

                {

                    items.map(item=>(

                        <button

                            key={item.id}

                            style={styles.insertItem}

                            onClick={()=>handleInsert(item)}

                        >

                            <div style={styles.insertItemLabel}>

                                {item.label}

                            </div>

                            <div style={styles.insertItemValue}>

                                {item.insert}

                            </div>

                        </button>

                    ))

                }

                {

                    items.length===0 && (

                        <div style={styles.emptyState}>

                            No matching symbol found.

                        </div>

                    )

                }

            </div>

        </SectionCard>

    )

}
