import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { CollapsibleCard } from "@/components/forms/CollapsibleCard";
import { ContactsEditor } from "@/components/forms/ContactsEditor";
import { CustomFieldsEditor } from "@/components/forms/CustomFieldsEditor";
import { FormSection } from "@/components/forms/FormSection";
import { useErrorBanner } from "@/context/ErrorBannerContext";
import { clientDisplayName } from "@/lib/client-display";
import { deleteClient, emptyProperty, getClientBundle, saveClientBundle } from "@/lib/clients";
import type { ClientContactInput, ClientPropertyInput, CommunicationSettings, CustomField } from "@/types/entities";

const TITLES = ["", "Mr", "Mrs", "Ms", "Miss", "Dr", "Prof"];
const COUNTRIES = ["New Zealand", "Australia", "United Kingdom", "United States"];

type ClientForm = {
  title: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
  email: string;
  lead_source: string;
  communication_settings: CommunicationSettings;
  custom_fields: CustomField[];
  billing_same_as_property: boolean;
  status: "lead" | "active" | "inactive";
  notes: string;
};

const defaultClient = (): ClientForm => ({
  title: "",
  first_name: "",
  last_name: "",
  company_name: "",
  phone: "",
  email: "",
  lead_source: "",
  communication_settings: { email: true, sms: true },
  custom_fields: [],
  billing_same_as_property: true,
  status: "lead",
  notes: "",
});

export function ClientFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showError } = useErrorBanner();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState<ClientForm>(defaultClient);
  const [properties, setProperties] = useState<ClientPropertyInput[]>([emptyProperty()]);
  const [contacts, setContacts] = useState<ClientContactInput[]>([]);
  const [propertyContacts, setPropertyContacts] = useState<ClientContactInput[]>([]);
  const [commOpen, setCommOpen] = useState(false);
  const [clientDetailsOpen, setClientDetailsOpen] = useState(true);
  const [clientContactsOpen, setClientContactsOpen] = useState(true);
  const [propertyDetailsOpen, setPropertyDetailsOpen] = useState(true);
  const [propertyContactsOpen, setPropertyContactsOpen] = useState(true);

  useEffect(() => {
    if (isNew) return;
    getClientBundle(id!)
      .then((bundle) => {
        if (!bundle) throw new Error("Client not found");
        const c = bundle.client;
        setClient({
          title: c.title ?? "",
          first_name: c.first_name ?? "",
          last_name: c.last_name ?? "",
          company_name: c.company_name ?? "",
          phone: c.phone,
          email: c.email,
          lead_source: c.lead_source ?? "",
          communication_settings: c.communication_settings ?? { email: true, sms: true },
          custom_fields: c.custom_fields ?? [],
          billing_same_as_property: c.billing_same_as_property ?? true,
          status: c.status,
          notes: c.notes,
        });
        setProperties(
          bundle.properties.length > 0
            ? bundle.properties.map(({ id: _id, user_id: _u, client_id: _c, created_at: _ca, updated_at: _ua, ...rest }) => rest)
            : [emptyProperty()],
        );
        const clientLevel = bundle.contacts.filter((x) => !x.property_id);
        const propLevel = bundle.contacts.filter((x) => x.property_id);
        setContacts(clientLevel.map(({ id: _id, user_id: _u, client_id: _c, created_at: _ca, updated_at: _ua, ...rest }) => rest));
        setPropertyContacts(propLevel.map(({ id: _id, user_id: _u, client_id: _c, created_at: _ca, updated_at: _ua, ...rest }) => rest));
      })
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew, showError]);

  function updateProperty(i: number, patch: Partial<ClientPropertyInput>) {
    setProperties((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function addProperty() {
    setProperties((prev) => [...prev, emptyProperty({ is_primary: false, is_billing: false })]);
  }

  async function persist(createAnother: boolean) {
    setSaving(true);
    try {
      const props = properties.map((p, i) => ({
        ...p,
        is_primary: i === 0 ? true : p.is_primary,
        is_billing: client.billing_same_as_property ? i === 0 : p.is_billing,
      }));
      const allContacts = [...contacts, ...propertyContacts];
      const saved = await saveClientBundle({
        client,
        properties: props,
        contacts: allContacts,
        existingId: isNew ? undefined : id,
      });
      if (createAnother) {
        setClient(defaultClient());
        setProperties([emptyProperty()]);
        setContacts([]);
        setPropertyContacts([]);
        navigate("/clients/new", { replace: true });
      } else {
        navigate(isNew ? `/clients/${saved.id}` : "/clients");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      showError(msg.includes("mp_client_") ? `${msg} — run migration 002 in Supabase first.` : msg);
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await persist(false);
  }

  async function onDelete() {
    if (!confirm("Delete this client?")) return;
    try {
      await deleteClient(id!);
      navigate("/clients");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  const displayPreview = clientDisplayName({ ...client, name: "" });

  return (
    <div className="pb-24">
      <PageHeader
        title={isNew ? "New client" : displayPreview || "Edit client"}
        backTo="/clients"
        actions={
          !isNew && (
            <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
              Delete client
            </button>
          )
        }
      />

      <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white px-6 lg:px-10">
        <FormSection
          title="Primary contact details"
          description="Provide the main point of contact to ensure smooth communication and reliable client records."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Title</span>
              <select value={client.title} onChange={(e) => setClient({ ...client, title: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="">No title</option>
                {TITLES.filter(Boolean).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">First name</span>
              <input value={client.first_name} onChange={(e) => setClient({ ...client, first_name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Last name</span>
              <input value={client.last_name} onChange={(e) => setClient({ ...client, last_name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold text-slate-700">Company name</span>
            <input value={client.company_name} onChange={(e) => setClient({ ...client, company_name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>

          <div>
            <p className="mb-3 text-sm font-bold text-[var(--mp-navy)]">Communication</p>
            <label className="mb-3 block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Phone number</span>
              <input value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="mb-2 block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Email</span>
              <input type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <button type="button" onClick={() => setCommOpen(!commOpen)} className="text-sm font-semibold text-[var(--mp-orange)] underline">
              Communication settings
            </button>
            {commOpen && (
              <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={client.communication_settings.email} onChange={(e) => setClient({ ...client, communication_settings: { ...client.communication_settings, email: e.target.checked } })} />
                  Email notifications
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={client.communication_settings.sms} onChange={(e) => setClient({ ...client, communication_settings: { ...client.communication_settings, sms: e.target.checked } })} />
                  SMS notifications
                </label>
              </div>
            )}
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-[var(--mp-navy)]">Lead information</p>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Lead source</span>
              <input value={client.lead_source} onChange={(e) => setClient({ ...client, lead_source: e.target.value })} placeholder="e.g. Google, Referral, Sign" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>

          <CollapsibleCard title="Additional client details" open={clientDetailsOpen} onToggle={() => setClientDetailsOpen(!clientDetailsOpen)}>
            <CustomFieldsEditor fields={client.custom_fields} onChange={(custom_fields) => setClient({ ...client, custom_fields })} />
          </CollapsibleCard>

          <CollapsibleCard title="Additional contacts" open={clientContactsOpen} onToggle={() => setClientContactsOpen(!clientContactsOpen)}>
            <ContactsEditor
              contacts={contacts}
              onChange={setContacts}
              hint="For contacts with access to all properties, e.g. spouse or family for residential, or property managers for commercial."
            />
          </CollapsibleCard>
        </FormSection>

        <FormSection
          title="Property address"
          description="Enter the primary service address, billing address, or any additional locations where services may take place."
        >
          {properties.map((prop, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-slate-200 p-4">
              {properties.length > 1 && <p className="text-xs font-bold uppercase text-slate-400">Address {i + 1}</p>}
              <input placeholder="Street 1" value={prop.street_1} onChange={(e) => updateProperty(i, { street_1: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <input placeholder="Street 2" value={prop.street_2} onChange={(e) => updateProperty(i, { street_2: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input placeholder="City" value={prop.city} onChange={(e) => updateProperty(i, { city: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input placeholder="Region" value={prop.region} onChange={(e) => updateProperty(i, { region: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input placeholder="Postal code" value={prop.postal_code} onChange={(e) => updateProperty(i, { postal_code: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <select value={prop.country} onChange={(e) => updateProperty(i, { country: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <select value={prop.tax_rate} onChange={(e) => updateProperty(i, { tax_rate: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500">
                <option value="">No tax rate created</option>
              </select>
            </div>
          ))}

          <button type="button" onClick={addProperty} className="rounded-lg border border-[var(--mp-orange)] px-4 py-2 text-sm font-semibold text-[var(--mp-orange)]">
            Add Another Address
          </button>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={client.billing_same_as_property}
              onChange={(e) => setClient({ ...client, billing_same_as_property: e.target.checked })}
              className="rounded border-slate-300 text-[var(--mp-orange)]"
            />
            Billing address is the same as property address
          </label>

          <CollapsibleCard title="Property details" open={propertyDetailsOpen} onToggle={() => setPropertyDetailsOpen(!propertyDetailsOpen)}>
            <CustomFieldsEditor
              fields={properties[0]?.custom_fields ?? []}
              onChange={(custom_fields) => updateProperty(0, { custom_fields })}
            />
          </CollapsibleCard>

          <CollapsibleCard title="Property contacts" open={propertyContactsOpen} onToggle={() => setPropertyContactsOpen(!propertyContactsOpen)}>
            <ContactsEditor
              contacts={propertyContacts}
              onChange={setPropertyContacts}
              hint="For contacts with access limited to this property."
            />
          </CollapsibleCard>
        </FormSection>

        <div className="border-t border-slate-200 py-6">
          <label className="mb-4 block text-sm font-semibold">
            Status
            <select value={client.status} onChange={(e) => setClient({ ...client, status: e.target.value as ClientForm["status"] })} className="mt-1 w-full max-w-xs rounded-lg border px-3 py-2">
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Internal notes
            <textarea value={client.notes} onChange={(e) => setClient({ ...client, notes: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white px-4 py-3 md:left-56">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <Link to="/clients" className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold">
            Cancel
          </Link>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => persist(true)}
              className="rounded-lg border border-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-[var(--mp-orange)] disabled:opacity-60"
            >
              Save and Create Another
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => persist(false)}
              className="rounded-lg bg-[var(--mp-orange)] px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save client"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
