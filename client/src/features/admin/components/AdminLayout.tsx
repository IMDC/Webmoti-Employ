import { AppShell, Divider, Group, NavLink, Title } from '@mantine/core'
import { IconArrowLeft, IconList, IconShieldCheck, IconUsers, IconVideo } from '@tabler/icons-react'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { Loading } from '@/components/Loading'
import { UserButton } from '@/features/auth/components/UserButton'
import { useIsAdmin } from '../queries'

const navItems = [
  { label: 'Allowlist', icon: IconList, path: '/admin/allowlist' },
  { label: 'Users', icon: IconUsers, path: '/admin/users' },
  { label: 'Interviews', icon: IconShieldCheck, path: '/admin/interviews' },
  { label: 'Live Sessions', icon: IconVideo, path: '/admin/live-sessions' },
]

export function AdminLayout() {
  const { data: isAdmin, isPending } = useIsAdmin()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: s => s.location.pathname })

  if (isPending) {
    return <Loading />
  }

  if (!isAdmin) {
    navigate({ to: '/' })
    return null
  }

  return (
    <AppShell
      navbar={{ width: 220, breakpoint: 'sm' }}
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
            onClick={() => navigate({ to: item.path })}
          />
        ))}
        <Divider my="sm" />
        <NavLink
          label="Back to Dashboard"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => navigate({ to: '/' })}
        />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
