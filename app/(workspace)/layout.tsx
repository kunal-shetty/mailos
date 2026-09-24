import { MailosProvider } from '@/components/mailos-provider'
import { Sidebar } from '@/components/Sidebar'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/')

  return (
    <MailosProvider>
      <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
        <div className="mx-auto flex min-h-screen max-w-[1600px]">
          <Sidebar name={session.name} />
          <section className="min-w-0 flex-1 px-5 py-5 sm:px-8 lg:px-12 lg:py-8">{children}</section>
        </div>
      </main>
    </MailosProvider>
  )
}
