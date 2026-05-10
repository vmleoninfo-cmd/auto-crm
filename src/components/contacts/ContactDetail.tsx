"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ContactForm } from "./ContactForm";
import { ActivityForm } from "@/components/activities/ActivityForm";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  FileText,
  Clock,
  Users,
  Pencil,
  Trash2,
  Plus,
  MessageCircle,
  Copy,
  Check,
} from "lucide-react";
import { formatCurrency, formatDate, formatRelativeDate, cleanPhoneForWhatsApp } from "@/lib/constants";
import { ACTIVITY_TYPE_CONFIG, SOURCE_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import type { Temperature, ActivityType, LeadSource } from "@/types";

const activityIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  follow_up: Clock,
};

interface ContactDetailClientProps {
  contact: {
    id: string; name: string; email: string | null; phone: string | null;
    company: string | null; source: string; temperature: string; score: number;
    notes: string | null; createdAt: number | Date;
    estadoRelacion?: string | null; valorGenerado?: number | null;
    totalCompras?: number | null; utmCampaign?: string | null;
    ultimaInteraccionAt?: number | Date | null;
  };
  deals: Array<{
    id: string; title: string; value: number; probability: number;
    stageName: string | null; stageColor: string | null; createdAt: number | Date;
  }>;
  activities: Array<{
    id: string; type: string; description: string;
    scheduledAt: number | Date | null; completedAt: number | Date | null; createdAt: number | Date;
  }>;
  purchases: Array<{
    id: string; producto: string; monto: number; plataforma: string;
    estadoPago: string; createdAt: number | Date;
  }>;
  automations: Array<{
    id: string; tipo: string; canal: string; estado: string; createdAt: number | Date;
  }>;
}

function computeHaydeScores(contact: ContactDetailClientProps["contact"]) {
  const fuenteScore: Record<string, number> = {
    referido: 4.5, gumroad: 4.0, evento: 3.8, webhook: 3.5,
    redes_sociales: 3.2, formulario: 3.0, website: 2.8,
    whatsapp: 3.0, email: 2.8, llamada_fria: 2.5, import: 2.5, otro: 2.5,
  };
  const estadoScore: Record<string, number> = {
    inactivo: 2.0, lead_frio: 2.5, lead_nuevo: 3.0, lead_tibio: 3.3,
    lead_caliente: 3.7, lead_calificado_asesoria_1a1: 4.0,
    cliente_guia: 4.2, candidato_comunidad: 4.3,
    cliente_recurrente: 4.5, cliente_premium: 4.8,
  };
  const base = Math.min(5, +(((fuenteScore[contact.source] || 2.5) * 0.6 + (contact.score / 100) * 2)).toFixed(1));
  const estructural = estadoScore[contact.estadoRelacion || "lead_nuevo"] || 3.0;
  const capBase = (contact.totalCompras || 0) > 0 ? 3.8 : ((contact.valorGenerado || 0) > 0 ? 3.5 : 3.3);
  const capacidad = Math.min(5, +(capBase + (contact.totalCompras || 0) * 0.2).toFixed(1));
  return { base, estructural, capacidad };
}

function activacionLabel(capacidad: number) {
  if (capacidad <= 3.2) return { label: "Activación editorial", color: "text-blue-700 bg-blue-50 border-blue-200" };
  if (capacidad <= 3.7) return { label: "Requiere conversación", color: "text-yellow-700 bg-yellow-50 border-yellow-200" };
  if (capacidad <= 4.2) return { label: "Apto Fase 1 — $450K CLP", color: "text-green-700 bg-green-50 border-green-200" };
  if (capacidad <= 4.6) return { label: "Apto Sistema Completo — $750K CLP", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  return { label: "Apto Expansión — $1M+ CLP", color: "text-purple-700 bg-purple-50 border-purple-200" };
}

export function ContactDetailClient({
  contact, deals, activities, purchases, automations,
}: ContactDetailClientProps) {
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success("Copiado");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Error al copiar");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Estas seguro de eliminar este contacto? Esta accion no se puede deshacer.")) {
      return;
    }

    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Contacto eliminado");
      router.push("/contacts");
    } catch {
      toast.error("Error al eliminar el contacto");
    }
  };

  const handleCompleteActivity = async (activityId: string) => {
    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Error");
      toast.success("Actividad completada");
      router.refresh();
    } catch {
      toast.error("Error al completar la actividad");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/contacts")}
          className="cursor-pointer"
          aria-label="Volver a contactos"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{contact.name}</h1>
            <StatusBadge temperature={contact.temperature as Temperature} />
          </div>
          <p className="text-muted-foreground">
            Score: {contact.score}/100 &middot;{" "}
            {SOURCE_LABELS[contact.source as LeadSource] || contact.source}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditForm(true)}
            className="cursor-pointer"
          >
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="cursor-pointer text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contact.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${contact.email}`} className="text-primary hover:underline flex-1 truncate">
                  {contact.email}
                </a>
                <button
                  onClick={() => handleCopy(contact.email!, "email")}
                  className="p-1 rounded hover:bg-muted cursor-pointer"
                  title="Copiar email"
                >
                  {copiedField === "email" ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1">{contact.phone}</span>
                <div className="flex items-center gap-1">
                  <a
                    href={`https://wa.me/${cleanPhoneForWhatsApp(contact.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-green-50 cursor-pointer"
                    title="Abrir WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                  </a>
                  <a
                    href={`tel:${contact.phone}`}
                    className="p-1 rounded hover:bg-blue-50 cursor-pointer"
                    title="Llamar"
                  >
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                  </a>
                  <button
                    onClick={() => handleCopy(contact.phone!, "phone")}
                    className="p-1 rounded hover:bg-muted cursor-pointer"
                    title="Copiar telefono"
                  >
                    {copiedField === "phone" ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{contact.company}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Creado {formatDate(contact.createdAt)}</span>
            </div>
            {contact.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">{contact.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Deals ({deals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin deals</p>
            ) : (
              <div className="space-y-3">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/deals/${deal.id}`)}
                  >
                    <p className="text-sm font-medium">{deal.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(deal.value)}
                      </span>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: deal.stageColor || undefined,
                          color: deal.stageColor || undefined,
                        }}
                      >
                        {deal.stageName}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity timeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Actividades ({activities.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActivityForm(true)}
              className="cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1" />
              Registrar
            </Button>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin actividades. Registra una llamada, email o nota.
              </p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const Icon = activityIcons[activity.type] || FileText;
                  const config = ACTIVITY_TYPE_CONFIG[activity.type as ActivityType];
                  const isPending = !activity.completedAt && activity.scheduledAt;
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="rounded-full bg-muted p-2 h-fit shrink-0">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {config?.label || activity.type}
                          </Badge>
                          {isPending && (
                            <Badge
                              variant="outline"
                              className="text-xs text-orange-600 border-orange-600 cursor-pointer"
                              onClick={() => handleCompleteActivity(activity.id)}
                            >
                              Completar
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Panel HAYDE */}
      {(() => {
        const scores = computeHaydeScores(contact);
        const activacion = activacionLabel(scores.capacidad);
        return (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Diagnóstico HAYDE</p>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${activacion.color}`}>{activacion.label}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "BASE", score: scores.base, desc: "Claridad de oferta e identidad", threshold: [2.0, 3.0] },
                { label: "ESTRUCTURAL", score: scores.estructural, desc: "Capacidad operativa y proceso", threshold: [3.0, 3.7] },
                { label: "CAPACIDAD", score: scores.capacidad, desc: "Potencial de inversión HT", threshold: [3.2, 3.8] },
              ].map(({ label, score, desc, threshold }) => {
                const color = score < threshold[0] ? "text-red-600" : score < threshold[1] ? "text-yellow-600" : "text-green-600";
                const bg = score < threshold[0] ? "bg-red-50" : score < threshold[1] ? "bg-yellow-50" : "bg-green-50";
                return (
                  <div key={label} className={`rounded-lg p-3 ${bg} space-y-1`}>
                    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{score.toFixed(1)}</p>
                    <div className="h-1.5 rounded-full bg-white/60">
                      <div className={`h-1.5 rounded-full ${score < threshold[0] ? "bg-red-400" : score < threshold[1] ? "bg-yellow-400" : "bg-green-500"}`} style={{ width: `${(score / 5) * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                );
              })}
            </div>
            {contact.utmCampaign && (
              <p className="text-xs text-muted-foreground">UTM: <span className="font-mono">{contact.utmCampaign}</span></p>
            )}
          </div>
        );
      })()}

      {/* Timeline enriquecida */}
      {(purchases.length > 0 || automations.length > 0) && (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-semibold">Historia relacional</p>
          <div className="space-y-3">
            {[
              ...purchases.map((p) => ({ date: p.createdAt, tipo: "compra" as const, titulo: `Compra: ${p.producto}`, sub: `$${Math.round(p.monto / 100).toLocaleString("es-CL")} CLP · ${p.plataforma}`, color: "text-green-600 bg-green-50" })),
              ...automations.map((a) => ({ date: a.createdAt, tipo: "auto" as const, titulo: `Automatización: ${a.tipo}`, sub: `${a.canal} · ${a.estado}`, color: "text-blue-600 bg-blue-50" })),
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${item.color}`}>{item.tipo}</span>
                  <div>
                    <p className="text-sm font-medium">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground">{item.sub} · {formatRelativeDate(item.date)}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <ContactForm
        open={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          router.refresh();
        }}
        initialData={{
          id: contact.id,
          name: contact.name,
          email: contact.email || "",
          phone: contact.phone || "",
          company: contact.company || "",
          source: contact.source,
          temperature: contact.temperature as "cold" | "warm" | "hot",
          notes: contact.notes || "",
        }}
      />

      <ActivityForm
        open={showActivityForm}
        onClose={() => {
          setShowActivityForm(false);
          router.refresh();
        }}
        preselectedContactId={contact.id}
      />
    </div>
  );
}
