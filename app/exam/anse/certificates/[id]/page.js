'use client'

import {
  useEffect,
  useState
} from 'react'

import { supabase }
from '../../../../../lib/supabase'

function toRoman(num) {

  const romans = {
    1:'I',
    2:'II',
    3:'III',
    4:'IV',
    5:'V',
    6:'VI',
    7:'VII',
    8:'VIII',
    9:'IX',
    10:'X'
  }

  return romans[num] || num
}

export default function CertificatePage({
  params
}) {

  const certificateId =
    params.id

  const [loading, setLoading] =
    useState(true)

  const [certificate, setCertificate] =
    useState(null)

  /* ======================================================
     LOAD CERTIFICATE
  ====================================================== */

  useEffect(() => {

    loadCertificate()

  }, [])

  async function loadCertificate() {

    try {

      const { data, error } =
        await supabase

          .from('anse_certificates')

          .select('*')

          .eq('id', certificateId)

          .single()

      if (error) {
        throw error
      }

      setCertificate(data)

    } catch (err) {

      console.error(err)

      alert(
        'Certificate not found'
      )

    } finally {

      setLoading(false)
    }
  }

  /* ======================================================
     DOWNLOAD
  ====================================================== */

  function downloadCertificate() {

    window.print()
  }

  /* ======================================================
     SHARE
  ====================================================== */

  async function shareCertificate() {

    const shareText = `🏅 Proud Moment!

I participated in the Aurelius National Scholarship Examination (ANSE) and received my digital achievement certificate.

#ANSE #Olympiad #Scholarship`

    if (navigator.share) {

      try {

        await navigator.share({

          title:
            'ANSE Certificate',

          text:
            shareText,

          url:
            window.location.href
        })

      } catch (err) {

        console.error(err)
      }

    } else {

      navigator.clipboard.writeText(
        window.location.href
      )

      alert(
        'Certificate link copied'
      )
    }
  }

  if (loading) {

    return (

      <div style={styles.loaderWrap}>

        <div style={styles.loader} />

        <p>
          Loading Certificate...
        </p>

      </div>
    )
  }

  if (!certificate) {

    return (

      <div style={styles.loaderWrap}>

        Certificate not found

      </div>
    )
  }

  const examYear =
    new Date(
      certificate.created_at ||
      certificate.issued_at ||
      new Date()
    ).getFullYear()

  return (

    <div style={styles.page}>

      {/* ACTIONS */}

      <div style={styles.topBar}>

        <button
          style={styles.actionBtn}
          onClick={downloadCertificate}
        >

          📥 Download

        </button>

        <button
          style={styles.actionBtn}
          onClick={shareCertificate}
        >

          📤 Share

        </button>

      </div>

      {/* CERTIFICATE */}

      <div
        id="certificate"
        style={styles.certificate}
      >

        <div style={styles.logo}>

          🏆

        </div>

        <p style={styles.smallTitle}>
          Aurelius National Scholarship Examination
        </p>

        <h1 style={styles.mainTitle}>
          Digital Certificate
        </h1>

        <div style={styles.typeBadge}>

          {certificate.certificate_type}

        </div>

        <p style={styles.presentedText}>
          This certificate is proudly presented to
        </p>

        <h2 style={styles.studentName}>

          {certificate.student_name}

        </h2>

        <p style={styles.details}>

          for participating in

          <strong>
            {' '}
            ANSE {examYear}
          </strong>

        </p>

        <p style={styles.details}>

          Subject:
          {' '}
          <strong>
            {certificate.olympiad_subject}
          </strong>

        </p>

        <p style={styles.details}>

          Grade:
          {' '}
          <strong>
            {toRoman(certificate.grade)}
          </strong>

        </p>

        {!!certificate.school_name && (

          <p style={styles.details}>

            School:
            {' '}

            <strong>
              {certificate.school_name}
            </strong>

          </p>

        )}

        {(certificate.national_rank ||
          certificate.state_rank ||
          certificate.district_rank) && (

          <div style={styles.rankBox}>

            <h3>
              Achievement Rankings
            </h3>

            {certificate.national_rank && (

              <p>

                🇮🇳 National Rank:
                {' '}
                <strong>
                  {certificate.national_rank}
                </strong>

              </p>

            )}

            {certificate.state_rank && (

              <p>

                🏆 State Rank:
                {' '}
                <strong>
                  {certificate.state_rank}
                </strong>

              </p>

            )}

            {certificate.district_rank && (

              <p>

                🥇 District Rank:
                {' '}
                <strong>
                  {certificate.district_rank}
                </strong>

              </p>

            )}

          </div>

        )}

        <div style={styles.footer}>

          <div>

            <p style={styles.footerLabel}>
              Certificate No
            </p>

            <p style={styles.footerValue}>

              {certificate.certificate_number}

            </p>

          </div>

          <div>

            <p style={styles.footerLabel}>
              Issued On
            </p>

            <p style={styles.footerValue}>

              {new Date(
                certificate.created_at ||
                new Date()
              ).toLocaleDateString()}

            </p>

          </div>

        </div>

      </div>

    </div>
  )
}

/* ======================================================
   STYLES
====================================================== */

const styles = {

  page: {

    minHeight: '100vh',

    background:
      'linear-gradient(135deg,#0f172a,#111827)',

    padding: 30,

    fontFamily:
      'system-ui, sans-serif'
  },

  topBar: {

    display: 'flex',

    justifyContent: 'center',

    gap: 14,

    marginBottom: 25,

    flexWrap: 'wrap'
  },

  actionBtn: {

    background:
      'linear-gradient(135deg,#06b6d4,#7c3aed)',

    color: '#fff',

    border: 'none',

    padding: '12px 20px',

    borderRadius: 12,

    fontWeight: 700,

    cursor: 'pointer',

    fontSize: 15
  },

  certificate: {

    maxWidth: 950,

    margin: '0 auto',

    background: '#fff',

    borderRadius: 24,

    padding: 50,

    textAlign: 'center',

    position: 'relative',

    overflow: 'hidden',

    boxShadow:
      '0 20px 60px rgba(0,0,0,0.35)',

    border:
      '12px solid #eab308'
  },

  logo: {

    fontSize: 60,

    marginBottom: 10
  },

  smallTitle: {

    fontSize: 15,

    color: '#6b7280',

    letterSpacing: 1.5,

    textTransform: 'uppercase'
  },

  mainTitle: {

    fontSize: 48,

    fontWeight: 900,

    marginTop: 10,

    marginBottom: 20,

    color: '#111827'
  },

  typeBadge: {

    display: 'inline-block',

    background:
      'linear-gradient(135deg,#06b6d4,#7c3aed)',

    color: '#fff',

    padding: '10px 18px',

    borderRadius: 999,

    fontWeight: 700,

    marginBottom: 30
  },

  presentedText: {

    fontSize: 18,

    color: '#4b5563'
  },

  studentName: {

    fontSize: 42,

    fontWeight: 900,

    marginTop: 14,

    marginBottom: 25,

    color: '#111827'
  },

  details: {

    fontSize: 18,

    marginTop: 12,

    color: '#374151'
  },

  rankBox: {

    marginTop: 35,

    background: '#f3f4f6',

    padding: 25,

    borderRadius: 18
  },

  footer: {

    marginTop: 50,

    display: 'flex',

    justifyContent: 'space-between',

    flexWrap: 'wrap',

    gap: 20
  },

  footerLabel: {

    fontSize: 13,

    color: '#6b7280',

    textTransform: 'uppercase'
  },

  footerValue: {

    fontSize: 16,

    fontWeight: 700,

    color: '#111827'
  },

  loaderWrap: {

    minHeight: '100vh',

    display: 'flex',

    flexDirection: 'column',

    justifyContent: 'center',

    alignItems: 'center',

    gap: 15
  },

  loader: {

    width: 40,

    height: 40,

    border:
      '4px solid #e5e7eb',

    borderTop:
      '4px solid #2563eb',

    borderRadius: '50%',

    animation:
      'spin 1s linear infinite'
  }
}
