import { EmailDetailView } from '@/components/EmailDetailView'
import { PageHeader } from '@/components/PageHeader'

export default async function EmailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <PageHeader kicker="Email" title="Email detail" subtitle="Jev routes. Groq extracts. You decide." />
      <EmailDetailView id={id} />
    </>
  )
}
