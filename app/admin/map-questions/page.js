'use client'

import { Suspense } from 'react'
import MapQuestionsClient from './MapQuestionsClient'

export default function MapQuestionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MapQuestionsClient />
    </Suspense>
  )
}
