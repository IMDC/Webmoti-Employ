import { createContext, use } from 'react'

export const BurgerContext = createContext<{ opened: boolean, toggle: () => void } | null>(null)

export function useAdminBurger() {
  return use(BurgerContext)
}
