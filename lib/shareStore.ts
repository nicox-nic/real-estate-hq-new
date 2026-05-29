"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";
import type { ShareCampaign, ShareChannel, MessageTone } from "@/lib/types";
import { seedShareCampaigns } from "@/data/shareCampaigns";
import { sendMessage } from "@/lib/conversationStore";

/**
 * Client-side Share Campaign store.
 *
 * Mirrors conversationStore.ts: a module-scoped Map keyed by listingId
 * (or by campaign ID) layered on top of immutable seed data, with
 * useSyncExternalStore subscriptions. The Send action on the Share
 * Listing page creates a ShareCampaign here AND a ConversationMessage
 * in the buyer's thread (via sendMessage).
 *
 * Architectural decision (Session 5A carry-forward):
 *   - ShareCampaign records WHAT was shared, to WHOM, on WHICH channel,
 *     plus engagement metadata (opens, computation requests, etc.)
 *   - ConversationMessage records the buyer-visible message that
 *     appeared in their inbox.
 *   - The two reference each other via ConversationMessage.shareCampaignId.
 *
 * Backend wiring later: the in-memory map swaps to API calls; signatures
 * stay identical.
 */

const sentCampaigns: ShareCampaign[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let cachedSnapshot: ShareCampaign[] = [...seedShareCampaigns];
let cachedLength = -1;

function getSnapshot(): ShareCampaign[] {
  if (cachedLength === sentCampaigns.length) return cachedSnapshot;
  cachedSnapshot = [...seedShareCampaigns, ...sentCampaigns];
  cachedLength = sentCampaigns.length;
  return cachedSnapshot;
}

// ---------------------------------------------------------------------------
// Smart link generation
// ---------------------------------------------------------------------------

/**
 * Generates a stable, mock smart-link URL for a given listing + agent + buyer.
 * Deterministic — same inputs → same URL — so verify can lock the format.
 *
 * Real smart-link token + redirect tracking is Session 5B's territory.
 */
export function smartLinkFor(
  listingId: string,
  agentId: string,
  buyerLeadId?: string,
): string {
  // Slugify the listing ID for the URL.
  const slug = listingId.replace(/^listing-/, "").replace(/[^a-z0-9-]/gi, "-");
  // A short hash for visual interest in the URL.
  const seed = `${listingId}|${agentId}|${buyerLeadId ?? ""}`;
  const token = shortHash(seed);
  return `https://estatehq.ph/l/${slug}-${token}`;
}

function shortHash(s: string): string {
  // Simple deterministic hash (FNV-1a style) — not cryptographic.
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 4-char base36
  return Math.abs(h).toString(36).slice(0, 4);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ShareListingInput {
  listingId: string;
  agentId: string;
  /** The buyer's lead ID — used to thread the message into their conversation. */
  buyerLeadId: string;
  /** The buyer profile ID — stored on the ShareCampaign for cross-reference. */
  buyerProfileId?: string;
  channel: ShareChannel;
  /** The personalized message text the agent is sending. */
  message: string;
  /** File IDs attached to the share. */
  attachedFileIds: string[];
  /** Tone the message was composed in. */
  tone?: MessageTone;
  /** Language the message was composed in. */
  language?: "English" | "Tagalog" | "Cebuano";
}

export interface ShareListingResult {
  campaign: ShareCampaign;
  /** ID of the ConversationMessage created in the buyer's thread. */
  conversationMessageId: string;
}

/**
 * Performs the full Share action:
 *   1. Creates a ShareCampaign with a fresh smart-link URL.
 *   2. Calls sendMessage to drop the message into the buyer's conversation
 *      thread (referencing the new campaign).
 *
 * Returns both records so the UI can confirm and route to Preview / thread.
 * Pure mutation: deterministic given the inputs except for timestamps + IDs.
 */
export function shareListing(input: ShareListingInput): ShareListingResult {
  const campaignId = `share-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const smartLinkUrl = smartLinkFor(
    input.listingId,
    input.agentId,
    input.buyerLeadId,
  );

  const campaign: ShareCampaign = {
    id: campaignId,
    listingId: input.listingId,
    agentId: input.agentId,
    buyerProfileId: input.buyerProfileId,
    channel: input.channel,
    smartLinkUrl,
    message: input.message,
    attachedFileIds: input.attachedFileIds,
    sharedAt: new Date().toISOString(),
    opens: 0,
    brochureClicks: 0,
    computationRequests: 0,
    siteVisitBookings: 0,
    replies: 0,
    reshares: 0,
  };

  sentCampaigns.push(campaign);
  emit();

  // Drop the message into the buyer's conversation thread, referencing
  // the campaign ID for engagement back-traceability.
  const convMsg = sendMessage({
    leadId: input.buyerLeadId,
    body: input.message,
    tone: input.tone,
    language: input.language,
    attachmentIds: input.attachedFileIds,
    shareCampaignId: campaignId,
  });

  return { campaign, conversationMessageId: convMsg.id };
}

/**
 * Returns all campaigns (seed + sent) for a listing.
 */
export function useShareCampaignsForListing(
  listingId: string,
): ShareCampaign[] {
  const all = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => seedShareCampaigns,
  );
  return all.filter((c) => c.listingId === listingId);
}

/**
 * Returns a single campaign by ID (across seed + sent).
 */
export function findCampaign(campaignId: string): ShareCampaign | undefined {
  return (
    seedShareCampaigns.find((c) => c.id === campaignId) ??
    sentCampaigns.find((c) => c.id === campaignId)
  );
}

/**
 * Test/verify hook — count of client-side campaigns sent during the session.
 */
export function getClientShareCount(): number {
  return sentCampaigns.length;
}

/**
 * Test/verify hook — clears all client-side share state.
 */
export function _resetShareStoreForTests() {
  sentCampaigns.length = 0;
  cachedLength = -1;
  cachedSnapshot = [...seedShareCampaigns];
  emit();
}

// Re-export to satisfy bundler when no React hook is used elsewhere.
export const _ENSURE_REACT_IMPORTED = React;
