/* Front-end demo data. No backend exists yet — everything the UI shows comes from here. */

export type SystemStatus = "online" | "syncing" | "offline";

export interface ConnectedSystem {
  id: string;
  name: string;
  kind: string;
  status: SystemStatus;
  toolCount: number;
  tools: Tool[];
  latencyMs?: number;
}

export interface Tool {
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  description: string;
  permission: "auto" | "approval";
}

export const SYSTEMS: ConnectedSystem[] = [
  {
    id: "stripe",
    name: "Stripe",
    kind: "Payments",
    status: "online",
    toolCount: 4,
    tools: [
      { name: "get_payments", method: "GET", endpoint: "/v1/payments", description: "List payments with status filters", permission: "auto" },
      { name: "refund_payment", method: "POST", endpoint: "/v1/refunds", description: "Issue a refund for a charge", permission: "approval" },
      { name: "get_invoices", method: "GET", endpoint: "/v1/invoices", description: "Retrieve invoices for a customer", permission: "auto" },
      { name: "create_invoice", method: "POST", endpoint: "/v1/invoices", description: "Generate a new invoice", permission: "approval" },
    ],
  },
  {
    id: "shopify",
    name: "Shopify",
    kind: "Commerce",
    status: "online",
    toolCount: 4,
    tools: [
      { name: "get_orders", method: "GET", endpoint: "/admin/orders.json", description: "List orders with status filters", permission: "auto" },
      { name: "update_inventory", method: "PUT", endpoint: "/admin/inventory_levels.json", description: "Adjust stock levels", permission: "approval" },
      { name: "get_products", method: "GET", endpoint: "/admin/products.json", description: "List catalog products", permission: "auto" },
      { name: "create_return", method: "POST", endpoint: "/admin/returns.json", description: "Open a return for an order", permission: "approval" },
    ],
  },
  {
    id: "zendesk",
    name: "Zendesk",
    kind: "Support",
    status: "syncing",
    toolCount: 3,
    tools: [
      { name: "get_tickets", method: "GET", endpoint: "/api/v2/tickets", description: "List open support tickets", permission: "auto" },
      { name: "reply_ticket", method: "POST", endpoint: "/api/v2/tickets/{id}/replies", description: "Send a reply on a ticket", permission: "approval" },
      { name: "close_ticket", method: "PUT", endpoint: "/api/v2/tickets/{id}", description: "Resolve and close a ticket", permission: "approval" },
    ],
  },
];

export interface ExecutionStep {
  tool: string;
  system: string;
  detail: string;
  durationMs: number;
  status: "done" | "running" | "queued";
}

/** Scripted execution used by the app view demo and landing hero. */
export const DEMO_EXECUTION: { intent: string; steps: ExecutionStep[]; summary: string } = {
  intent: "Refund every failed payment from yesterday and email the customers",
  steps: [
    { tool: "get_payments", system: "Stripe", detail: "status=failed · window=24h → 12 results", durationMs: 1200, status: "done" },
    { tool: "get_orders", system: "Shopify", detail: "matched 12 payments to orders", durationMs: 900, status: "done" },
    { tool: "refund_payment", system: "Stripe", detail: "12 refunds · $1,847.20 total", durationMs: 2400, status: "done" },
    { tool: "reply_ticket", system: "Zendesk", detail: "12 confirmation emails drafted", durationMs: 800, status: "done" },
  ],
  summary: "12 failed payments refunded ($1,847.20). Confirmation emails sent. Full audit trail recorded.",
};

/* Liveness + activity for the Monitor tab, and mock swagger diffs for the
   interactive "Update APIs" flow. */

export const LIVENESS: Record<string, { latencyMs: number; uptime: number; lastIncident: string }> = {
  stripe: { latencyMs: 84, uptime: 99.98, lastIncident: "none in 90 days" },
  shopify: { latencyMs: 132, uptime: 99.91, lastIncident: "23 days ago · degraded 4m" },
  zendesk: { latencyMs: 210, uptime: 99.72, lastIncident: "resyncing since 06:40" },
};

export interface ActivityEntry {
  time: string;
  intent: string;
  tools: number;
  systems: string[];
  operator: string;
  status: "filed" | "approved" | "held";
}

export const ACTIVITY_LOG: ActivityEntry[] = [
  { time: "07:58", intent: "Close all resolved tickets older than 7 days", tools: 2, systems: ["Zendesk"], operator: "a.chen", status: "filed" },
  { time: "07:41", intent: "Refund every failed payment from yesterday", tools: 4, systems: ["Stripe", "Shopify", "Zendesk"], operator: "u.tariq", status: "approved" },
  { time: "07:12", intent: "Which products run out of stock this week?", tools: 2, systems: ["Shopify"], operator: "u.tariq", status: "filed" },
  { time: "06:55", intent: "Generate March invoices for enterprise accounts", tools: 3, systems: ["Stripe"], operator: "a.chen", status: "held" },
  { time: "06:31", intent: "Reply to all shipping-delay tickets with the template", tools: 2, systems: ["Zendesk", "Shopify"], operator: "u.tariq", status: "approved" },
];

export const API_UPDATE_DIFFS: Record<string, { added: string[]; changed: string[] }> = {
  stripe: {
    added: ["POST /v1/disputes → create_dispute()", "GET /v1/payouts → get_payouts()"],
    changed: ["refund_payment(): new optional `reason` param"],
  },
  shopify: {
    added: ["POST /admin/discounts.json → create_discount()"],
    changed: [],
  },
  zendesk: {
    added: [],
    changed: ["reply_ticket(): attachment support added"],
  },
};

export const BOOT_CHECKS = [
  "vault seal integrity",
  "tool registry checksum",
  "stripe coupling · ping",
  "shopify coupling · ping",
  "zendesk coupling · ping",
  "audit tape writable",
];

export const SAMPLE_INTENTS = [
  "Refund every failed payment from yesterday",
  "Which products will run out of stock this week?",
  "Close all resolved tickets older than 7 days",
  "Generate March invoices for enterprise accounts",
];
