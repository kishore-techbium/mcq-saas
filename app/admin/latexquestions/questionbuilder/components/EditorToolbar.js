'use client'

import styles from '../styles'

const TOOLS = [

    {
        id:"convert",
        label:"⚡ Convert Formula",
        title:"Select a formula and convert it automatically"
    },

    {
        id:"divider"
    },

    {id:"sup",label:"x²"},
    {id:"sub",label:"x₂"},
    {id:"sqrt",label:"√"},
    {id:"frac",label:"a/b"},

    {id:"pi",label:"π"},
    {id:"alpha",label:"α"},
    {id:"beta",label:"β"},
    {id:"theta",label:"θ"},
    {id:"delta",label:"Δ"},

    {id:"sum",label:"Σ"},
    {id:"int",label:"∫"},

    {id:"le",label:"≤"},
    {id:"ge",label:"≥"},
    {id:"neq",label:"≠"},

    {id:"inf",label:"∞"},

    {id:"rightarrow",label:"→"},
    {id:"equilibrium",label:"⇌"},

    {id:"degree",label:"°"}

]

export default function EditorToolbar({

    onToolClick,

    onCopy,

    onClear

}){

    return(

        <div style={styles.toolbar}>

            {

                TOOLS.map((tool,index)=>{

                    if(tool.id==="divider"){

                        return(

                            <div

                                key={index}

                                style={styles.toolbarDivider}

                            />

                        )

                    }

                    if(tool.id==="convert"){

                        return(

                            <button

                                key={tool.id}

                                style={styles.convertButton}

                                onClick={()=>onToolClick(tool.id)}

                            >

                                {tool.label}

                            </button>

                        )

                    }

                    return(

                        <button

                            key={tool.id}

                            style={styles.toolbarButton}

                            onClick={()=>onToolClick(tool.id)}

                        >

                            {tool.label}

                        </button>

                    )

                })

            }

            <div style={{flex:1}}/>

            <button

                style={styles.toolbarButton}

                onClick={onCopy}

            >

                📋

            </button>

            <button

                style={styles.toolbarButton}

                onClick={onClear}

            >

                🗑

            </button>

        </div>

    )

}
