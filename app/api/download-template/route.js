export const dynamic = 'force-dynamic'
import ExcelJS from 'exceljs'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {

    // ============================
    // 1. FETCH MASTER DATA
    // ============================
    const { data, error } = await supabase
      .from('subjects_master')
      .select('exam_category, subject, chapter, subtopic')
      .eq('is_active', true)

    if (error) throw error

    // ============================
    // 2. UNIQUE VALUES
    // ============================
    const examCategories = [...new Set(data.map(d => d.exam_category))]
    const subjects = [...new Set(data.map(d => d.subject))]
    const chapters = [...new Set(data.map(d => d.chapter))]
    const subtopics = [...new Set(data.map(d => d.subtopic))]

    // ============================
    // 3. CREATE WORKBOOK
    // ============================
    const workbook = new ExcelJS.Workbook()

    const sheet = workbook.addWorksheet('Template')
    const masterSheet = workbook.addWorksheet('MasterData')

    // ============================
    // 4. HEADERS
    // ============================
    sheet.columns = [
      { header: 'exam_category', key: 'exam_category', width: 20 },
      { header: 'subject', key: 'subject', width: 20 },
      { header: 'chapter', key: 'chapter', width: 25 },
      { header: 'subtopic', key: 'subtopic', width: 25 },
      { header: 'difficulty', key: 'difficulty', width: 15 },
      { header: 'question', key: 'question', width: 40 },
      { header: 'image_name', key: 'image_name', width: 20 },
      { header: 'option_a', key: 'option_a', width: 25 },
      { header: 'option_b', key: 'option_b', width: 25 },
      { header: 'option_c', key: 'option_c', width: 25 },
      { header: 'option_d', key: 'option_d', width: 25 },
      { header: 'correct_answer', key: 'correct_answer', width: 15 },
      { header: 'explanation', key: 'explanation', width: 40 },
      { header: 'explanation_image_name', key: 'explanation_image_name', width: 25 }
    ]

    // ============================
    // 5. MASTER SHEET DATA
    // ============================
    masterSheet.getCell('A1').value = 'exam_category'
    masterSheet.getCell('B1').value = 'subject'
    masterSheet.getCell('C1').value = 'chapter'
    masterSheet.getCell('D1').value = 'subtopic'

    examCategories.forEach((v, i) => masterSheet.getCell(`A${i + 2}`).value = v)
    subjects.forEach((v, i) => masterSheet.getCell(`B${i + 2}`).value = v)
    chapters.forEach((v, i) => masterSheet.getCell(`C${i + 2}`).value = v)
    subtopics.forEach((v, i) => masterSheet.getCell(`D${i + 2}`).value = v)

    // Hide master sheet
    masterSheet.state = 'hidden'

    // ============================
    // 6. DROPDOWNS
    // ============================
    const addValidation = (col, formula) => {
      for (let i = 2; i <= 1000; i++) {
        sheet.getCell(`${col}${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [formula]
        }
      }
    }

    addValidation('A', `MasterData!$A$2:$A$${examCategories.length + 1}`)
    addValidation('B', `MasterData!$B$2:$B$${subjects.length + 1}`)
    addValidation('C', `MasterData!$C$2:$C$${chapters.length + 1}`)
    addValidation('D', `MasterData!$D$2:$D$${subtopics.length + 1}`)

    addValidation('E', '"Easy,Medium,Hard"')
    addValidation('L', '"A,B,C,D"')

    // ============================
    // 7. SAMPLE ROW
    // ============================
    sheet.addRow({
      exam_category: examCategories[0] || 'JEE_MAINS',
      subject: subjects[0] || 'Physics',
      chapter: chapters[0] || 'Mechanics',
      subtopic: subtopics[0] || 'Kinematics',
      difficulty: 'Easy',
      question: 'Sample question here',
      option_a: 'Option A',
      option_b: 'Option B',
      option_c: 'Option C',
      option_d: 'Option D',
      correct_answer: 'A',
      explanation: 'Sample explanation'
    })

    // ============================
    // 8. GENERATE FILE
    // ============================
    const buffer = await workbook.xlsx.writeBuffer()

    return new Response(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition':
          'attachment; filename=question_template.xlsx'
      }
    })

  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to generate template' }, { status: 500 })
  }
}
