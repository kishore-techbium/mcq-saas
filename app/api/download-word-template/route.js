export const dynamic = 'force-dynamic'

import { supabaseServer } from '../../../lib/supabase-server'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel
} from 'docx'

export async function GET() {
  try {

    // ============================
    // 1. FETCH MASTER DATA
    // ============================
const { data, error } = await supabaseServer
  .from('subjects_master')
      .select('exam_category, subject, chapter, subtopic')
      .eq('is_active', true)
      .order('exam_category')

    if (error) throw error

    // ============================
    // 2. GROUP DATA
    // ============================
    const grouped = {}

    data.forEach(row => {
      const { exam_category, subject, chapter, subtopic } = row

      if (!grouped[exam_category]) grouped[exam_category] = {}
      if (!grouped[exam_category][subject]) grouped[exam_category][subject] = {}
      if (!grouped[exam_category][subject][chapter]) grouped[exam_category][subject][chapter] = []

      grouped[exam_category][subject][chapter].push(subtopic)
    })

    // ============================
    // 3. BUILD MASTER DATA TEXT
    // ============================
    const masterParagraphs = []

    Object.keys(grouped).forEach(exam => {

      masterParagraphs.push(
        new Paragraph({
          text: exam,
          heading: HeadingLevel.HEADING_2
        })
      )

      Object.keys(grouped[exam]).forEach(subject => {

        masterParagraphs.push(
          new Paragraph({
            text: subject,
            heading: HeadingLevel.HEADING_3
          })
        )

        Object.keys(grouped[exam][subject]).forEach(chapter => {

          const subtopics = grouped[exam][subject][chapter].join(', ')

          masterParagraphs.push(
            new Paragraph({
              text: `${chapter} → ${subtopics}`
            })
          )
        })
      })
    })

    // ============================
    // 4. DOCUMENT CONTENT
    // ============================
    const doc = new Document({
      sections: [
        {
          children: [

            // ========================
            // INSTRUCTIONS
            // ========================
            new Paragraph({
              text: 'INSTRUCTIONS',
              heading: HeadingLevel.HEADING_1
            }),

            new Paragraph('1. Do not change labels (Exam Category, Subject, Chapter, etc.)'),
            new Paragraph('2. Use values exactly from Master Data section'),
            new Paragraph('3. Insert Question Image immediately after Q'),
            new Paragraph('4. Insert Explanation Image under Explanation'),
            new Paragraph('5. Do not place images inside options (A, B, C, D)'),
            new Paragraph('6. You can use Word Equation Editor for math'),

            new Paragraph(''),

            // ========================
            // MASTER DATA
            // ========================
            new Paragraph({
              text: 'MASTER DATA',
              heading: HeadingLevel.HEADING_1
            }),

            ...masterParagraphs,

            new Paragraph(''),

            // ========================
            // QUESTION FORMAT
            // ========================
            new Paragraph({
              text: 'QUESTION FORMAT',
              heading: HeadingLevel.HEADING_1
            }),

            new Paragraph('----------------------------------------'),
            new Paragraph('Question 1:'),

            new Paragraph(''),
            new Paragraph('Exam Category: JEE_MAINS'),
            new Paragraph('Subject: Physics'),
            new Paragraph('Chapter: Mechanics'),
            new Paragraph('Subtopic: Kinematics'),
            new Paragraph('Difficulty: Easy'),

            new Paragraph(''),
            new Paragraph('Q: What is shown in the image below?'),

            new Paragraph('[Insert Question Image Here]'),

            new Paragraph(''),
            new Paragraph('A. Option A'),
            new Paragraph('B. Option B'),
            new Paragraph('C. Option C'),
            new Paragraph('D. Option D'),

            new Paragraph(''),
            new Paragraph('Answer: A'),

            new Paragraph(''),
            new Paragraph('Explanation:'),
            new Paragraph('This is explanation text.'),

            new Paragraph('[Insert Explanation Image Here]'),

            new Paragraph('----------------------------------------'),

          ]
        }
      ]
    })

    // ============================
    // 5. GENERATE FILE
    // ============================
    const buffer = await Packer.toBuffer(doc)

    return new Response(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition':
          'attachment; filename=word_question_template.docx'
      }
    })

  } 
  catch (err) {
  console.error('FULL ERROR:', err)

  return new Response(
    JSON.stringify({ error: err.message }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}
}
