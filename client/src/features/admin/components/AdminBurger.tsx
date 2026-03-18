import { Burger } from '@mantine/core'
import { useAdminBurger } from './admin-burger-context'

export function AdminBurger() {
  const ctx = useAdminBurger()
  if (!ctx) {
    return null
  }
  return <Burger opened={ctx.opened} onClick={ctx.toggle} size="sm" hiddenFrom="sm" />
}
