import { DashboardView } from '@/components/DashboardView'
import { PageHeader } from '@/components/PageHeader'
import { ProcessButton } from '@/components/ProcessButton'
import { getSession } from '@/lib/session'

export default async function DashboardPage() {
  const session = await getSession()
  const firstName = session?.name.split(' ')[0] ?? 'there'

  return (
    <>
      <PageHeader
        title={
          <>
            Good morning, {firstName}
            <span className="text-[#8dbd4a]">.</span>
          </>
        }
        subtitle="Here's what your inbox is asking for today."
        action={
          <div className="hidden md:block">
            <ProcessButton />
          </div>
        }
      />
      <DashboardView firstName={firstName} />
    </>
  )
}
