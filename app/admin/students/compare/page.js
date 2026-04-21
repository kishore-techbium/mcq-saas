import { Suspense } from 'react'
import CompareClient from './CompareClient'

export default function Page() {
  return (
    <Suspense fallback={<p>Loading comparison...</p>}>
      <CompareClient />
    </Suspense>
  )
}
