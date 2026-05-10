export function calculateExamMetrics({

  session,
  questions,
  exam

}) {

  const answers =
    session?.answers || {}

  let correct = 0
  let wrong = 0
  let unattempted = 0

  const marksPerQuestion =
    Number(
      exam?.marks_per_question || 4
    )

  const negativeMarks =
    Number(
      exam?.negative_marks || 1
    )

  ;(questions || []).forEach(q => {

    const studentAnswer =
      answers[q.id]

    // unattempted

    if (
      studentAnswer === undefined ||
      studentAnswer === null ||
      studentAnswer === ''
    ) {

      unattempted += 1
      return
    }

    // correct

    if (
      String(studentAnswer).trim()
      ===
      String(q.correct_option).trim()
    ) {

      correct += 1

    } else {

      wrong += 1
    }
  })

  const attempted =
    correct + wrong

  const accuracy =

    attempted > 0

      ? Number(
          (
            (correct / attempted) * 100
          ).toFixed(2)
        )

      : 0

  const calculatedScore =

    (correct * marksPerQuestion)

    -

    (wrong * negativeMarks)

  return {

    correct,

    wrong,

    unattempted,

    attempted,

    accuracy,

    calculatedScore
  }
}
