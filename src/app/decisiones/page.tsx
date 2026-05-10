"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, RefreshCw, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/constants";

interface Decision {
  id: string;
  tipo: string;
  prioridad: string;
  accion: string;
  estado: string;
  responsable: string;
  entidad: string | null;
  impacto: string | null;
  createdAt: number | Date;
}

interface AnalisisResult {
  resumen: { totalLeads: number; leadsCalientes: number; riesgosCriticos: number; oportunidades: number };
  riesgos: { tipo: string; mensaje: string; accion: string; severidad: string }[];
  oportunidades: { tipo: string; mensaje: string; accion: string }[];
  analisisIA: string;
}

const PRIORIDAD_COLORS: Record<string, string> = {
  critica: "text-red-700 bg-red-50 border-red-300",
  alta: "text-orange-700 bg-orange-50 border-orange-300",
  media: "text-yellow-700 bg-yellow-50 border-yellow-200",
  baja: "text-slate-600 bg-slate-50 border-slate-200",
};

export default function DecisionesPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [analisis, setAnalisis] = useState<AnalisisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analizando, setAnalizando] = useState(false);

  useEffect(() => {
    fetch("/api/decisions")
      .then((r) => r.json())
      .then((d) => { setDecisions(d.data ?? []); setLoading(false); });
  }, []);

  const analizarAhora = async () => {
    setAnalizando(true);
    const res = await fetch("/api/decisions/analyze", { method: "POST" });
    const data = await res.json();
    setAnalisis(data);
    setAnalizando(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Decisión Estratégica</h1>
          <p className="text-muted-foreground">Motor de análisis — riesgos, oportunidades y acciones</p>
        </div>
        <Button onClick={analizarAhora} disabled={analizando} className="cursor-pointer">
          {analizando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Analizar ahora
        </Button>
      </div>

      {analisis && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total leads", value: analisis.resumen.totalLeads },
              { label: "Leads calientes", value: analisis.resumen.leadsCalientes },
              { label: "Riesgos críticos", value: analisis.resumen.riesgosCriticos },
              { label: "Oportunidades", value: analisis.resumen.oportunidades },
            ].map((k) => (
              <div key={k.label} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-2xl font-bold">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Análisis IA */}
          {analisis.analisisIA && (
            <div className="rounded-lg border p-4 bg-blue-50/50 space-y-2">
              <p className="text-sm font-semibold text-blue-800">Análisis IA</p>
              <div className="text-sm text-slate-700 whitespace-pre-wrap prose prose-sm max-w-none">
                {analisis.analisisIA.split("\n").map((line, i) => {
                  if (line.startsWith("### ")) return <p key={i} className="font-semibold mt-2">{line.replace(/^###\s/, "").replace(/\*\*/g, "")}</p>;
                  if (line.startsWith("## ")) return <p key={i} className="font-bold text-blue-900">{line.replace(/^##\s/, "")}</p>;
                  if (line === "---") return <hr key={i} className="border-blue-200 my-1" />;
                  return <p key={i}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
                })}
              </div>
            </div>
          )}

          {/* Riesgos */}
          {analisis.riesgos.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Riesgos detectados</h3>
              {analisis.riesgos.map((r, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${PRIORIDAD_COLORS[r.severidad] || ""}`}>{r.severidad}</span>
                  <div>
                    <p className="text-sm">{r.mensaje}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">→ {r.accion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Oportunidades */}
          {analisis.oportunidades.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Oportunidades</h3>
              {analisis.oportunidades.map((o, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-3 bg-green-50/50">
                  <span className="text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 text-green-700 bg-green-50 border-green-200">oportunidad</span>
                  <div>
                    <p className="text-sm">{o.mensaje}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">→ {o.accion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold mb-3">Historial de decisiones</h2>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : decisions.length === 0 ? (
          <EmptyState icon={Zap} title="Sin decisiones" description='Presiona "Analizar ahora" para generar el primer análisis del pipeline.' />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Decisión</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisions.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{d.tipo}</div>
                      <div className="text-xs text-muted-foreground">{d.accion}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORIDAD_COLORS[d.prioridad] || ""}`}>{d.prioridad}</span>
                    </TableCell>
                    <TableCell><Badge variant="outline">{d.estado}</Badge></TableCell>
                    <TableCell className="text-sm">{d.responsable}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(d.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
