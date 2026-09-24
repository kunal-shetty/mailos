import { ActionQueueView } from '@/components/ActionQueueView'
import { PageHeader } from '@/components/PageHeader'

export default function ActionsPage() {
  return (
    <>
      <PageHeader
        kicker="Queue"
        title="Action queue"
        subtitle="Color-coded by what blows up if you ignore it."
      />
      <ActionQueueView />
    </>
  )
}
