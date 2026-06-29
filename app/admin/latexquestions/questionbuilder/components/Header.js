'use client'

import styles from '../styles'

export default function Header() {

  return (

    <div style={styles.header}>

      {/* LEFT */}

      <div style={styles.titleSection}>

        <h1 style={styles.title}>
          🚀 Question Studio
        </h1>

        <div style={styles.subtitle}>
          Build exam questions faster using OCR and LaTeX
        </div>

      </div>

      {/* RIGHT */}

      <div style={styles.rightHeader}>

        <input
          type="number"
          defaultValue={1}
          min={1}
          placeholder="Question No"
          style={{
            ...styles.inputSmall,
            width:90
          }}
        />

        <select style={styles.select}>

          <option>Physics</option>
          <option>Chemistry</option>
          <option>Mathematics</option>
          <option>Biology</option>

        </select>

        <select style={styles.select}>

          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>

        </select>

        <input
          type="number"
          defaultValue={4}
          min={1}
          placeholder="Marks"
          style={{
            ...styles.inputSmall,
            width:80
          }}
        />

        <input
          type="number"
          defaultValue={1}
          min={0}
          placeholder="-ve"
          style={{
            ...styles.inputSmall,
            width:80
          }}
        />

      </div>

    </div>

  )

}
