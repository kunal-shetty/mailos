import { CategoriesSettings } from '@/components/CategoriesSettings'
import { PageHeader } from '@/components/PageHeader'

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        kicker="Settings"
        title="Categories"
        subtitle="Teach Jev how to route your inbox. Changes apply on the next pass."
      />
      <CategoriesSettings />
    </>
  )
}
