"use client";

import { Section, inputClass } from "@/components/admin/Field";
import { slugify } from "@/lib/slug";
import type { SizeChart } from "@/lib/types";

type Props = {
  chart: SizeChart;
  onChange: (chart: SizeChart) => void;
};

/** Plantillas para no empezar de cero en los casos habituales. */
const PRESETS: Record<string, SizeChart> = {
  "Tallas EU": {
    columns: [
      { key: "us", label: "US", unit: "" },
      { key: "uk", label: "UK", unit: "" },
      { key: "foot", label: "Pie", unit: "cm" },
    ],
    rows: [
      ["39", "6,5", "5,5", "24,5"],
      ["40", "7", "6", "25,0"],
      ["41", "8", "7", "25,5"],
      ["42", "8,5", "7,5", "26,5"],
      ["43", "9,5", "8,5", "27,5"],
      ["44", "10", "9", "28,0"],
      ["45", "11", "10", "29,0"],
      ["46", "12", "11", "29,5"],
    ].map(([size, us, uk, foot]) => ({
      size,
      available: true,
      values: { us, uk, foot },
    })),
    note: "Talla europea. Mide el pie de talón a dedo más largo, de pie y por la tarde.",
  },
  "Sólo EU": {
    columns: [{ key: "foot", label: "Pie", unit: "cm" }],
    rows: ["39", "40", "41", "42", "43", "44", "45"].map((size) => ({
      size,
      available: true,
      values: { foot: "" },
    })),
    note: "Talla europea.",
  },
  "S / M / L": {
    columns: [{ key: "range", label: "Tallas que cubre", unit: "" }],
    rows: [
      { size: "S", available: true, values: { range: "38 - 41" } },
      { size: "M", available: true, values: { range: "42 - 44" } },
      { size: "L", available: true, values: { range: "45 - 47" } },
    ],
    note: "",
  },
};

export default function SizeChartEditor({ chart, onChange }: Props) {
  const setColumn = (index: number, patch: Partial<SizeChart["columns"][number]>) => {
    const columns = chart.columns.map((column, i) =>
      i === index ? { ...column, ...patch } : column,
    );
    onChange({ ...chart, columns });
  };

  const addColumn = () => {
    // La clave se deriva del nombre y se hace única para no pisar otra columna.
    const base = slugify(`medida ${chart.columns.length + 1}`) || "medida";
    let key = base;
    let n = 2;
    while (chart.columns.some((column) => column.key === key)) key = `${base}-${n++}`;
    onChange({
      ...chart,
      columns: [...chart.columns, { key, label: "Nueva medida", unit: "cm" }],
    });
  };

  const removeColumn = (index: number) => {
    const removed = chart.columns[index];
    onChange({
      ...chart,
      columns: chart.columns.filter((_, i) => i !== index),
      rows: chart.rows.map((row) => {
        const values = { ...row.values };
        delete values[removed.key];
        return { ...row, values };
      }),
    });
  };

  const setRow = (index: number, patch: Partial<SizeChart["rows"][number]>) => {
    onChange({
      ...chart,
      rows: chart.rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    });
  };

  const setValue = (rowIndex: number, key: string, value: string) => {
    onChange({
      ...chart,
      rows: chart.rows.map((row, i) =>
        i === rowIndex ? { ...row, values: { ...row.values, [key]: value } } : row,
      ),
    });
  };

  const addRow = () => {
    const values = Object.fromEntries(chart.columns.map((column) => [column.key, ""]));
    onChange({ ...chart, rows: [...chart.rows, { size: "", available: true, values }] });
  };

  return (
    <Section
      title="Tallaje"
      description="Cada modelo tiene su propia tabla. Las tallas y sus equivalencias aparecen tal cual en la ficha."
      action={
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onChange(structuredClone(PRESETS[name]))}
              className="label border border-ink/20 px-3 py-2 transition-colors hover:border-ink"
            >
              {name}
            </button>
          ))}
        </div>
      }
    >
      {/* Columnas */}
      <div className="space-y-2.5">
        {chart.columns.map((column, index) => (
          <div
            key={column.key}
            className="grid grid-cols-[1fr_5rem_auto] items-center gap-2 sm:grid-cols-[5rem_1fr_5rem_auto]"
          >
            <span className="label hidden text-stone sm:block">Columna</span>
            <input
              type="text"
              value={column.label}
              onChange={(event) => setColumn(index, { label: event.target.value })}
              placeholder="Pecho"
              className={inputClass}
              aria-label={`Nombre de la columna ${index + 1}`}
            />
            <input
              type="text"
              value={column.unit}
              onChange={(event) => setColumn(index, { unit: event.target.value })}
              placeholder="cm"
              className={inputClass}
              aria-label={`Unidad de la columna ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeColumn(index)}
              className="label border border-ink/20 px-3 py-3 text-ember transition-colors hover:border-ember"
              aria-label={`Quitar la columna ${column.label}`}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addColumn}
          className="label border border-dashed border-ink/30 px-4 py-3 transition-colors hover:border-ink"
        >
          + Añadir columna
        </button>
      </div>

      {/* Filas */}
      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="bg-sand/60">
              <th scope="col" className="label px-3 py-2.5 text-left font-medium">Talla</th>
              {chart.columns.map((column) => (
                <th key={column.key} scope="col" className="label px-3 py-2.5 text-left font-medium">
                  {column.label || "—"}
                </th>
              ))}
              <th scope="col" className="label px-3 py-2.5 text-left font-medium">Hay</th>
              <th scope="col" className="sr-only">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-ink/10">
                <td className="p-1.5">
                  <input
                    type="text"
                    value={row.size}
                    onChange={(event) => setRow(rowIndex, { size: event.target.value })}
                    placeholder="M"
                    className="w-20 border border-ink/20 bg-bone px-2.5 py-2 focus:border-ink focus:outline-none"
                    aria-label={`Nombre de la talla ${rowIndex + 1}`}
                  />
                </td>
                {chart.columns.map((column) => (
                  <td key={column.key} className="p-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.values[column.key] ?? ""}
                      onChange={(event) => setValue(rowIndex, column.key, event.target.value)}
                      placeholder="—"
                      className="w-full min-w-20 border border-ink/20 bg-bone px-2.5 py-2 tabular-nums focus:border-ink focus:outline-none"
                      aria-label={`${column.label} de la talla ${row.size || rowIndex + 1}`}
                    />
                  </td>
                ))}
                <td className="p-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={row.available}
                    onChange={(event) => setRow(rowIndex, { available: event.target.checked })}
                    className="size-4 accent-ink"
                    aria-label={`¿Queda stock de la talla ${row.size || rowIndex + 1}?`}
                  />
                </td>
                <td className="p-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...chart, rows: chart.rows.filter((_, i) => i !== rowIndex) })
                    }
                    className="label px-2 py-2 text-ember"
                    aria-label={`Quitar la talla ${row.size || rowIndex + 1}`}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="label mt-3 border border-dashed border-ink/30 px-4 py-3 transition-colors hover:border-ink"
      >
        + Añadir talla
      </button>

      <div className="mt-6">
        <label htmlFor="nota-tallas" className="label block text-stone">
          Nota bajo la tabla
        </label>
        <input
          id="nota-tallas"
          type="text"
          value={chart.note}
          onChange={(event) => onChange({ ...chart, note: event.target.value })}
          placeholder="Talla europea. Mide el pie de talón a dedo más largo."
          className={`${inputClass} mt-2`}
        />
      </div>
    </Section>
  );
}
