'use client'

import { useEffect, useState, useRef } from 'react'
import { getAdminCollege } from '../../../lib/getAdminCollege'

import * as XLSX from 'xlsx'

import 'katex/dist/katex.min.css'

import Tesseract from 'tesseract.js'

import renderMathInElement from 'katex/contrib/auto-render'

import {
  Document,
  Packer,
  Paragraph,
  TextRun
} from 'docx'

import {
  mathJaxReady,
  convertLatex2Math
} from '@hungknguyen/docx-math-converter'


export default function QuestionStudioPage() {

  /* =========================================================
     AUTH
  ========================================================= */

  const [adminName, setAdminName] = useState('')
  const [loading, setLoading] = useState(true)


  /* =========================================================
     QUESTION DATA
  ========================================================= */

  const [question, setQuestion] = useState('')

  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [optionC, setOptionC] = useState('')
  const [optionD, setOptionD] = useState('')

  const [correctAnswer, setCorrectAnswer] = useState('A')

  const [explanation, setExplanation] = useState('')


  /* =========================================================
     ACTIVE FIELD
  ========================================================= */

  const [activeField, setActiveField] = useState('question')


  /* =========================================================
     FORMULA TAB
  ========================================================= */

  const [activeFormulaTab, setActiveFormulaTab] =
    useState('physics')


  /* =========================================================
     OCR
  ========================================================= */

  const [imageFile, setImageFile] = useState(null)

  const [imagePreview, setImagePreview] =
    useState(null)

  const [ocrLoading, setOcrLoading] =
    useState(false)

  const [ocrProgress, setOcrProgress] =
    useState(0)

  const [dragActive, setDragActive] =
    useState(false)


  /* =========================================================
     EXCEL
  ========================================================= */

  const [excelFile, setExcelFile] =
    useState(null)

  const [excelPreview, setExcelPreview] =
    useState([])

  const [processedData, setProcessedData] =
    useState([])


  /* =========================================================
     WORD
  ========================================================= */

  const [wordLoading, setWordLoading] =
    useState(false)


  /* =========================================================
     REFS
  ========================================================= */

  const previewRef = useRef(null)

  const inputRefs = useRef({})


  /* =========================================================
     AUTH INIT
  ========================================================= */

  useEffect(() => {

    async function init() {

      try {

        const data =
          await getAdminCollege()

        if (!data) {

          window.location.href = '/'

          return

        }

        setAdminName(
          data.adminName || ''
        )

        setLoading(false)

      } catch (error) {

        console.error(error)

        window.location.href = '/'

      }

    }

    init()

  }, [])


  /* =========================================================
     CLIPBOARD IMAGE PASTE
  ========================================================= */

  useEffect(() => {

    function handlePaste(event) {

      const items =
        event.clipboardData?.items

      if (!items) return

      for (const item of items) {

        if (
          item.type.startsWith('image/')
        ) {

          const file =
            item.getAsFile()

          if (!file) return

          event.preventDefault()

          handleImageFile(file)

          return

        }

      }

    }

    window.addEventListener(
      'paste',
      handlePaste
    )

    return () => {

      window.removeEventListener(
        'paste',
        handlePaste
      )

    }

  }, [])


  /* =========================================================
     CLEAN IMAGE URL
  ========================================================= */

  useEffect(() => {

    return () => {

      if (imagePreview) {

        URL.revokeObjectURL(
          imagePreview
        )

      }

    }

  }, [imagePreview])


  /* =========================================================
     GREEK SYMBOLS
  ========================================================= */

  const GREEK = {

    'α': '\\alpha',
    'β': '\\beta',
    'γ': '\\gamma',
    'δ': '\\delta',
    'ε': '\\epsilon',
    'ϵ': '\\varepsilon',

    'ζ': '\\zeta',
    'η': '\\eta',

    'θ': '\\theta',
    'ϑ': '\\vartheta',

    'ι': '\\iota',
    'κ': '\\kappa',
    'λ': '\\lambda',
    'μ': '\\mu',
    'ν': '\\nu',
    'ξ': '\\xi',

    'π': '\\pi',
    'ρ': '\\rho',
    'σ': '\\sigma',
    'τ': '\\tau',
    'υ': '\\upsilon',

    'φ': '\\phi',
    'ϕ': '\\varphi',

    'χ': '\\chi',
    'ψ': '\\psi',
    'ω': '\\omega',

    'Γ': '\\Gamma',
    'Δ': '\\Delta',
    'Θ': '\\Theta',
    'Λ': '\\Lambda',
    'Ξ': '\\Xi',
    'Π': '\\Pi',
    'Σ': '\\Sigma',
    'Υ': '\\Upsilon',
    'Φ': '\\Phi',
    'Ψ': '\\Psi',
    'Ω': '\\Omega'

  }


  /* =========================================================
     SUPER SCRIPTS
  ========================================================= */

  const SUPER = {

    '⁰': '0',
    '¹': '1',
    '²': '2',
    '³': '3',
    '⁴': '4',
    '⁵': '5',
    '⁶': '6',
    '⁷': '7',
    '⁸': '8',
    '⁹': '9',

    '⁺': '+',
    '⁻': '-',

    '⁽': '(',
    '⁾': ')',

    'ⁿ': 'n',
    'ᵐ': 'm',
    'ˣ': 'x'

  }


  /* =========================================================
     SUB SCRIPTS
  ========================================================= */

  const SUB = {

    '₀': '0',
    '₁': '1',
    '₂': '2',
    '₃': '3',
    '₄': '4',
    '₅': '5',
    '₆': '6',
    '₇': '7',
    '₈': '8',
    '₉': '9',

    '₊': '+',
    '₋': '-'

  }


  /* =========================================================
     REPLACE GREEK
  ========================================================= */

  function replaceGreek(text) {

    return text.replace(
      /[α-ωΑ-Ωϵϑφϕ]/g,
      char =>
        GREEK[char] || char
    )

  }


  /* =========================================================
     CONVERT UNICODE SUPERSCRIPTS
  ========================================================= */

  function convertSuperscripts(text) {

    return text.replace(
      /([A-Za-z0-9)])([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾ⁿᵐˣ]+)/g,
      (_, base, powers) => {

        const value =
          [...powers]
            .map(
              char =>
                SUPER[char] || char
            )
            .join('')

        return `${base}^{${value}}`

      }
    )

  }


  /* =========================================================
     CONVERT UNICODE SUBSCRIPTS
  ========================================================= */

  function convertSubscripts(text) {

    return text.replace(
      /([A-Za-z][A-Za-z0-9]*)([₀₁₂₃₄₅₆₇₈₉₊₋]+)/g,
      (_, base, subs) => {

        const value =
          [...subs]
            .map(
              char =>
                SUB[char] || char
            )
            .join('')

        return `${base}_{${value}}`

      }
    )

  }


  /* =========================================================
     PROTECT EXISTING LATEX
  ========================================================= */

  function protectLatex(text) {

    const saved = []

    function save(value) {

      const token =
        `@@LATEX_${saved.length}@@`

      saved.push(value)

      return token

    }

    let result = text


    result =
      result.replace(
        /\$\$[\s\S]*?\$\$/g,
        value => save(value)
      )


    result =
      result.replace(
        /\$[^$\n]+?\$/g,
        value => save(value)
      )


    result =
      result.replace(
        /\\\[[\s\S]*?\\\]/g,
        value =>
          save(
            `$$${value.slice(2, -2)}$$`
          )
      )


    result =
      result.replace(
        /\\\([\s\S]*?\\\)/g,
        value =>
          save(
            `$${value.slice(2, -2)}$`
          )
      )


    return {
      result,
      saved
    }

  }


  /* =========================================================
     RESTORE LATEX
  ========================================================= */

  function restoreLatex(
    text,
    saved
  ) {

    return text.replace(
      /@@LATEX_(\d+)@@/g,
      (_, index) =>
        saved[Number(index)] || ''
    )

  }


  /* =========================================================
     NORMALIZE SYMBOLS
  ========================================================= */

  function normalizeSymbols(text) {

    return text

      .replace(/≤/g, '\\leq')

      .replace(/≥/g, '\\geq')

      .replace(/≠/g, '\\neq')

      .replace(/≈/g, '\\approx')

      .replace(/∞/g, '\\infty')

      .replace(/×/g, '\\times')

      .replace(/÷/g, '\\div')

      .replace(/±/g, '\\pm')

      .replace(/∓/g, '\\mp')

      .replace(
        /→/g,
        '\\rightarrow'
      )

      .replace(
        /←/g,
        '\\leftarrow'
      )

      .replace(
        /↔/g,
        '\\leftrightarrow'
      )

      .replace(
        /⇌/g,
        '\\rightleftharpoons'
      )

      .replace(
        /↑/g,
        '\\uparrow'
      )

      .replace(
        /↓/g,
        '\\downarrow'
      )

  }


  /* =========================================================
     MATH FRAGMENT
  ========================================================= */

  function convertMathFragment(text) {

    let value = text


    value =
      convertSuperscripts(value)


    value =
      convertSubscripts(value)


    value =
      replaceGreek(value)


    /* -----------------------------------------
       Fractions
    ----------------------------------------- */

    value =
      value.replace(
        /\b(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\b/g,
        '\\frac{$1}{$2}'
      )


    value =
      value.replace(
        /\b([A-Za-z]+)\s*\/\s*([A-Za-z]+)\b/g,
        '\\frac{$1}{$2}'
      )


    /* -----------------------------------------
       Powers
    ----------------------------------------- */

    value =
      value.replace(
        /([A-Za-z0-9]+)\s*\^\s*\(([^)]+)\)/g,
        '$1^{$2}'
      )


    value =
      value.replace(
        /([A-Za-z0-9]+)\s*\^\s*([A-Za-z0-9+\-]+)/g,
        '$1^{$2}'
      )


    /* -----------------------------------------
       Square root
    ----------------------------------------- */

    value =
      value.replace(
        /√\s*\(([^)]+)\)/g,
        '\\sqrt{$1}'
      )


    value =
      value.replace(
        /√\s*([A-Za-z0-9]+)/g,
        '\\sqrt{$1}'
      )


    /* -----------------------------------------
       Scientific notation
    ----------------------------------------- */

    value =
      value.replace(
        /\b(\d+(?:\.\d+)?)\s*(?:\\times|x)\s*10\s*\^?\s*([+-]?\d+)\b/gi,
        '$1\\times10^{$2}'
      )


    return value

  }


  /* =========================================================
     EQUATION DETECTION
  ========================================================= */

  function convertEquations(text) {

  /*
    IMPORTANT:
    Do not let an equation consume the rest of
    an English sentence.

    Example:

      KE = 1/2 mv^2 is defined as ...

    must become:

      $KE = \frac{1}{2}mv^2$ is defined as ...
  */


  const equationPattern =
    /(?<![A-Za-z0-9])([A-Za-z][A-Za-z0-9_]*\s*(?:=|≈|≠|≤|≥)\s*[^,.;:\n]+?)(?=\s+(?:is|are|was|were|means|represents|denotes|defined|given|called|where|when|if|and|or|which|that|in|of|for)\b|[,.;:\n]|$)/gi


  return text.replace(
    equationPattern,
    match => {

      let clean =
        match.trim()


      /*
        Safety check.
      */

      if (
        clean.length > 100
      ) {

        return match

      }


      /*
        Must actually contain an equation
        operator.
      */

      if (
        !/[=≈≠≤≥]/.test(clean)
      ) {

        return match

      }


      /*
        Remove accidental trailing spaces.
      */

      clean =
        clean.trim()


      /*
        Convert the mathematical part only.
      */

      const converted =
        convertMathFragment(
          clean
        )


      return `$${converted}$`

    }
  )

}

  /* =========================================================
     SIMPLE MATH
  ========================================================= */

  function convertStandaloneMath(text) {

    let value = text


    /* -----------------------------------------
       Fractions
    ----------------------------------------- */

    value =
      value.replace(
        /(?<![\w$])(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(?![\w$])/g,
        match =>
          `$${convertMathFragment(match)}$`
      )


    /* -----------------------------------------
       Powers
    ----------------------------------------- */

    value =
      value.replace(
        /(?<![\w$])([A-Za-z])\s*\^\s*(\([^)]+\)|[A-Za-z0-9+\-]+)(?![\w$])/g,
        (_, base, power) =>
          `$${convertMathFragment(
            `${base}^${power}`
          )}$`
      )


    /* -----------------------------------------
       Square roots
    ----------------------------------------- */

    value =
      value.replace(
        /√\s*\(([^)]+)\)/g,
        (_, inside) =>
          `$\\sqrt{${inside}}$`
      )


    value =
      value.replace(
        /√\s*([A-Za-z0-9]+)/g,
        (_, inside) =>
          `$\\sqrt{${inside}}$`
      )


    return value

  }


  /* =========================================================
     CHEMISTRY
  ========================================================= */

  function chemistryFormula(
    formula
  ) {

    let value = formula


    /*
      H2O
      H2SO4
      CaCO3
      etc.
    */

    value =
      value.replace(
        /([A-Z][a-z]?)(\d+)/g,
        '$1_{$2}'
      )


    /*
      Ionic charge:
      SO4^2-
      Ca^2+
    */

    value =
      value.replace(
        /\^(\d*[+-])/g,
        '^{$1}'
      )


    value =
      value.replace(
        /([A-Za-z])([+-])$/g,
        '$1^{$2}'
      )


    return `\\mathrm{${value}}`

  }


  function isChemicalFormula(
    value
  ) {

    const clean =
      value.replace(
        /\s/g,
        ''
      )


    if (!clean) return false


    const known = [

      'H2O',
      'CO2',
      'NH3',
      'CH4',

      'O2',
      'H2',
      'N2',

      'HCl',
      'NaCl',
      'KCl',

      'NaOH',
      'KOH',

      'CaCO3',
      'CaO',
      'Ca(OH)2',

      'H2SO4',
      'HNO3',
      'H3PO4',

      'Na2CO3',
      'NaHCO3',

      'KMnO4',
      'K2Cr2O7',

      'C6H12O6',
      'C2H5OH',
      'CH3COOH',

      'Fe2O3',
      'Fe3O4',

      'CuSO4',

      'MgO',
      'MgCl2',

      'Al2O3',

      'SO2',
      'SO3',
      'SO4',

      'NO2',
      'NO3',
      'PO4',

      'Cl2',
      'Br2',
      'I2',
      'F2',

      'CaCl2',
      'NH4Cl'

    ]


    if (
      known.includes(clean)
    ) {

      return true

    }


    if (
      /\d/.test(clean)
    ) {

      return true

    }


    if (
      /[+-]$/.test(clean)
    ) {

      return true

    }


    if (
      /\^\d*[+-]/.test(clean)
    ) {

      return true

    }


    return false

  }


  function convertChemistry(
    text
  ) {

    let value = text


    /*
      Chemical formula detection.
    */

    value =
      value.replace(
        /\b[A-Z][A-Za-z0-9()]*\d*(?:\^\d*[+-])?\b/g,
        match => {

          if (
            !isChemicalFormula(match)
          ) {

            return match

          }


          return `$${chemistryFormula(
            match
          )}$`

        }
      )


    /*
      Ionic charges.
    */

    value =
      value.replace(
        /\b([A-Z][a-z]?)(\d*[+-])\b/g,
        match =>
          `$${chemistryFormula(
            match
          )}$`
      )


    /*
      Chemical arrows.
    */

    value =
      value.replace(
        /\s*->\s*/g,
        ' $\\rightarrow$ '
      )


    value =
      value.replace(
        /\s*=>\s*/g,
        ' $\\Rightarrow$ '
      )


    return value

  }


  /* =========================================================
     MAIN LATEX CONVERTER
  ========================================================= */

  function autoWrap(text) {

    if (
      text === null ||
      text === undefined
    ) {

      return ''

    }


    let value =
      String(text)
        .replace(
          /\r\n/g,
          '\n'
        )


    /*
      Protect formulas already entered
      by the user.
    */

    const protectedData =
      protectLatex(value)


    value =
      protectedData.result


    /*
      Unicode notation.
    */

    value =
      convertSuperscripts(value)


    value =
      convertSubscripts(value)


    /*
      Normalize symbols.
    */

    value =
      normalizeSymbols(value)


    /*
      Chemistry.

      We intentionally apply this generally
      because chemical formulas can occur
      inside normal question text.
    */

    value =
      convertChemistry(value)


    /*
      Equations.
    */

    value =
      convertEquations(value)


    /*
      Simple math.
    */

    value =
      convertStandaloneMath(value)


    /*
      Greek letters.
    */

    value =
      replaceGreek(value)


    /*
      Restore existing LaTeX.
    */

    value =
      restoreLatex(
        value,
        protectedData.saved
      )


    return value

  }


  /* =========================================================
     GET FIELD VALUE
  ========================================================= */

  function getFieldValue(
    field
  ) {

    const values = {

      question,

      optionA,

      optionB,
      optionC,
      optionD,

      explanation

    }


    return values[field] || ''

  }


  /* =========================================================
     SET FIELD
  ========================================================= */

  function setFieldValue(
    field,
    value
  ) {

    const setters = {

      question: setQuestion,

      optionA: setOptionA,
      optionB: setOptionB,
      optionC: setOptionC,
      optionD: setOptionD,

      explanation: setExplanation

    }


    if (
      setters[field]
    ) {

      setters[field](value)

    }

  }


  /* =========================================================
     INSERT FORMULA
  ========================================================= */

  function insertFormula(
    latex
  ) {

    const textarea =
      inputRefs.current[
        activeField
      ]


    const current =
      getFieldValue(
        activeField
      )


    if (!textarea) {

      setFieldValue(
        activeField,
        current + latex
      )

      return

    }


    const start =
      textarea.selectionStart ??
      current.length


    const end =
      textarea.selectionEnd ??
      start


    const newText =
      current.substring(
        0,
        start
      ) +

      latex +

      current.substring(
        end
      )


    setFieldValue(
      activeField,
      newText
    )


    setTimeout(() => {

      textarea.focus()


      const cursor =
        start + latex.length


      textarea.selectionStart =
        cursor

      textarea.selectionEnd =
        cursor

    }, 0)

  }


  /* =========================================================
     TOOLBAR
  ========================================================= */

  const TOOLBAR = {

    math: [

      {
        label: 'x²',
        latex: 'x^2'
      },

      {
        label: 'xⁿ',
        latex: 'x^n'
      },

      {
        label: '√',
        latex: '\\sqrt{x}'
      },

      {
        label: '∛',
        latex: '\\sqrt[3]{x}'
      },

      {
        label: '½',
        latex: '\\frac{1}{2}'
      },

      {
        label: 'a/b',
        latex: '\\frac{a}{b}'
      },

      {
        label: '∫',
        latex: '\\int x\\,dx'
      },

      {
        label: '∫ₐᵇ',
        latex:
          '\\int_{a}^{b}f(x)\\,dx'
      },

      {
        label: 'Σ',
        latex:
          '\\sum_{i=1}^{n}i'
      },

      {
        label: 'd/dx',
        latex:
          '\\frac{d}{dx}'
      },

      {
        label: '∂',
        latex:
          '\\partial'
      },

      {
        label: 'lim',
        latex:
          '\\lim_{x\\to a}'
      },

      {
        label: 'π',
        latex: '\\pi'
      },

      {
        label: 'θ',
        latex: '\\theta'
      },

      {
        label: 'λ',
        latex: '\\lambda'
      },

      {
        label: 'μ',
        latex: '\\mu'
      },

      {
        label: 'ρ',
        latex: '\\rho'
      },

      {
        label: '∞',
        latex: '\\infty'
      },

      {
        label: '≈',
        latex: '\\approx'
      },

      {
        label: '≠',
        latex: '\\neq'
      },

      {
        label: '≤',
        latex: '\\leq'
      },

      {
        label: '≥',
        latex: '\\geq'
      },

      {
        label: '→',
        latex: '\\rightarrow'
      },

      {
        label: '↔',
        latex: '\\leftrightarrow'
      },

      {
        label: '±',
        latex: '\\pm'
      }

    ],


    physics: [

      {
        label: 'v=d/t',
        latex:
          'v=\\frac{d}{t}'
      },

      {
        label: 'a=(v-u)/t',
        latex:
          'a=\\frac{v-u}{t}'
      },

      {
        label: 'F=ma',
        latex: 'F=ma'
      },

      {
        label: 'E=mc²',
        latex: 'E=mc^2'
      },

      {
        label: 'V=IR',
        latex: 'V=IR'
      },

      {
        label: 'P=W/t',
        latex:
          'P=\\frac{W}{t}'
      },

      {
        label: 'p=mv',
        latex: 'p=mv'
      },

      {
        label: 'ρ=m/V',
        latex:
          '\\rho=\\frac{m}{V}'
      },

      {
        label: 'W=Fd',
        latex: 'W=Fd'
      },

      {
        label: 'KE',
        latex:
          'KE=\\frac{1}{2}mv^2'
      },

      {
        label: 'PE',
        latex: 'PE=mgh'
      },

      {
        label: 'g=9.8',
        latex:
          'g=9.8\\,m/s^2'
      },

      {
        label: 'f=1/T',
        latex:
          'f=\\frac{1}{T}'
      },

      {
        label: 'c=3×10⁸',
        latex:
          'c=3\\times10^8\\,m/s'
      },

      {
        label: 'λ',
        latex: '\\lambda'
      },

      {
        label: 'θ',
        latex: '\\theta'
      },

      {
        label: 'μ',
        latex: '\\mu'
      },

      {
        label: 'Δ',
        latex: '\\Delta'
      },

      {
        label: '∞',
        latex: '\\infty'
      }

    ],


    chemistry: [

      {
        label: 'H₂O',
        latex: 'H_2O'
      },

      {
        label: 'CO₂',
        latex: 'CO_2'
      },

      {
        label: 'NH₃',
        latex: 'NH_3'
      },

      {
        label: 'H₂SO₄',
        latex: 'H_2SO_4'
      },

      {
        label: 'Na⁺',
        latex: 'Na^+'
      },

      {
        label: 'Ca²⁺',
        latex: 'Ca^{2+}'
      },

      {
        label: 'Cl⁻',
        latex: 'Cl^-'
      },

      {
        label: 'SO₄²⁻',
        latex: 'SO_4^{2-}'
      },

      {
        label: 'e⁻',
        latex: 'e^-'
      },

      {
        label: '→',
        latex: '\\rightarrow'
      },

      {
        label: '⇌',
        latex:
          '\\rightleftharpoons'
      },

      {
        label: '↑',
        latex: '\\uparrow'
      },

      {
        label: '↓',
        latex: '\\downarrow'
      },

      {
        label: 'Δ',
        latex: '\\Delta'
      },

      {
        label: '°C',
        latex:
          '^{\\circ}C'
      },

      {
        label: '(aq)',
        latex:
          '\\mathrm{(aq)}'
      },

      {
        label: '(l)',
        latex:
          '\\mathrm{(l)}'
      },

      {
        label: '(g)',
        latex:
          '\\mathrm{(g)}'
      },

      {
        label: '(s)',
        latex:
          '\\mathrm{(s)}'
      },

      {
        label: 'mol',
        latex:
          '\\mathrm{mol}'
      }

    ]

  }


  /* =========================================================
     HTML ESCAPE
  ========================================================= */

  function escapeHtml(
    value
  ) {

    return String(value)

      .replace(
        /&/g,
        '&amp;'
      )

      .replace(
        /</g,
        '&lt;'
      )

      .replace(
        />/g,
        '&gt;'
      )

      .replace(
        /"/g,
        '&quot;'
      )

      .replace(
        /'/g,
        '&#039;'
      )

  }


  /* =========================================================
     PREVIEW
  ========================================================= */

  function renderPreview() {

    if (
      !previewRef.current
    ) {

      return

    }


    let html = ''


    function addField(
      label,
      value,
      className
    ) {

      if (!value) return


      const latex =
        autoWrap(value)


      html += `
        <div class="${className}">
          <div class="qs-label">
            ${label}
          </div>
          <div class="qs-content">
            ${escapeHtml(latex)
              .replace(
                /\n/g,
                '<br/>'
              )}
          </div>
        </div>
      `

    }


    addField(
      'Question',
      question,
      'qs-question'
    )


    addField(
      'A',
      optionA,
      'qs-option'
    )


    addField(
      'B',
      optionB,
      'qs-option'
    )


    addField(
      'C',
      optionC,
      'qs-option'
    )


    addField(
      'D',
      optionD,
      'qs-option'
    )


    if (explanation) {

      html += `
        <div class="qs-explanation">
          <div class="qs-label">
            Explanation
          </div>

          <div class="qs-content">
            ${escapeHtml(
              autoWrap(
                explanation
              )
            ).replace(
              /\n/g,
              '<br/>'
            )}
          </div>
        </div>
      `

    }


    if (!html) {

      html = `
        <div class="qs-empty">
          Start typing your question to see
          the rendered preview here.
        </div>
      `

    }


    previewRef.current.innerHTML =
      html


    renderMathInElement(
      previewRef.current,
      {

        throwOnError: false,

        strict: 'ignore',

        delimiters: [

          {
            left: '$$',
            right: '$$',
            display: true
          },

          {
            left: '$',
            right: '$',
            display: false
          }

        ]

      }
    )

  }


  useEffect(() => {

    renderPreview()

  }, [
    question,
    optionA,
    optionB,
    optionC,
    optionD,
    explanation
  ])


  /* =========================================================
     COPY
  ========================================================= */

  async function copyText(
    text
  ) {

    try {

      await navigator
        .clipboard
        .writeText(text)

      alert('Copied')

    } catch (error) {

      console.error(error)

      alert(
        'Could not copy to clipboard.'
      )

    }

  }


  /* =========================================================
     COPY QUESTION AS LATEX
  ========================================================= */

  function copyQuestionLaTeX() {

    const output = [

      autoWrap(question),

      `A. ${autoWrap(optionA)}`,

      `B. ${autoWrap(optionB)}`,

      `C. ${autoWrap(optionC)}`,

      `D. ${autoWrap(optionD)}`,

      `Correct Answer: ${correctAnswer}`,

      `Explanation: ${autoWrap(
        explanation
      )}`

    ].join('\n\n')


    copyText(output)

  }


  /* =========================================================
     COPY SINGLE FIELD LATEX
  ========================================================= */

  function copyFieldLaTeX(
    field
  ) {

    copyText(
      autoWrap(
        getFieldValue(field)
      )
    )

  }


  /* =========================================================
     WORD HELPERS
  ========================================================= */

  function splitWordContent(
    text
  ) {

    const latex =
      autoWrap(text)


    const parts = []


    /*
      Matches:

      $$ display equation $$

      OR

      $ inline equation $
    */

    const regex =
      /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g


    let lastIndex = 0

    let match


    while (
      (match = regex.exec(latex))
      !== null
    ) {

      if (
        match.index >
        lastIndex
      ) {

        parts.push({
          type: 'text',
          value:
            latex.substring(
              lastIndex,
              match.index
            )
        })

      }


      const token =
        match[0]


      if (
        token.startsWith('$$')
      ) {

        parts.push({
          type: 'displayMath',
          value:
            token.slice(
              2,
              -2
            ).trim()
        })

      } else {

        parts.push({
          type: 'math',
          value:
            token.slice(
              1,
              -1
            ).trim()
        })

      }


      lastIndex =
        match.index +
        token.length

    }


    if (
      lastIndex <
      latex.length
    ) {

      parts.push({
        type: 'text',
        value:
          latex.substring(
            lastIndex
          )
      })

    }


    if (!parts.length) {

      parts.push({
        type: 'text',
        value: latex
      })

    }


    return parts

  }


  /* =========================================================
     CREATE WORD PARAGRAPH
  ========================================================= */

  function createWordMathChildren(text) {

  const parts =
    splitWordContent(text)

  const children = []

  for (const part of parts) {

    if (part.type === 'text') {

      if (part.value) {

        children.push(
          new TextRun({
            text: part.value,
            font: 'Arial',
            size: 24
          })
        )

      }

      continue
    }


    /*
      Convert LaTeX into a native
      Word mathematical object.
    */

    try {

      const math =
        convertLatex2Math(
          part.value
        )

      children.push(math)

    } catch (error) {

      console.error(
        'LaTeX conversion failed:',
        part.value,
        error
      )

      /*
        Do not lose the formula if
        conversion fails.
      */

      children.push(
        new TextRun({
          text: part.value,
          font: 'Consolas',
          size: 22
        })
      )

    }

  }

  return children
}

  /* =========================================================
     CREATE WORD DOCUMENT
  ========================================================= */

  async function exportToWord() {

    if (
      !question.trim() &&
      !optionA.trim() &&
      !optionB.trim() &&
      !optionC.trim() &&
      !optionD.trim()
    ) {

      alert(
        'Please enter a question first.'
      )

      return

    }


    setWordLoading(true)


    try {

      /*
        Initialise MathJax used by
        the LaTeX → OMML converter.
      */

      await mathJaxReady()


      const children = []


      /*
        TITLE
      */

      children.push(
        new Paragraph({

          spacing: {
            after: 240
          },

          children: [

            new TextRun({
              text:
                'Question',
              bold:
                true,
              font:
                'Arial',
              size:
                28
            })

          ]

        })
      )


      /*
        QUESTION
      */

     if (
  question.trim()
) {

  children.push(
    new Paragraph({

      spacing: {
        after: 140,
        line: 276
      },

      children:
        createWordMathChildren(
          question
        )

    })
  )

}

      /*
        OPTIONS
      */

      const options = [

        {
          label: 'A',
          value: optionA
        },

        {
          label: 'B',
          value: optionB
        },

        {
          label: 'C',
          value: optionC
        },

        {
          label: 'D',
          value: optionD
        }

      ]


  for (
  const option
  of options
) {

  if (
    !option.value.trim()
  ) {

    continue

  }


  children.push(

    new Paragraph({

      spacing: {
        after: 120,
        line: 276
      },

      children: [

        new TextRun({

          text:
            `${option.label}. `,

          bold:
            true,

          font:
            'Arial',

          size:
            24

        }),

        ...createWordMathChildren(
          option.value
        )

      ]

    })

  )

}


      /*
        CORRECT ANSWER
      */

      children.push(

        new Paragraph({

          spacing: {
            before: 180,
            after: 140
          },

          children: [

            new TextRun({

              text:
                `Correct Answer: ${correctAnswer}`,

              bold:
                true,

              font:
                'Arial',

              size:
                24

            })

          ]

        })

      )


      /*
        EXPLANATION
      */

      if (
        explanation.trim()
      ) {

        children.push(

          new Paragraph({

            spacing: {
              before: 200,
              after: 120
            },

            children: [

              new TextRun({

                text:
                  'Explanation',

                bold:
                  true,

                font:
                  'Arial',

                size:
                  26

              })

            ]

          })

        )


  children.push(

  new Paragraph({

    spacing: {
      after: 140,
      line: 276
    },

    children:
      createWordMathChildren(
        explanation
      )

  })

)
      }


      /*
        CREATE DOCX
      */

      const doc =
        new Document({

          creator:
            'Question Studio',

          title:
            'Exam Question',

          description:
            'Question created using Question Studio',

          sections: [

            {

              properties: {},

              children

            }

          ]

        })


      /*
        Browser download.
      */

      const blob =
        await Packer.toBlob(
          doc
        )


      const url =
        URL.createObjectURL(
          blob
        )


      const anchor =
        document.createElement('a')


      anchor.href =
        url


      anchor.download =
        'question.docx'


      document.body.appendChild(
        anchor
      )


      anchor.click()


      document.body.removeChild(
        anchor
      )


      setTimeout(() => {

        URL.revokeObjectURL(
          url
        )

      }, 1000)


    } catch (error) {

      console.error(
        'Word export error:',
        error
      )


      alert(
        'Word export failed. Please check the browser console for details.'
      )


    } finally {

      setWordLoading(false)

    }

  }


  /* =========================================================
     CLEAR
  ========================================================= */

  function clearQuestion() {

    setQuestion('')

    setOptionA('')
    setOptionB('')
    setOptionC('')
    setOptionD('')

    setCorrectAnswer('A')

    setExplanation('')

  }

/* =========================================================
   OCR - IMPROVED MATH QUESTION OCR
========================================================= */


/* =========================================================
   PREPROCESS IMAGE
========================================================= */

async function preprocessOCRImage(file) {

  return new Promise((resolve, reject) => {

    const image = new Image()

    const objectUrl =
      URL.createObjectURL(file)

    image.onload = () => {

      try {

        /*
          Enlarge the image.

          Small mathematical symbols such as:
          ² ρ μ π √
          are much easier for OCR to recognize
          when the source is enlarged.
        */

        const scale = 3

        const width =
          Math.round(
            image.naturalWidth * scale
          )

        const height =
          Math.round(
            image.naturalHeight * scale
          )


        const canvas =
          document.createElement('canvas')


        canvas.width =
          width

        canvas.height =
          height


        const ctx =
          canvas.getContext('2d')


        /*
          White background.
        */

        ctx.fillStyle =
          '#ffffff'

        ctx.fillRect(
          0,
          0,
          width,
          height
        )


        /*
          Draw enlarged image.
        */

        ctx.drawImage(
          image,
          0,
          0,
          width,
          height
        )


        /*
          Read pixels.
        */

        const imageData =
          ctx.getImageData(
            0,
            0,
            width,
            height
          )


        const data =
          imageData.data


        /*
          Grayscale + contrast enhancement.

          We deliberately do NOT use an
          aggressive black/white threshold because
          thin mathematical symbols can disappear.
        */

        const contrast = 1.35

        const midpoint = 128


        for (
          let i = 0;
          i < data.length;
          i += 4
        ) {

          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]


          /*
            Perceived grayscale.
          */

          let gray =
            (
              0.299 * r +
              0.587 * g +
              0.114 * b
            )


          /*
            Contrast.
          */

          gray =
            midpoint +
            contrast *
              (gray - midpoint)


          gray =
            Math.max(
              0,
              Math.min(
                255,
                gray
              )
            )


          data[i] =
            gray

          data[i + 1] =
            gray

          data[i + 2] =
            gray

        }


        ctx.putImageData(
          imageData,
          0,
          0
        )


        /*
          Export as PNG.
        */

        canvas.toBlob(
          blob => {

            URL.revokeObjectURL(
              objectUrl
            )


            if (!blob) {

              reject(
                new Error(
                  'Could not preprocess image.'
                )
              )

              return

            }


            resolve(blob)

          },
          'image/png'
        )


      } catch (error) {

        URL.revokeObjectURL(
          objectUrl
        )

        reject(error)

      }

    }


    image.onerror =
      () => {

        URL.revokeObjectURL(
          objectUrl
        )

        reject(
          new Error(
            'Could not load image.'
          )
        )

      }


    image.src =
      objectUrl

  })

}


/* =========================================================
   OCR TEXT CLEANUP
========================================================= */

function cleanOCRLine(line) {

  if (!line) {
    return ''
  }


  let value =
    line
      .replace(
        /\r/g,
        ''
      )
      .replace(
        /[ \t]+/g,
        ' '
      )
      .trim()


  /*
    Remove obvious OCR garbage at the
    beginning/end of a line.
  */

  value =
    value.replace(
      /^[|¦~`]+/,
      ''
    )


  value =
    value.replace(
      /[|¦~`]+$/,
      ''
    )


  /*
    Common OCR character corrections.
  */

  value =
    value

      /*
        Mathematical minus.
      */

      .replace(
        /−/g,
        '-'
      )

      /*
        Multiplication.
      */

      .replace(
        /×/g,
        '×'
      )

      /*
        Smart quotes.
      */

      .replace(
        /[“”]/g,
        '"'
      )

      .replace(
        /[‘’]/g,
        "'"
      )


  /*
    OCR frequently reads superscript 2
    as * or a plain character.

    Only apply these inside obvious
    mathematical contexts.
  */

  value =
    value.replace(
      /([A-Za-z0-9)])\s*\*\s*(?=[,.;:\s]|$)/g,
      '$1²'
    )


  /*
    Common OCR spelling of rho.
  */

  value =
    value.replace(
      /\brho\b/gi,
      'ρ'
    )


  /*
    OCR sometimes reads Greek mu as:
      u
      m
      v

    Do NOT globally replace those.
    We only handle explicit "mu".
  */

  value =
    value.replace(
      /\bmu\b/gi,
      'μ'
    )


  /*
    Common OCR reading of degree symbol.
  */

  value =
    value.replace(
      /\bdeg\b/gi,
      '°'
    )


  return value

}


/* =========================================================
   NORMALIZE MATHEMATICAL OCR
========================================================= */

function normalizeOCRMath(text) {

  if (!text) {
    return ''
  }


  let value =
    cleanOCRLine(text)


  /*
    ---------------------------------------------------------
    GREEK LETTERS
    ---------------------------------------------------------
  */

  const greekReplacements = {

    alpha: 'α',
    beta: 'β',
    gamma: 'γ',
    delta: 'δ',
    epsilon: 'ε',
    theta: 'θ',
    lambda: 'λ',
    mu: 'μ',
    rho: 'ρ',
    sigma: 'σ',
    omega: 'ω',
    pi: 'π',
    phi: 'φ',
    psi: 'ψ',

    Alpha: 'Α',
    Beta: 'Β',
    Gamma: 'Γ',
    Delta: 'Δ',
    Theta: 'Θ',
    Lambda: 'Λ',
    Sigma: 'Σ',
    Omega: 'Ω',
    Pi: 'Π',
    Phi: 'Φ',
    Psi: 'Ψ'

  }


  for (
    const [word, symbol]
    of Object.entries(
      greekReplacements
    )
  ) {

    value =
      value.replace(
        new RegExp(
          `\\b${word}\\b`,
          'g'
        ),
        symbol
      )

  }


  /*
    ---------------------------------------------------------
    FRACTION-LIKE OCR
    ---------------------------------------------------------
  */

  value =
    value.replace(
      /(\d+)\s*[\/|]\s*(\d+)/g,
      '$1/$2'
    )


  /*
    ---------------------------------------------------------
    POWER OCR
    ---------------------------------------------------------
  */

  /*
    Examples:

      mv2
      x2
      s2
      mc2

    become:

      mv²
      x²
      s²
      mc²
  */

  value =
    value.replace(
      /\b([A-Za-z]+)([23456789])\b/g,
      (_, base, power) => {

        const superscripts = {

          '2': '²',
          '3': '³',
          '4': '⁴',
          '5': '⁵',
          '6': '⁶',
          '7': '⁷',
          '8': '⁸',
          '9': '⁹'

        }


        return (
          base +
          superscripts[power]
        )

      }
    )


  /*
    ---------------------------------------------------------
    UNIT POWERS
    ---------------------------------------------------------
  */

  value =
    value.replace(
      /\bm\/s\s*2\b/gi,
      'm/s²'
    )


  value =
    value.replace(
      /\bm\/s2\b/gi,
      'm/s²'
    )


  value =
    value.replace(
      /\bcm\/s\s*2\b/gi,
      'cm/s²'
    )


  /*
    ---------------------------------------------------------
    COMMON EQUATION OCR CORRECTIONS
    ---------------------------------------------------------

    These are deliberately limited to patterns
    that are very common in school Physics.
  */


  /*
    a = (v-u)/t
  */

  value =
    value.replace(
      /\ba\s*=\s*\(?v\s*[-–]\s*u\)?\s*[\/|]\s*t\b/gi,
      'a = (v-u)/t'
    )


  /*
    v = d/t
  */

  value =
    value.replace(
      /\bv\s*=\s*d\s*[\/|]\s*t\b/gi,
      'v = d/t'
    )


  /*
    F = ma
  */

  value =
    value.replace(
      /\bF\s*=\s*m\s*a\b/gi,
      'F = ma'
    )


  /*
    E = mc2
  */

  value =
    value.replace(
      /\bE\s*=\s*m\s*c\s*(?:2|²)\b/g,
      'E = mc²'
    )


  /*
    V = IR
  */

  value =
    value.replace(
      /\bV\s*=\s*I\s*R\b/g,
      'V = IR'
    )


  /*
    KE = 1/2 mv2

    OCR may produce:

      ke = 1/2 mv2
      ke = 1/2 my
      ke = 1/2 mv?
      KE = 1/2 mv

    We normalize the obvious forms.
  */

  value =
    value.replace(
      /\bke\s*=\s*1\s*[\/|]\s*2\s*m\s*v(?:\s*[²2?])?\b/gi,
      'KE = 1/2 mv²'
    )


  /*
    OCR can confuse:
      mv²
    with:
      my?
      mv?
      mv
  */

  value =
    value.replace(
      /\b(KE\s*=\s*1\s*[\/|]\s*2\s*m)\s*y\??\b/gi,
      '$1 v²'
    )


  value =
    value.replace(
      /\b(KE\s*=\s*1\s*[\/|]\s*2\s*m\s*v)\??\b/gi,
      '$1²'
    )


  /*
    ρ = m/V

    OCR can produce:
      rho = m/v
      p = m/v
      ρ = m/v
  */

  value =
    value.replace(
      /\b(?:rho|p|ρ)\s*=\s*m\s*[\/|]\s*v\b/gi,
      'ρ = m/V'
    )


  /*
    g = 9.8 m/s²
  */

  value =
    value.replace(
      /\bg\s*=\s*9[\.,]?\s*8\s*m\s*[\/|]\s*s\s*(?:²|2|\*)?\b/gi,
      'g = 9.8 m/s²'
    )


  /*
    f = 1/T
  */

  value =
    value.replace(
      /\bf\s*=\s*1\s*[\/|]\s*T\b/gi,
      'f = 1/T'
    )


  /*
    ---------------------------------------------------------
    CHEMISTRY FORMULAS
    ---------------------------------------------------------
  */

  /*
    H2O
    CO2
    NH3
    H2SO4
    CaCO3
    etc.
  */

  value =
    value.replace(
      /\b([A-Z][a-z]?)(\d+)([A-Z][a-z]?\d*)*\b/g,
      match => {

        return match

      }
    )


  /*
    Chemical arrows.
  */

  value =
    value.replace(
      /-{1,2}>/g,
      '→'
    )


  value =
    value.replace(
      /<[-=]+>/g,
      '⇌'
    )


  /*
    ---------------------------------------------------------
    CLEAN SPACING AROUND EQUATIONS
    ---------------------------------------------------------
  */

  value =
    value.replace(
      /\s*=\s*/g,
      ' = '
    )


  value =
    value.replace(
      /\s*\/\s*/g,
      '/'
    )


  value =
    value.replace(
      /\s+/g,
      ' '
    )


  return value.trim()

}


/* =========================================================
   DETECT OPTION LABEL
========================================================= */

function detectOptionLabel(line) {

  if (!line) {
    return null
  }


  const clean =
    line.trim()


  /*
    Handles:

      A.
      A)
      A:
      A -
      (A)
      A
  */

  const match =
    clean.match(
      /^\(?\s*([ABCD])\s*\)?\s*[\.\):\-]?\s*(.*)$/i
    )


  if (!match) {
    return null
  }


  return {

    label:
      match[1].toUpperCase(),

    content:
      match[2].trim()

  }

}


/* =========================================================
   PARSE OCR INTO QUESTION + OPTIONS
========================================================= */

function parseMCQ(text) {

  const result = {

    question: '',

    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',

    explanation: ''

  }


  if (!text) {
    return result
  }


  /*
    Normalize lines.
  */

  const rawLines =
    text
      .replace(
        /\r\n/g,
        '\n'
      )
      .replace(
        /\r/g,
        '\n'
      )
      .split('\n')


  const lines = []


  for (
    const rawLine
    of rawLines
  ) {

    const line =
      normalizeOCRMath(
        rawLine
      )


    if (!line) {
      continue
    }


    lines.push(line)

  }


  let currentSection =
    'question'


  /*
    Temporary storage.

    This lets us correctly handle
    multi-line options.
  */

  const sections = {

    question: [],
    A: [],
    B: [],
    C: [],
    D: [],
    explanation: []

  }


  for (
    let i = 0;
    i < lines.length;
    i++
  ) {

    const line =
      lines[i]


    /*
      Explanation.
    */

    if (
      /^(explanation|solution|working|answer explanation)\s*:?\s*$/i
        .test(line)
    ) {

      currentSection =
        'explanation'

      continue

    }


    /*
      Option label.
    */

    const option =
      detectOptionLabel(
        line
      )


    if (option) {

      currentSection =
        option.label


      if (
        option.content
      ) {

        sections[
          option.label
        ].push(
          option.content
        )

      }


      continue

    }


    /*
      Some OCR output can be:

        A
        a = ...

      where the label and content are
      on separate lines.

      Detect a line containing only A-D.
    */

    if (
      /^[ABCD]$/i.test(
        line
      )
    ) {

      currentSection =
        line.toUpperCase()

      continue

    }


    /*
      Add line to current section.
    */

    sections[
      currentSection
    ].push(line)

  }


  /*
    Join multi-line sections.
  */

  result.question =
    sections.question
      .join(' ')
      .trim()


  result.optionA =
    sections.A
      .join(' ')
      .trim()


  result.optionB =
    sections.B
      .join(' ')
      .trim()


  result.optionC =
    sections.C
      .join(' ')
      .trim()


  result.optionD =
    sections.D
      .join(' ')
      .trim()


  result.explanation =
    sections.explanation
      .join(' ')
      .trim()


  /*
    ---------------------------------------------------------
    QUESTION CLEANUP
    ---------------------------------------------------------
  */

  /*
    Remove leading question number:

      1.
      1)
      Q1.
      Q.
  */

  result.question =
    result.question
      .replace(
        /^\s*(?:Q(?:uestion)?\s*)?\d+\s*[\.\):\-]\s*/i,
        ''
      )
      .trim()


  /*
    OCR sometimes puts an isolated "Q"
    before the question.
  */

  result.question =
    result.question
      .replace(
        /^\s*Q\s+/i,
        ''
      )
      .trim()


  /*
    ---------------------------------------------------------
    OPTION CLEANUP
    ---------------------------------------------------------
  */

  const cleanOption =
    value => {

      return value

        .replace(
          /^\s*[\.\):\-]+\s*/,
          ''
        )

        .replace(
          /^\s*[|¦]+\s*/,
          ''
        )

        .trim()

    }


  result.optionA =
    cleanOption(
      result.optionA
    )


  result.optionB =
    cleanOption(
      result.optionB
    )


  result.optionC =
    cleanOption(
      result.optionC
    )


  result.optionD =
    cleanOption(
      result.optionD
    )


  return result

}


/* =========================================================
   OCR USING TESSERACT
========================================================= */

async function runImprovedOCR(
  imageBlob
) {

  /*
    Create a dedicated worker.

    PSM 11 = sparse text.

    This is better for screenshots where
    text and equations are separated by
    white space.
  */

  const worker =
    await Tesseract.createWorker(
      'eng',
      1,
      {

        logger:
          message => {

            if (
              message.status ===
              'recognizing text'
            ) {

              setOcrProgress(
                Math.round(
                  message.progress *
                  100
                )
              )

            }

          }

      }
    )


  try {

    await worker.setParameters({

      tessedit_pageseg_mode:
        '11',

      preserve_interword_spaces:
        '1'

    })


    const result =
      await worker.recognize(
        imageBlob
      )


    return (
      result?.data?.text ||
      ''
    )

  } finally {

    await worker.terminate()

  }

}


/* =========================================================
   IMAGE HANDLING
========================================================= */

async function processImageOCR(
  fileToRead
) {

  const file =
    fileToRead ||
    imageFile


  if (!file) {

    alert(
      'Please select, paste or drag an image first.'
    )

    return

  }


  setOcrLoading(true)

  setOcrProgress(0)


  try {

    /*
      -------------------------------------------------------
      STEP 1
      -------------------------------------------------------

      Enlarge and improve the image.
    */

    const processedImage =
      await preprocessOCRImage(
        file
      )


    /*
      -------------------------------------------------------
      STEP 2
      -------------------------------------------------------

      OCR the processed image.
    */

    const rawText =
      await runImprovedOCR(
        processedImage
      )


    console.log(
      'RAW OCR RESULT:',
      rawText
    )


    /*
      -------------------------------------------------------
      STEP 3
      -------------------------------------------------------

      Parse into Question / A / B / C / D.
    */

    const parsed =
      parseMCQ(
        rawText
      )


    console.log(
      'PARSED OCR RESULT:',
      parsed
    )


    /*
      -------------------------------------------------------
      STEP 4
      -------------------------------------------------------

      Put cleaned OCR into the editor.
    */

    setQuestion(
      parsed.question
    )


    setOptionA(
      parsed.optionA
    )


    setOptionB(
      parsed.optionB
    )


    setOptionC(
      parsed.optionC
    )


    setOptionD(
      parsed.optionD
    )


    setExplanation(
      parsed.explanation
    )


    /*
      Start editing from Question.
    */

    setActiveField(
      'question'
    )


  } catch (error) {

    console.error(
      'OCR ERROR:',
      error
    )


    alert(
      'OCR failed. Please try a clearer image.'
    )


  } finally {

    setOcrProgress(100)


    setTimeout(() => {

      setOcrLoading(false)

      setOcrProgress(0)

    }, 500)

  }

}


/* =========================================================
   IMAGE FILE HANDLING
========================================================= */

function handleImageFile(
  file
) {

  if (!file) {
    return
  }


  if (
    !file.type.startsWith(
      'image/'
    )
  ) {

    alert(
      'Please select an image file.'
    )

    return

  }


  if (imagePreview) {

    URL.revokeObjectURL(
      imagePreview
    )

  }


  const url =
    URL.createObjectURL(
      file
    )


  setImageFile(
    file
  )


  setImagePreview(
    url
  )


  /*
    Do NOT automatically run OCR here.

    The user can inspect the screenshot
    and click "Extract Question from Image".
  */

}


/* =========================================================
   DRAG HANDLERS
========================================================= */

function handleDrag(
  event
) {

  event.preventDefault()

  event.stopPropagation()

}


function handleDragEnter(
  event
) {

  event.preventDefault()

  event.stopPropagation()

  setDragActive(
    true
  )

}


function handleDragLeave(
  event
) {

  event.preventDefault()

  event.stopPropagation()

  setDragActive(
    false
  )

}


function handleDrop(
  event
) {

  event.preventDefault()

  event.stopPropagation()

  setDragActive(
    false
  )


  const file =
    event.dataTransfer
      .files?.[0]


  if (file) {

    handleImageFile(
      file
    )

  }

}

  /* =========================================================
     EXCEL CONVERSION
  ========================================================= */

  function processExcel() {

    if (!excelFile) {

      alert(
        'Please select an Excel file first.'
      )

      return

    }


    const reader =
      new FileReader()


    reader.onload =
      event => {

        try {

          const data =
            new Uint8Array(
              event.target.result
            )


          const workbook =
            XLSX.read(
              data,
              {
                type: 'array'
              }
            )


          const sheet =
            workbook.Sheets[
              workbook.SheetNames[0]
            ]


          const rows =
            XLSX.utils.sheet_to_json(
              sheet
            )


          const converted =
            rows.map(
              row => ({

                ...row,

                question:
                  autoWrap(
                    row.question ||
                    ''
                  ),

                option_a:
                  autoWrap(
                    row.option_a ||
                    ''
                  ),

                option_b:
                  autoWrap(
                    row.option_b ||
                    ''
                  ),

                option_c:
                  autoWrap(
                    row.option_c ||
                    ''
                  ),

                option_d:
                  autoWrap(
                    row.option_d ||
                    ''
                  ),

                correct_answer:
                  row.correct_answer ||
                  '',

                explanation:
                  autoWrap(
                    row.explanation ||
                    ''
                  )

              })
            )


          setProcessedData(
            converted
          )


          setExcelPreview(
            converted.slice(
              0,
              15
            )
          )


          alert(
            `${converted.length} question(s) converted.`
          )


        } catch (error) {

          console.error(
            error
          )

          alert(
            'Could not read the Excel file.'
          )

        }

      }


    reader.readAsArrayBuffer(
      excelFile
    )

  }


  /* =========================================================
     DOWNLOAD EXCEL
  ========================================================= */

  function downloadProcessedExcel() {

    if (
      !processedData.length
    ) {

      alert(
        'Please convert an Excel file first.'
      )

      return

    }


    const sheet =
      XLSX.utils.json_to_sheet(
        processedData
      )


    const workbook =
      XLSX.utils.book_new()


    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      'Converted'
    )


    XLSX.writeFile(
      workbook,
      'latex_converted.xlsx'
    )

  }


  /* =========================================================
     CURRENT QUESTION EXCEL
  ========================================================= */

  function downloadCurrentExcel() {

    const row = {

      question:
        autoWrap(question),

      option_a:
        autoWrap(optionA),

      option_b:
        autoWrap(optionB),

      option_c:
        autoWrap(optionC),

      option_d:
        autoWrap(optionD),

      correct_answer:
        correctAnswer,

      explanation:
        autoWrap(explanation)

    }


    const sheet =
      XLSX.utils.json_to_sheet(
        [row]
      )


    const workbook =
      XLSX.utils.book_new()


    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      'Question'
    )


    XLSX.writeFile(
      workbook,
      'question_latex.xlsx'
    )

  }


  /* =========================================================
     FIELDS
  ========================================================= */

  const fields = [

    {
      key: 'question',

      label: 'Question',

      value: question,

      setter:
        setQuestion,

      placeholder:
        'Type or paste the question here...',

      height: 145

    },

    {
      key: 'optionA',

      label: 'Option A',

      value: optionA,

      setter:
        setOptionA,

      placeholder:
        'Option A',

      height: 75

    },

    {
      key: 'optionB',

      label: 'Option B',

      value: optionB,

      setter:
        setOptionB,

      placeholder:
        'Option B',

      height: 75

    },

    {
      key: 'optionC',

      label: 'Option C',

      value: optionC,

      setter:
        setOptionC,

      placeholder:
        'Option C',

      height: 75

    },

    {
      key: 'optionD',

      label: 'Option D',

      value: optionD,

      setter:
        setOptionD,

      placeholder:
        'Option D',

      height: 75

    },

    {
      key: 'explanation',

      label: 'Explanation',

      value: explanation,

      setter:
        setExplanation,

      placeholder:
        'Explain the answer...',

      height: 120

    }

  ]


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {

    return (

      <div
        style={
          styles.loading
        }
      >

        Loading Question Studio...

      </div>

    )

  }


  /* =========================================================
     PAGE
  ========================================================= */

  return (

    <div
      style={
        styles.page
      }
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header
        style={
          styles.header
        }
      >

        <div
          style={
            styles.titleRow
          }
        >

          <span
            style={
              styles.rocket
            }
          >
            🚀
          </span>


          <div>

            <h1
              style={
                styles.title
              }
            >
              Question Studio
            </h1>


            <p
              style={
                styles.subtitle
              }
            >
              Build exam questions faster using OCR and LaTeX
            </p>


            <p
              style={
                styles.welcome
              }
            >
              Welcome, {adminName}
            </p>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main
        style={
          styles.main
        }
      >


        {/* ===================================================
            LEFT
        =================================================== */}

        <section>


          <div
            style={
              styles.sectionHeader
            }
          >

            <div>

              <h2
                style={
                  styles.sectionTitle
                }
              >
                Question Editor
              </h2>


              <p
                style={
                  styles.hint
                }
              >
                Select a field and use the formula toolbar.
              </p>

            </div>


            <button
              type="button"
              onClick={
                clearQuestion
              }
              style={
                styles.secondaryButton
              }
            >
              Clear
            </button>

          </div>


          {/* =================================================
              FORMULA TABS
          ================================================= */}

          <div
            style={
              styles.toolbarCard
            }
          >

            <div
              style={
                styles.tabs
              }
            >

              {[
                'math',
                'physics',
                'chemistry'
              ].map(
                tab => (

                  <button
                    key={tab}
                    type="button"
                    onClick={() =>
                      setActiveFormulaTab(
                        tab
                      )
                    }
                    style={{
                      ...styles.tab,

                      ...(activeFormulaTab === tab
                        ? styles.tabActive
                        : {})
                    }}
                  >

                    {
                      tab === 'math'
                        ? 'Mathematics'
                        : tab.charAt(0)
                            .toUpperCase() +
                          tab.slice(1)
                    }

                  </button>

                )
              )}

            </div>


            <div
              style={
                styles.toolbar
              }
            >

              {TOOLBAR[
                activeFormulaTab
              ].map(
                (button, index) => (

                  <button
                    key={
                      `${button.label}-${index}`
                    }
                    type="button"
                    title={
                      button.latex
                    }
                    onClick={() =>
                      insertFormula(
                        button.latex
                      )
                    }
                    style={
                      styles.toolButton
                    }
                  >
                    {button.label}
                  </button>

                )
              )}

            </div>


            <div
              style={
                styles.toolbarHint
              }
            >
              Formula buttons insert LaTeX into the selected field.
            </div>

          </div>


          {/* =================================================
              FIELDS
          ================================================= */}

          {fields.map(
            field => (

              <div
                key={
                  field.key
                }
                onClick={() =>
                  setActiveField(
                    field.key
                  )
                }
                style={{
                  ...styles.fieldCard,

                  ...(activeField === field.key
                    ? styles.fieldActive
                    : {})
                }}
              >


                <div
                  style={
                    styles.fieldHeader
                  }
                >

                  <strong
                    style={
                      styles.fieldLabel
                    }
                  >
                    {field.label}
                  </strong>


                  <button
                    type="button"
                    onClick={
                      event => {

                        event.stopPropagation()

                        setActiveField(
                          field.key
                        )

                        copyFieldLaTeX(
                          field.key
                        )

                      }
                    }
                    style={
                      styles.miniButton
                    }
                  >
                    Copy LaTeX
                  </button>

                </div>


                <textarea
                  ref={
                    element => {

                      inputRefs.current[
                        field.key
                      ] = element

                    }
                  }
                  value={
                    field.value
                  }
                  onFocus={() =>
                    setActiveField(
                      field.key
                    )
                  }
                  onChange={
                    event =>
                      field.setter(
                        event.target.value
                      )
                  }
                  placeholder={
                    field.placeholder
                  }
                  spellCheck={false}
                  style={{
                    ...styles.textarea,

                    minHeight:
                      field.height
                  }}
                />


                <div
                  style={
                    styles.outputTitle
                  }
                >
                  LaTeX
                </div>


                <textarea
                  value={
                    autoWrap(
                      field.value
                    )
                  }
                  readOnly
                  spellCheck={false}
                  style={
                    styles.output
                  }
                />

              </div>

            )
          )}


          {/* =================================================
              ANSWER
          ================================================= */}

          <div
            style={
              styles.answerCard
            }
          >

            <strong
              style={
                styles.fieldLabel
              }
            >
              Correct Answer
            </strong>


            <div
              style={
                styles.answerButtons
              }
            >

              {[
                'A',
                'B',
                'C',
                'D'
              ].map(
                answer => (

                  <button
                    key={answer}
                    type="button"
                    onClick={() =>
                      setCorrectAnswer(
                        answer
                      )
                    }
                    style={{
                      ...styles.answerButton,

                      ...(correctAnswer === answer
                        ? styles.answerActive
                        : {})
                    }}
                  >
                    {answer}
                  </button>

                )
              )}

            </div>

          </div>


          {/* =================================================
              OUTPUT ACTIONS
          ================================================= */}

          <div
            style={
              styles.actionRow
            }
          >

            <button
              type="button"
              onClick={
                copyQuestionLaTeX
              }
              style={
                styles.primaryButton
              }
            >
              📋 Copy LaTeX
            </button>


            <button
              type="button"
              onClick={
                downloadCurrentExcel
              }
              style={
                styles.secondaryButton
              }
            >
              📊 Excel
            </button>


            <button
              type="button"
              disabled={
                wordLoading
              }
              onClick={
                exportToWord
              }
              style={{
                ...styles.wordButton,

                ...(wordLoading
                  ? styles.disabled
                  : {})
              }}
            >

              {wordLoading
                ? 'Creating Word...'
                : '📄 Export to Word'}

            </button>

          </div>


          {/* =================================================
              OUTPUT EXPLANATION
          ================================================= */}

          <div
            style={
              styles.formatInfo
            }
          >

            <div>

              <strong>
                📦 LaTeX
              </strong>

              <span>
                Use for Excel / database storage
              </span>

            </div>


            <div>

              <strong>
                📄 Word
              </strong>

              <span>
                Export creates editable Word equations
              </span>

            </div>

          </div>


          {/* =================================================
              OCR
          ================================================= */}

          <section
            style={
              styles.card
            }
          >

            <h2
              style={
                styles.sectionTitle
              }
            >
              📷 OCR
            </h2>


            <p
              style={
                styles.hint
              }
            >
              Copy a screenshot using Win + Shift + S,
              then press Ctrl + V here. You can also drag
              or select an image.
            </p>


            <div
              tabIndex={0}

              onClick={
                event =>
                  event.currentTarget.focus()
              }

              onDragEnter={
                handleDragEnter
              }

              onDragOver={
                handleDrag
              }

              onDragLeave={
                handleDragLeave
              }

              onDrop={
                handleDrop
              }

              style={{
                ...styles.dropZone,

                ...(dragActive
                  ? styles.dropActive
                  : {})
              }}
            >

              <div
                style={
                  styles.dropIcon
                }
              >
                🖼️
              </div>


              <strong>
                Ctrl + V screenshot here
              </strong>


              <span
                style={
                  styles.dropText
                }
              >
                or drag and drop an image
              </span>


              <input
                type="file"
                accept="image/*"
                onChange={
                  event =>
                    handleImageFile(
                      event.target.files?.[0]
                    )
                }
                style={
                  styles.fileInput
                }
              />

            </div>


            {imagePreview && (

              <div
                style={
                  styles.imageBox
                }
              >

                <img
                  src={
                    imagePreview
                  }
                  alt="OCR source"
                  style={
                    styles.image
                  }
                />

              </div>

            )}


            <button
              type="button"
              disabled={
                ocrLoading
              }
              onClick={() =>
                processImageOCR()
              }
              style={{
                ...styles.primaryButton,

                marginTop: 12,

                ...(ocrLoading
                  ? styles.disabled
                  : {})
              }}
            >

              {ocrLoading
                ? `Reading Image... ${ocrProgress}%`
                : 'Extract Question from Image'}

            </button>

          </section>


          {/* =================================================
              EXCEL
          ================================================= */}

          <section
            style={
              styles.card
            }
          >

            <h2
              style={
                styles.sectionTitle
              }
            >
              📊 Excel Conversion
            </h2>


            <p
              style={
                styles.hint
              }
            >
              Convert an existing question bank into
              LaTeX-formatted questions.
            </p>


            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={
                event =>
                  setExcelFile(
                    event.target.files?.[0] ||
                    null
                  )
              }
              style={
                styles.fileInputStandalone
              }
            />


            <div
              style={
                styles.actionRow
              }
            >

              <button
                type="button"
                onClick={
                  processExcel
                }
                style={
                  styles.primaryButton
                }
              >
                Convert Excel
              </button>


              <button
                type="button"
                onClick={
                  downloadProcessedExcel
                }
                style={
                  styles.secondaryButton
                }
              >
                Download Converted Excel
              </button>

            </div>


            {excelPreview.length > 0 && (

              <div
                style={
                  styles.excelPreview
                }
              >

                <strong>
                  Preview — first {
                    excelPreview.length
                  } rows
                </strong>


                <div
                  style={
                    styles.tableWrap
                  }
                >

                  <table
                    style={
                      styles.table
                    }
                  >

                    <thead>

                      <tr>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Question
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          A
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          B
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          C
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          D
                        </th>

                        <th
                          style={
                            styles.th
                          }
                        >
                          Answer
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {excelPreview.map(
                        (
                          row,
                          index
                        ) => (

                          <tr
                            key={
                              index
                            }
                          >

                            <td
                              style={
                                styles.td
                              }
                            >
                              {
                                row.question ||
                                ''
                              }
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {
                                row.option_a ||
                                ''
                              }
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {
                                row.option_b ||
                                ''
                              }
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {
                                row.option_c ||
                                ''
                              }
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {
                                row.option_d ||
                                ''
                              }
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {
                                row.correct_answer ||
                                ''
                              }
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            )}

          </section>

        </section>


        {/* ===================================================
            RIGHT PREVIEW
        =================================================== */}

        <aside>

          <div
            style={
              styles.previewSticky
            }
          >

            <div
              style={
                styles.previewHeader
              }
            >

              <div>

                <h2
                  style={
                    styles.sectionTitle
                  }
                >
                  Live Preview
                </h2>


                <p
                  style={
                    styles.hint
                  }
                >
                  Rendered exactly from the LaTeX output.
                </p>

              </div>

            </div>


            <div
              ref={
                previewRef
              }
              style={
                styles.preview
              }
            />


            <div
              style={
                styles.correctBox
              }
            >

              <strong>
                Correct Answer:
              </strong>

              <span>
                {correctAnswer}
              </span>

            </div>


            <div
              style={
                styles.tipBox
              }
            >

              <strong>
                Output strategy
              </strong>


              <div
                style={{
                  marginTop: 7
                }}
              >

                <b>
                  Excel / DB:
                </b>

                {' '}
                store the LaTeX.


                <br />


                <b>
                  Word:
                </b>

                {' '}
                use Export to Word for
                editable Word equations.


                <br />
                <br />


                Example:

                <br />


                <code>
                  KE = \frac{'{1}{2}'}mv^2
                </code>

              </div>

            </div>

          </div>

        </aside>

      </main>


      {/* =====================================================
          PREVIEW STYLES
      ===================================================== */}

      <style jsx global>{`

        .qs-question {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eaecf0;
        }

        .qs-option {
          margin-bottom: 12px;
          padding: 12px;
          border-radius: 7px;
          background: #f8fafc;
          line-height: 1.7;
        }

        .qs-explanation {
          margin-top: 25px;
          padding: 15px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #eaecf0;
        }

        .qs-label {
          font-size: 11px;
          font-weight: 700;
          color: #667085;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 7px;
        }

        .qs-content {
          font-size: 17px;
          line-height: 1.75;
          color: #101828;
        }

        .qs-empty {
          color: #98a2b3;
          text-align: center;
          padding: 70px 20px;
          font-size: 15px;
        }

        .katex {
          font-size: 1.08em;
        }

      `}</style>

    </div>

  )

}


/* ============================================================
   STYLES
============================================================ */

const styles = {

  page: {

    minHeight:
      '100vh',

    background:
      '#f5f7fb',

    color:
      '#172033',

    fontFamily:
      'Arial, Helvetica, sans-serif',

    paddingBottom:
      50

  },


  loading: {

    minHeight:
      '100vh',

    display:
      'flex',

    alignItems:
      'center',

    justifyContent:
      'center',

    fontSize:
      18

  },


  header: {

    background:
      '#ffffff',

    borderBottom:
      '1px solid #e5e7eb',

    padding:
      '20px 30px'

  },


  titleRow: {

    display:
      'flex',

    alignItems:
      'center',

    gap:
      12

  },


  rocket: {

    fontSize:
      30

  },


  title: {

    margin:
      0,

    fontSize:
      30,

    color:
      '#111827'

  },


  subtitle: {

    margin:
      '6px 0 0',

    color:
      '#667085',

    fontSize:
      14

  },


  welcome: {

    margin:
      '6px 0 0',

    color:
      '#475467',

    fontSize:
      13

  },


  main: {

    maxWidth:
      1500,

    margin:
      '22px auto',

    padding:
      '0 22px',

    display:
      'grid',

    gridTemplateColumns:
      'minmax(0, 1.2fr) minmax(420px, 0.8fr)',

    gap:
      22,

    alignItems:
      'start'

  },


  previewSticky: {

    position:
      'sticky',

    top:
      15

  },


  sectionHeader: {

    display:
      'flex',

    justifyContent:
      'space-between',

    alignItems:
      'flex-start',

    marginBottom:
      14,

    gap:
      15

  },


  sectionTitle: {

    margin:
      0,

    fontSize:
      19,

    color:
      '#111827'

  },


  hint: {

    margin:
      '5px 0 0',

    color:
      '#667085',

    fontSize:
      13,

    lineHeight:
      1.5

  },


  toolbarCard: {

    background:
      '#ffffff',

    border:
      '1px solid #e1e5ea',

    borderRadius:
      10,

    padding:
      13,

    marginBottom:
      14

  },


  tabs: {

    display:
      'flex',

    gap:
      7,

    flexWrap:
      'wrap',

    marginBottom:
      10

  },


  tab: {

    padding:
      '7px 13px',

    border:
      '1px solid #d0d5dd',

    borderRadius:
      6,

    background:
      '#f8fafc',

    color:
      '#344054',

    cursor:
      'pointer',

    fontSize:
      13,

    fontWeight:
      600

  },


  tabActive: {

    background:
      '#2563eb',

    color:
      '#ffffff',

    borderColor:
      '#2563eb'

  },


  toolbar: {

    display:
      'flex',

    flexWrap:
      'wrap',

    gap:
      7

  },


  toolButton: {

    minWidth:
      52,

    minHeight:
      36,

    padding:
      '6px 9px',

    border:
      '1px solid #d0d5dd',

    borderRadius:
      6,

    background:
      '#ffffff',

    color:
      '#1d2939',

    cursor:
      'pointer',

    fontSize:
      13,

    fontWeight:
      600

  },


  toolbarHint: {

    marginTop:
      9,

    fontSize:
      11,

    color:
      '#98a2b3'

  },


  fieldCard: {

    background:
      '#ffffff',

    border:
      '1px solid #e1e5ea',

    borderRadius:
      10,

    padding:
      14,

    marginBottom:
      13

  },


  fieldActive: {

    border:
      '1px solid #2563eb',

    boxShadow:
      '0 0 0 2px rgba(37,99,235,0.08)'

  },


  fieldHeader: {

    display:
      'flex',

    justifyContent:
      'space-between',

    alignItems:
      'center',

    marginBottom:
      7

  },


  fieldLabel: {

    fontSize:
      14,

    color:
      '#1d2939'

  },


  miniButton: {

    border:
      '1px solid #d0d5dd',

    background:
      '#ffffff',

    color:
      '#344054',

    padding:
      '5px 8px',

    borderRadius:
      5,

    cursor:
      'pointer',

    fontSize:
      11

  },


  textarea: {

    width:
      '100%',

    boxSizing:
      'border-box',

    resize:
      'vertical',

    padding:
      11,

    border:
      '1px solid #cfd4dc',

    borderRadius:
      7,

    fontFamily:
      'Consolas, "Courier New", monospace',

    fontSize:
      14,

    lineHeight:
      1.6,

    outline:
      'none',

    color:
      '#111827'

  },


  outputTitle: {

    marginTop:
      9,

    marginBottom:
      5,

    fontSize:
      11,

    fontWeight:
      700,

    color:
      '#667085',

    textTransform:
      'uppercase'

  },


  output: {

    width:
      '100%',

    minHeight:
      50,

    boxSizing:
      'border-box',

    resize:
      'vertical',

    padding:
      10,

    border:
      '1px solid #e4e7ec',

    borderRadius:
      7,

    fontFamily:
      'Consolas, "Courier New", monospace',

    fontSize:
      13,

    lineHeight:
      1.5,

    color:
      '#344054',

    background:
      '#f8fafc'

  },


  answerCard: {

    background:
      '#ffffff',

    border:
      '1px solid #e1e5ea',

    borderRadius:
      10,

    padding:
      14,

    marginBottom:
      14

  },


  answerButtons: {

    display:
      'flex',

    gap:
      9,

    marginTop:
      10

  },


  answerButton: {

    width:
      45,

    height:
      38,

    borderRadius:
      7,

    border:
      '1px solid #d0d5dd',

    background:
      '#ffffff',

    cursor:
      'pointer',

    fontWeight:
      700

  },


  answerActive: {

    background:
      '#16a34a',

    color:
      '#ffffff',

    borderColor:
      '#16a34a'

  },


  actionRow: {

    display:
      'flex',

    gap:
      9,

    flexWrap:
      'wrap',

    marginBottom:
      18

  },


  primaryButton: {

    border:
      'none',

    background:
      '#2563eb',

    color:
      '#ffffff',

    padding:
      '10px 14px',

    borderRadius:
      7,

    cursor:
      'pointer',

    fontSize:
      13,

    fontWeight:
      700

  },


  wordButton: {

    border:
      'none',

    background:
      '#0f766e',

    color:
      '#ffffff',

    padding:
      '10px 14px',

    borderRadius:
      7,

    cursor:
      'pointer',

    fontSize:
      13,

    fontWeight:
      700

  },


  secondaryButton: {

    border:
      '1px solid #d0d5dd',

    background:
      '#ffffff',

    color:
      '#344054',

    padding:
      '9px 13px',

    borderRadius:
      7,

    cursor:
      'pointer',

    fontSize:
      13,

    fontWeight:
      600

  },


  disabled: {

    opacity:
      0.6,

    cursor:
      'not-allowed'

  },


  formatInfo: {

    display:
      'grid',

    gridTemplateColumns:
      '1fr 1fr',

    gap:
      10,

    marginBottom:
      18

  },


  formatInfoItem: {

    background:
      '#ffffff',

    border:
      '1px solid #eaecf0',

    borderRadius:
      8,

    padding:
      11

  },


  card: {

    background:
      '#ffffff',

    border:
      '1px solid #e1e5ea',

    borderRadius:
      10,

    padding:
      15,

    marginBottom:
      18

  },


  dropZone: {

    border:
      '2px dashed #93c5fd',

    borderRadius:
      10,

    padding:
      25,

    textAlign:
      'center',

    background:
      '#f8fbff',

    cursor:
      'pointer'

  },


  dropActive: {

    border:
      '2px dashed #2563eb',

    background:
      '#eff6ff'

  },


  dropIcon: {

    fontSize:
      28,

    marginBottom:
      7

  },


  dropText: {

    display:
      'block',

    marginTop:
      5,

    color:
      '#667085',

    fontSize:
      12

  },


  fileInput: {

    display:
      'block',

    margin:
      '14px auto 0',

    maxWidth:
      '100%',

    fontSize:
      12

  },


  fileInputStandalone: {

    display:
      'block',

    margin:
      '13px 0',

    maxWidth:
      '100%'

  },


  imageBox: {

    marginTop:
      13,

    padding:
      10,

    border:
      '1px solid #e4e7ec',

    borderRadius:
      8,

    background:
      '#f8fafc'

  },


  image: {

    display:
      'block',

    maxWidth:
      '100%',

    maxHeight:
      280,

    margin:
      '0 auto',

    borderRadius:
      6

  },


  excelPreview: {

    marginTop:
      14,

    borderTop:
      '1px solid #eaecf0',

    paddingTop:
      12

  },


  tableWrap: {

    overflowX:
      'auto',

    marginTop:
      9,

    border:
      '1px solid #eaecf0',

    borderRadius:
      7

  },


  table: {

    width:
      '100%',

    borderCollapse:
      'collapse',

    fontSize:
      11,

    minWidth:
      850

  },


  th: {

    padding:
      8,

    textAlign:
      'left',

    background:
      '#f8fafc',

    borderBottom:
      '1px solid #eaecf0',

    whiteSpace:
      'nowrap'

  },


  td: {

    padding:
      8,

    borderBottom:
      '1px solid #eaecf0',

    verticalAlign:
      'top',

    maxWidth:
      300

  },


  previewHeader: {

    display:
      'flex',

    justifyContent:
      'space-between',

    alignItems:
      'flex-start',

    gap:
      12,

    marginBottom:
      12

  },


  preview: {

    background:
      '#ffffff',

    border:
      '1px solid #dfe3e8',

    borderRadius:
      10,

    padding:
      24,

    minHeight:
      500,

    lineHeight:
      1.8,

    fontSize:
      17,

    overflowWrap:
      'break-word',

    wordBreak:
      'break-word',

    boxShadow:
      '0 2px 8px rgba(16,24,40,0.04)'

  },


  correctBox: {

    marginTop:
      12,

    display:
      'flex',

    gap:
      7,

    background:
      '#ecfdf3',

    border:
      '1px solid #abefc6',

    borderRadius:
      8,

    padding:
      10,

    color:
      '#027a48',

    fontSize:
      13

  },


  tipBox: {

    marginTop:
      12,

    background:
      '#f8fafc',

    border:
      '1px solid #eaecf0',

    borderRadius:
      8,

    padding:
      11,

    color:
      '#667085',

    fontSize:
      12,

    lineHeight:
      1.6

  }

}
