import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: {
      light: string;
      dark: string;
    };
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-legend-item-text]:text-foreground [&_.recharts-sector:focus-visible]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(
    ([, item]) => item.color || item.theme?.light || item.theme?.dark,
  );

  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
[data-chart=${id}] {
${colorConfig
  .map(([key, item]) => {
    const light = item.theme?.light || item.color;
    return `  --color-${key}: ${light};\n`;
  })
  .join("")}
}
.dark [data-chart=${id}] {
${colorConfig
  .map(([key, item]) => {
    const dark = item.theme?.dark || item.color;
    return `  --color-${key}: ${dark};\n`;
  })
  .join("")}
}
`,
      }}
    />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
  active,
  payload,
  hideLabel = false,
  label,
  labelFormatter,
  formatter,
  indicator = "dot",
  className,
}: {
  active?: boolean;
  payload?: any[];
  hideLabel?: boolean;
  label?: React.ReactNode;
  labelFormatter?: (label: any, payload: any[]) => React.ReactNode;
  formatter?: (value: any, name: string, item: any, index: number, payload: any) => React.ReactNode;
  indicator?: "dot" | "line";
  className?: string;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  const tooltipLabel = !hideLabel
    ? labelFormatter
      ? labelFormatter(label, payload)
      : label
    : null;

  return (
    <div
      className={cn(
        "min-w-[10rem] rounded-lg border border-border/70 bg-background px-3 py-2 text-xs shadow-lg",
        className,
      )}
    >
      {tooltipLabel ? <div className="mb-1.5 font-medium">{tooltipLabel}</div> : null}
      <div className="grid gap-1">
        {payload.map((item: any, index: number) => {
          const dataKey = String(item.dataKey ?? item.name ?? "");
          const itemConfig = config[dataKey];
          const color = item.color || `var(--color-${dataKey})`;
          const rendered = formatter
            ? formatter(item.value, item.name, item, index, item.payload)
            : item.value;
          return (
            <div key={`${dataKey}-${index}`} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className={cn("inline-block size-2 rounded-full", indicator === "line" && "h-0.5 w-3 rounded-none")}
                  style={{ backgroundColor: color }}
                />
                <span>{itemConfig?.label ?? item.name}</span>
              </div>
              <span className="font-medium text-foreground">{rendered}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  payload,
  className,
}: React.ComponentProps<"div"> & { payload?: any[] }) {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3 pt-2", className)}>
      {payload.map((item: any) => {
        const key = String(item.dataKey ?? item.value ?? "");
        const entry = config[key];
        return (
          <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: item.color || `var(--color-${key})` }}
            />
            <span>{entry?.label ?? item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent };
