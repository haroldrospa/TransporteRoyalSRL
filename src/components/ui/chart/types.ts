
import { ComponentProps } from "react"
import * as RechartsPrimitive from "recharts"
import { THEMES } from "./constants"

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

export type ChartContextProps = {
  config: ChartConfig
}

export type ChartContainerProps = ComponentProps<"div"> & {
  config: ChartConfig
  children: ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}

export type ChartStyleProps = {
  id: string
  config: ChartConfig
}

export type ChartTooltipContentProps = ComponentProps<typeof RechartsPrimitive.Tooltip> &
  ComponentProps<"div"> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
  }
