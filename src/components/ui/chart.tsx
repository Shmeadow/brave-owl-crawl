"use client"

import * as React from "react"
import {
  Label,
  LabelList,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  type ContentType,
  type LayoutType,
  type PolarAngleAxisProps,
  type RadialBarProps,
  type TooltipProps,
  type XAxisProps,
  type YAxisProps,
} from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

// Chart
const Chart = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ChartContainer>
>(({ className, ...props }, ref) => (
  <ChartContainer
    ref={ref}
    className={cn("flex aspect-video justify-center text-foreground", className)}
    {...props}
  />
))
Chart.displayName = "Chart"

// ChartContent
const ChartContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    config: ChartConfig
    hideTooltip?: boolean
  }
>(({ config, hideTooltip, className, children, ...props }, ref) => {
  const contents = React.useMemo(() => {
    if (hideTooltip) return children

    return React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === ChartTooltip) {
        return null
      }
      return child
    })
  }, [hideTooltip, children])

  return (
    <div ref={ref} className={cn("grid h-full w-full", className)} {...props}>
      {contents}
    </div>
  )
})
ChartContent.displayName = "ChartContent"

// ChartTooltip
const ChartTooltip = ({ ...props }: React.ComponentPropsWithoutRef<typeof ChartTooltipContent>) => {
  return <ChartTooltipContent hideLabel hideIndicator {...props} />
}
ChartTooltip.displayName = "ChartTooltip"

// ChartLegend
const ChartLegend = ({ ...props }: React.ComponentPropsWithoutRef<typeof ChartLegendContent>) => {
  return <ChartLegendContent {...props} />
}
ChartLegend.displayName = "ChartLegend"

// ChartLabel
const ChartLabel = ({ ...props }: React.ComponentPropsWithoutRef<typeof Label>) => {
  return <Label {...props} />
}
ChartLabel.displayName = "ChartLabel"

// ChartLabelList
const ChartLabelList = ({ ...props }: React.ComponentPropsWithoutRef<typeof LabelList>) => {
  return <LabelList {...props} />
}
ChartLabelList.displayName = "ChartLabelList"

// ChartCrosshair
const ChartCrosshair = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    x?: number
    y?: number
    orientation?: "vertical" | "horizontal"
    className?: string
  }
>(({ x, y, orientation = "vertical", className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute inset-0 hidden data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full data-[orientation=horizontal]:border-t data-[orientation=vertical]:border-l data-[orientation=horizontal]:bg-background/50 data-[orientation=vertical]:bg-background/50",
      className
    )}
    data-orientation={orientation}
    style={
      orientation === "vertical"
        ? { left: x, top: 0, bottom: 0 }
        : { top: y, left: 0, right: 0 }
    }
    {...props}
  />
))
ChartCrosshair.displayName = "ChartCrosshair"

// ChartGrid
const ChartGrid = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    vertical?: boolean
    horizontal?: boolean
    className?: string
  }
>(({ vertical, horizontal, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute inset-0 hidden data-[horizontal=true]:grid-rows-[repeat(var(--rows),1fr)] data-[horizontal=true]:border-b data-[horizontal=true]:border-dashed data-[vertical=true]:grid-cols-[repeat(var(--columns),1fr)] data-[vertical=true]:border-r data-[vertical=true]:border-dashed",
      className
    )}
    data-horizontal={horizontal}
    data-vertical={vertical}
    {...props}
  />
))
ChartGrid.displayName = "ChartGrid"

// ChartPolarGrid
const ChartPolarGrid = ({ ...props }: React.ComponentPropsWithoutRef<typeof PolarGrid>) => {
  return <PolarGrid {...props} />
}
ChartPolarGrid.displayName = "ChartPolarGrid"

// ChartPolarAngleAxis
const ChartPolarAngleAxis = ({ ...props }: React.ComponentPropsWithoutRef<typeof PolarRadiusAxis>) => {
  return <PolarRadiusAxis {...props} />
}
ChartPolarAngleAxis.displayName = "ChartPolarAngleAxis"

// ChartPolarRadiusAxis
const ChartPolarRadiusAxis = ({ ...props }: React.ComponentPropsWithoutRef<typeof PolarRadiusAxis>) => {
  return <PolarRadiusAxis {...props} />
}
ChartPolarRadiusAxis.displayName = "ChartPolarRadiusAxis"

// ChartRadialBar
const ChartRadialBar = ({ ...props }: React.ComponentPropsWithoutRef<typeof RadialBar>) => {
  return <RadialBar {...props} />
}
ChartRadialBar.displayName = "ChartRadialBar"

// ChartRadialBarChart
const ChartRadialBarChart = ({ ...props }: React.ComponentPropsWithoutRef<typeof RadialBarChart>) => {
  return <RadialBarChart {...props} />
}
ChartRadialBarChart.displayName = "ChartRadialBarChart"

export {
  Chart,
  ChartContent,
  ChartTooltip,
  ChartLegend,
  ChartLabel,
  ChartLabelList,
  ChartCrosshair,
  ChartGrid,
  ChartPolarGrid,
  ChartPolarAngleAxis,
  ChartPolarRadiusAxis,
  ChartRadialBar,
  ChartRadialBarChart,
}