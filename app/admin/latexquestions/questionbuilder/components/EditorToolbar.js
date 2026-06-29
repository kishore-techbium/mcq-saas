'use client'

import styles from '../styles'

const TOOLS = [

    { id:'sup',  label:'x²', tip:'Superscript' },
    { id:'sub',  label:'x₂', tip:'Subscript' },

    { id:'sqrt', label:'√',  tip:'Square Root' },
    { id:'frac', label:'a⁄b', tip:'Fraction' },

    { id:'pi',   label:'π', tip:'Pi' },
    { id:'alpha',label:'α', tip:'Alpha' },
    { id:'beta', label:'β', tip:'Beta' },
    { id:'theta',label:'θ', tip:'Theta' },
    { id:'delta',label:'Δ', tip:'Delta' },

    { id:'sum',  label:'Σ', tip:'Summation' },
    { id:'int',  label:'∫', tip:'Integral' },

    { id:'le',   label:'≤', tip:'Less Than Equal' },
    { id:'ge',   label:'≥', tip:'Greater Than Equal' },
    { id:'neq',  label:'≠', tip:'Not Equal' },

    { id:'inf',  label:'∞', tip:'Infinity' },

    { id:'rightarrow', label:'→', tip:'Arrow' },
    { id:'equilibrium',label:'⇌', tip:'Equilibrium' },

    { id:'degree',label:'°', tip:'Degree' }

]

export default function EditorToolbar({

    onToolClick,

    onCopy,

    onClear

}){

    return(

        <div style={styles.toolbar}>

            {

                TOOLS.map(tool=>(

                    <button

                        key={tool.id}

                        type="button"

                        title={tool.tip}

                        style={styles.toolbarButton}

                        onClick={()=>{

                            if(onToolClick){

                                onToolClick(tool.id)

                            }

                        }}

                    >

                        {tool.label}

                    </button>

                ))

            }

            <div style={styles.toolbarDivider}/>

            <button

                type="button"

                style={styles.toolbarButton}

                onClick={onCopy}

                title="Copy"

            >

                📋

            </button>

            <button

                type="button"

                style={styles.toolbarButton}

                onClick={onClear}

                title="Clear"

            >

                🗑

            </button>

        </div>

    )

}
