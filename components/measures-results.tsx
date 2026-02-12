"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Save, Plus, X } from "lucide-react";
import {
  MeasureConfig,
  MeasureResult,
  MEASURE_TYPES,
  measureConfigName,
} from "@/lib/types";
import { useState, useRef, useEffect } from "react";

interface Props {
  measures: MeasureResult[];
  loading: boolean;
  onSave: () => void;
  canSave: boolean;
  activeMeasures: MeasureConfig[];
  onMeasuresChange: (measures: MeasureConfig[]) => void;
}

function InlineParamInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const charWidth = Math.max(text.length, 1);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      className="bg-transparent border-none outline-none p-0 m-0 font-mono text-xs tabular-nums"
      style={{ width: `${charWidth}ch` }}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseFloat(e.target.value);
        if (!isNaN(n) && n >= 0) onChange(n);
      }}
      onBlur={() => {
        const n = parseFloat(text);
        if (isNaN(n) || n < 0) setText(String(value));
      }}
    />
  );
}

function InlineAlienationSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      className="bg-transparent border-none outline-none p-0 m-0 font-mono text-xs cursor-pointer appearance-none"
      style={{ width: `${value.length + 1}ch` }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function MeasureNameCell({
  config,
  onChange,
}: {
  config: MeasureConfig;
  onChange: (cfg: MeasureConfig) => void;
}) {
  const typeDef = MEASURE_TYPES.find((t) => t.type === config.type);
  if (!typeDef || typeDef.params.length === 0) {
    return <span>{measureConfigName(config)}</span>;
  }

  const updateParam = (key: string, value: number | string) => {
    onChange({ ...config, params: { ...config.params, [key]: value } });
  };

  // Build inline display with editable params
  const t = config.type;
  if (t === "EstebanRay") {
    return (
      <span>
        ER(
        <InlineParamInput
          value={Number(config.params.alpha ?? 0.8)}
          onChange={(v) => updateParam("alpha", v)}
        />
        )
      </span>
    );
  }
  if (t === "MECNormalized") {
    return (
      <span>
        MEC(
        <InlineParamInput
          value={Number(config.params.alpha ?? 2)}
          onChange={(v) => updateParam("alpha", v)}
        />
        ,
        <InlineParamInput
          value={Number(config.params.beta ?? 1.15)}
          onChange={(v) => updateParam("beta", v)}
        />
        )N
      </span>
    );
  }
  if (t === "MEC") {
    return (
      <span>
        MEC(
        <InlineParamInput
          value={Number(config.params.alpha ?? 2)}
          onChange={(v) => updateParam("alpha", v)}
        />
        ,
        <InlineParamInput
          value={Number(config.params.beta ?? 1.15)}
          onChange={(v) => updateParam("beta", v)}
        />
        )
      </span>
    );
  }
  if (t === "GeneralizedER") {
    const alienDef = typeDef.params.find((p) => p.key === "alienation");
    return (
      <span>
        GER(
        <InlineParamInput
          value={Number(config.params.alpha ?? 0.8)}
          onChange={(v) => updateParam("alpha", v)}
        />
        ,
        <InlineAlienationSelect
          value={String(config.params.alienation ?? "d")}
          options={alienDef?.options ?? ["d"]}
          onChange={(v) => updateParam("alienation", v)}
        />
        )
      </span>
    );
  }

  return <span>{measureConfigName(config)}</span>;
}

export function MeasuresResults({
  measures,
  loading,
  onSave,
  canSave,
  activeMeasures,
  onMeasuresChange,
}: Props) {
  const removeMeasure = (idx: number) => {
    if (activeMeasures.length <= 1) return;
    onMeasuresChange(activeMeasures.filter((_, i) => i !== idx));
  };

  const addMeasure = (type: string) => {
    const typeDef = MEASURE_TYPES.find((t) => t.type === type);
    if (!typeDef) return;
    const params: Record<string, number | string> = {};
    for (const p of typeDef.params) {
      params[p.key] = p.default;
    }
    onMeasuresChange([...activeMeasures, { type, params }]);
  };

  const updateMeasure = (idx: number, cfg: MeasureConfig) => {
    const next = [...activeMeasures];
    next[idx] = cfg;
    onMeasuresChange(next);
  };

  return (
    <div className="overflow-hidden rounded-md border text-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-1.5 px-2 text-xs">Measure</TableHead>
            <TableHead className="py-1.5 px-2 text-xs text-right">
              <div className="flex items-center justify-end gap-1">
                Value
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={onSave}
                      disabled={!canSave}
                    >
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save to table</TooltipContent>
                </Tooltip>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeMeasures.map((cfg, idx) => {
            const result = measures[idx];
            return (
              <TableRow key={`${cfg.type}-${idx}`} className="group">
                <TableCell className="py-1 px-2 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => removeMeasure(idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
                      disabled={activeMeasures.length <= 1}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <MeasureNameCell
                      config={cfg}
                      onChange={(c) => updateMeasure(idx, c)}
                    />
                  </div>
                </TableCell>
                <TableCell className="py-1 px-2 text-xs text-right font-mono">
                  {result?.error ? (
                    <span className="text-muted-foreground">
                      {result.error}
                    </span>
                  ) : result?.value != null ? (
                    result.value.toFixed(4)
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {loading && measures.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={2}
                className="py-2 px-2 text-xs text-muted-foreground text-center"
              >
                Computing...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-2 py-1 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {MEASURE_TYPES.filter((t) => {
              if (t.params.length > 0) return true;
              return !activeMeasures.some((m) => m.type === t.type);
            }).map((t) => (
              <DropdownMenuItem key={t.type} onClick={() => addMeasure(t.type)}>
                {t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {loading && measures.length > 0 && (
          <span className="text-[10px] text-muted-foreground">Updating...</span>
        )}
      </div>
    </div>
  );
}
