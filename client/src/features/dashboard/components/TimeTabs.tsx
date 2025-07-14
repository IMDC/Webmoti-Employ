import { FloatingIndicator, Tabs } from '@mantine/core'
import { useRef, useState } from 'react'
import classes from './TimeTabs.module.css'

interface TimeTabsProps {
  value: string
  onChange: (val: string | null) => void
}

export function TimeTabs({ value, onChange }: TimeTabsProps) {
  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null)
  const controlRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const setControlRef = (key: string) => (el: HTMLButtonElement | null) => {
    controlRefs.current[key] = el
  }

  return (
    <Tabs variant="none" value={value} onChange={onChange}>
      <Tabs.List ref={setRootRef} className={classes.list}>
        <Tabs.Tab value="today" ref={setControlRef('today')} className={classes.tab}>
          Today
        </Tabs.Tab>
        <Tabs.Tab value="upcoming" ref={setControlRef('upcoming')} className={classes.tab}>
          Upcoming
        </Tabs.Tab>
        <Tabs.Tab value="past" ref={setControlRef('past')} className={classes.tab}>
          Past
        </Tabs.Tab>

        <FloatingIndicator
          target={value ? controlRefs.current[value] : null}
          parent={rootRef}
          className={classes.indicator}
        />
      </Tabs.List>
    </Tabs>
  )
}
