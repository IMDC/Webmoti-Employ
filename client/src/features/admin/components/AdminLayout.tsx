import { AppShell, Divider, Group, NavLink, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconArrowLeft, IconCalendarPlus, IconDashboard, IconList, IconTie, IconUsers, IconVideo } from '@tabler/icons-react'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { Loading } from '@/components/Loading'
import { UserButton } from '@/features/auth/components/UserButton'
import { useIsAdmin } from '../queries'
import { BurgerContext } from './admin-burger-context'

const navItems = [
  { label: 'Overview', icon: IconDashboard, path: '/admin/overview' },
  { label: 'Allowlist', icon: IconList, path: '/admin/allowlist' },
  { label: 'Users', icon: IconUsers, path: '/admin/users' },
  { label: 'Schedule', icon: IconCalendarPlus, path: '/admin/schedule' },
  { label: 'Interviews', icon: IconTie, path: '/admin/interviews' },
  { label: 'Live Sessions', icon: IconVideo, path: '/admin/live-sessions' },
]

export function AdminLayout() {
  const { data: isAdmin, isPending } = useIsAdmin()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: s => s.location.pathname })
  const [opened, { toggle, close }] = useDisclosure()

  if (isPending) {
    return <Loading />
  }

  if (!isAdmin) {
    navigate({ to: '/' })
    return null
  }

  function handleNav(path: string) {
    navigate({ to: path })
    close()
  }

  return (
    <AppShell
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Navbar p="sm">
        <Group justify="space-between" mb="md">
          <Title order={4}>Admin</Title>
          <UserButton />
        </Group>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            label={item.label}
            leftSection={<item.icon size={18} />}
            active={pathname === item.path}
            onClick={() => handleNav(item.path)}
          />
        ))}
        <Divider my="sm" />
        <NavLink
          label="Back to Dashboard"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => handleNav('/')}
        />
      </AppShell.Navbar>
      <AppShell.Main>
        <BurgerContext value={{ opened, toggle }}>
          <Outlet />
        </BurgerContext>
      </AppShell.Main>
    </AppShell>
  )
}
