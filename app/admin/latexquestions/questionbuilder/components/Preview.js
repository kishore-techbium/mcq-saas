'use client'

import { useEffect, useRef } from 'react'
import renderMathInElement from 'katex/contrib/auto-render'
import 'katex/dist/katex.min.css'
import styles from '../styles'

export default function Preview({

  question

}){

  const previewRef = useRef(null)

  useEffect(()=>{

    if(!previewRef.current) return

    previewRef.current.innerHTML = question || ''

    renderMathInElement(previewRef.current,{

      throwOnError:false,

      delimiters:[

        {
          left:'$$',
          right:'$$',
          display:true
        },

        {
          left:'$',
          right:'$',
          display:false
        }

      ]

    })

  },[question])

  return(

    <div style={styles.preview}>

      <div style={styles.previewTitle}>

        👁 Live Preview

      </div>

      <div
        style={{
          marginBottom:20,
          borderBottom:'1px solid #e5e7eb',
          paddingBottom:15
        }}
      >

        <div
          style={{
            fontSize:13,
            color:'#6b7280'
          }}
        >

          Question 1

        </div>

      </div>

      <div

        ref={previewRef}

        style={styles.question}

      />

    </div>

  )

}
