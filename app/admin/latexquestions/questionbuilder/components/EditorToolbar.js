'use client'

import styles from '../styles'

export default function EditorToolbar({

  onInsert,
  onCopy,
  onClear

}) {

  function insert(text) {
    if (onInsert) {
      onInsert(text)
    }
  }

  return (

    <div style={styles.toolbar}>

      <button
        style={styles.toolbarButton}
        onClick={() => insert("\\(\\pi\\)")}
        title="Insert Pi"
      >
        π
      </button>

      <button
        style={styles.toolbarButton}
        onClick={() => insert("\\(\\sqrt{x}\\)")}
        title="Insert Square Root"
      >
        √
      </button>

      <button
        style={styles.toolbarButton}
        onClick={() => insert("\\(x^2\\)")}
        title="Insert Superscript"
      >
        x²
      </button>

      <button
        style={styles.toolbarButton}
        onClick={() => insert("\\(\\frac{a}{b}\\)")}
        title="Insert Fraction"
      >
        a/b
      </button>

      <div style={styles.toolbarDivider} />

      <button
        style={styles.toolbarButton}
        onClick={onCopy}
        title="Copy"
      >
        📋
      </button>

      <button
        style={styles.toolbarButton}
        onClick={onClear}
        title="Clear"
      >
        🗑
      </button>

    </div>

  )

}
