'use client'

import styles from '../styles'

export default function SectionCard({

  title,

  subtitle,

  actions,

  children

}) {

  return (

    <div style={styles.card}>

      <div style={styles.cardHeader}>

        <div style={styles.cardHeaderLeft}>

          <div style={styles.cardTitle}>

            {title}

          </div>

          {

            subtitle && (

              <div style={styles.cardSubtitle}>

                {subtitle}

              </div>

            )

          }

        </div>

        {

          actions && (

            <div style={styles.cardActions}>

              {actions}

            </div>

          )

        }

      </div>

      <div style={styles.cardBody}>

        {children}

      </div>

    </div>

  )

}
