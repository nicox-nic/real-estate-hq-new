"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";
import type { ConversationMessage, MessageTone } from "@/lib/types";
import { seedConversationMessages } from "@/data/conversationMessages";

/**
 * Client-side conversation store.
 *
 * The seed messages live in /data and are immutable. This store layers
 * client-mutable "sent" messages on top so the agent can compose and send
 * during the demo and see the message land in the thread without a backend.
 *
 * Architecture:
 *   - A single module-scoped Map keyed by leadId → ConversationMessage[].
 *   - Snapshot pattern (useSyncExternalStore) for React 18 concurrent safety.
 *   - sendMessage() mutates the map and notifies subscribers.
 *
 * Backend wiring later: replace the in-memory map with API calls; the
 * function signatures stay identical, so call sites don't move.
 */

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const sentMessagesByLead = new Map<string, ConversationMessage[]>();
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

/**
 * Returns the merged thread for a lead, oldest-first.
 * Seed messages always come before sent messages, ordered by sentAt.
 */
function getThread(leadId: string): ConversationMessage[] {
  const seed = seedConversationMessages.filter((m) => m.leadId === leadId);
  const sent = sentMessagesByLead.get(leadId) ?? [];
  return [...seed, ...sent].sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

// snapshots: useSyncExternalStore requires referential stability across
// non-mutating reads. We cache the last computed thread per leadId.
const cachedSnapshots = new Map<string, ConversationMessage[]>();

function getSnapshot(leadId: string): ConversationMessage[] {
  const sentArr = sentMessagesByLead.get(leadId) ?? [];
  const cached = cachedSnapshots.get(leadId);
  if (cached && cached.length - seedCountFor(leadId) === sentArr.length) {
    return cached;
  }
  const fresh = getThread(leadId);
  cachedSnapshots.set(leadId, fresh);
  return fresh;
}

function seedCountFor(leadId: string): number {
  return seedConversationMessages.filter((m) => m.leadId === leadId).length;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SendMessageInput {
  leadId: string;
  body: string;
  tone?: MessageTone;
  language?: "English" | "Tagalog" | "Cebuano";
  /** Was this composed from an AI suggestion? */
  fromAISuggestion?: boolean;
  /** File IDs attached to the message. */
  attachmentIds?: string[];
  /** If this message originated from a Share Listing send, the campaign ID. */
  shareCampaignId?: string;
}

/**
 * Send a message: persists into the client store, emits to subscribers.
 * Returns the new ConversationMessage so callers can update UI immediately.
 *
 * Sender is always "agent" for outbound. We model AI-originated sends by
 * tagging the body with `aiOriginated` via the (extended) message — for
 * Session 3B we keep it simple: AI-originated outbound messages still have
 * sender="agent" (it's still the agent's voice), but a separate signal
 * marker (in the UI badge) is computed from whether the agent dismissed
 * the AI panel before sending vs used "Use this".
 *
 * Backend later: replace the in-memory map with an API call. Signature
 * stays identical, so call sites don't move.
 */
export function sendMessage(input: SendMessageInput): ConversationMessage {
  const msg: ConversationMessage = {
    id: `msg-sent-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    leadId: input.leadId,
    sender: "agent",
    body: input.body,
    sentAt: new Date().toISOString(),
    attachmentIds: input.attachmentIds,
    ...(input.tone ? { tone: input.tone } : {}),
    ...(input.language ? { language: input.language } : {}),
    ...(input.shareCampaignId
      ? { shareCampaignId: input.shareCampaignId }
      : {}),
    isDraft: false,
  };

  const existing = sentMessagesByLead.get(input.leadId) ?? [];
  sentMessagesByLead.set(input.leadId, [...existing, msg]);
  cachedSnapshots.delete(input.leadId);
  emit();
  return msg;
}

/**
 * Returns the merged seed + client-sent thread for a lead, oldest-first,
 * as a React state. Subscribes for re-renders when the store changes.
 */
export function useConversationThread(
  leadId: string,
): ConversationMessage[] {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot(leadId),
    // SSR snapshot — only the seed messages, since sent state is client-only.
    () => seedConversationMessages.filter((m) => m.leadId === leadId),
  );
}

/**
 * Returns the most recent INBOUND (buyer) message for a lead, or undefined
 * if none. Used by the AI suggester to choose the rule.
 */
export function useLastBuyerMessage(
  leadId: string,
): ConversationMessage | undefined {
  const thread = useConversationThread(leadId);
  for (let i = thread.length - 1; i >= 0; i--) {
    const m = thread[i];
    if (m && m.sender === "buyer") return m;
  }
  return undefined;
}

/**
 * Test/verify hook: returns the raw count of client-side messages for a lead.
 * Used by verify to assert send mutations.
 */
export function getClientMessageCount(leadId: string): number {
  return sentMessagesByLead.get(leadId)?.length ?? 0;
}

/**
 * Test/verify hook: clears all client-sent messages. NEVER call from UI.
 */
export function _resetForTests() {
  sentMessagesByLead.clear();
  cachedSnapshots.clear();
  emit();
}

// Re-export to satisfy bundler when no other React hook is used.
export const _ENSURE_REACT_IMPORTED = React;

