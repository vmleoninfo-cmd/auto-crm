"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Megaphone, Plus, X } from "lucide-react";
import { formatDate } from "@/lib/constants";

function formatCLP(centavos: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(centavos / 100);
}

interface ContentPieza {
  id: string;
  titulo: string;
  plataforma: string;
  tipo: string;
  estado: string;
  utmCampaign: string | null;
  publicadoAt: number | Date | null;
  createdAt: number | Date;
}

interface AtribucionPieza {
  contentId: string;
  titulo: string;
  plataforma: string;
  leadsAtribuidos: number;
  comprasAtribuidas: number;
  ingresosCentavos: number;
  eventos: { clicks: number; views: number };
}

const ESTADO_COLORS: Record<string, string> = {
  publicado: "text-green-700 bg-green-50 border-green-200",
  borrador: "text-slate-600 bg-slate-50 border-slate-200",
  archivado: "text-gray-500 bg-gray-50 border-gray-200",
};

const PLATAFORMA_COLORS: Record<string, string> = {
  instagram: "bg-pink-100 text-pink-800",
  tiktok: "bg-black text-white",
  pinterest: "bg-red-100 text-red-800",
  web: "bg-blue-100 text-blue-800",
  email: "bg-purple-100 text-purple-800",
  gumroad: "bg-orange-100 text-orange-800",
};

const FORM_INITIAL = { titulo: "", plataforma: "instagram", tipo: "post", utmCampaign: "", estado: "borrador" };

export default function ContenidoPage() {
  const [piezas, setPiezas] = useState<ContentPieza[]>([]);
  const [atribucion, setAtribucion] = useState<AtribucionPieza[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<"piezas" | "atribucion">("piezas");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    Promise.all([
      fetch("/api/content").then((r) => r.json()),
      fetch("/api/content/attribution").then((r) => r.json()),
    ]).then(([contentData, atribData]) => {
      setPiezas(contentData.data ?? []);
      setAtribucion(atribData.data ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { cargar(); }, []);

  const guardarPieza = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm(FORM_INITIAL);
    cargar();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing & Contenido</h1>
          <p className="text-muted-foreground">Piezas de contenido y su atribución a leads y ventas</p>
        </div>
        <Button className="cursor-pointer" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva pieza
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg border shadow-lg w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nueva pieza de contenido</h2>
              <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input placeholder="ej. Post sobre identidad de marca" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Plataforma</label>
                  <select className="mt-1 w-full text-sm border rounded-md px-2 py-2 bg-background" value={form.plataforma} onChange={(e) => setForm({ ...form, plataforma: e.target.value })}>
                    {["instagram","tiktok","pinterest","web","email","gumroad"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <select className="mt-1 w-full text-sm border rounded-md px-2 py-2 bg-background" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    {["post","reel","story","email","articulo","video","carrusel"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">UTM Campaign</label>
                <Input placeholder="ej. identidad-abril-2026" value={form.utmCampaign} onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <select className="mt-1 w-full text-sm border rounded-md px-2 py-2 bg-background" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                  <option value="borrador">Borrador</option>
                  <option value="publicado">Publicado</option>
                  <option value="archivado">Archivado</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="cursor-pointer" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button className="cursor-pointer" onClick={guardarPieza} disabled={saving || !form.titulo.trim()}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant={vista === "piezas" ? "default" : "outline"} size="sm" className="cursor-pointer" onClick={() => setVista("piezas")}>
          Piezas de contenido
        </Button>
        <Button variant={vista === "atribucion" ? "default" : "outline"} size="sm" className="cursor-pointer" onClick={() => setVista("atribucion")}>
          Atribución
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : vista === "piezas" ? (
        piezas.length === 0 ? (
          <EmptyState icon={Megaphone} title="Sin piezas de contenido" description="Registrá cada pieza de contenido con su UTM para medir atribución." />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>UTM Campaign</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Publicado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {piezas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.titulo}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATAFORMA_COLORS[p.plataforma] || "bg-slate-100 text-slate-700"}`}>
                        {p.plataforma}
                      </span>
                    </TableCell>
                    <TableCell><Badge variant="outline">{p.tipo}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{p.utmCampaign || "-"}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ESTADO_COLORS[p.estado] || ""}`}>{p.estado}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(p.publicadoAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        atribucion.length === 0 ? (
          <EmptyState icon={Megaphone} title="Sin datos de atribución" description="La atribución se calcula cuando los leads tienen UTM que coinciden con piezas registradas." />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pieza</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Compras</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Views / Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atribucion.map((a) => (
                  <TableRow key={a.contentId}>
                    <TableCell className="font-medium">{a.titulo}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATAFORMA_COLORS[a.plataforma] || "bg-slate-100 text-slate-700"}`}>
                        {a.plataforma}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">{a.leadsAtribuidos}</TableCell>
                    <TableCell className="font-semibold">{a.comprasAtribuidas}</TableCell>
                    <TableCell className="font-semibold text-green-700">{formatCLP(a.ingresosCentavos)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.eventos.views} / {a.eventos.clicks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      )}
    </div>
  );
}
