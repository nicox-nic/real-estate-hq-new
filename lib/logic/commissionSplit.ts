/**
 * Commission Split — pure function.
 *
 * Given a contract price, rate, and three share percentages, produce the
 * split amounts AND prove they reconcile to the total within ±₱1.
 *
 * This is the ONLY place commission math lives. Every aggregation routes
 * through it.
 */

export interface CommissionSplitInputs {
  contractPrice: number;
  commissionRate: number; // 0..1 decimal
  realtyShare: number; // 0..1
  brokerShare: number; // 0..1
  agentShare: number; // 0..1
}

export interface CommissionSplitResult {
  totalAmount: number;
  realtyAmount: number;
  brokerAmount: number;
  agentAmount: number;
  /** Reconciliation residual after rounding. Must be ≤ ₱1 in absolute value. */
  residual: number;
}

export const RECONCILIATION_EPSILON_PHP = 1;

export function splitCommission(
  inputs: CommissionSplitInputs,
): CommissionSplitResult {
  const total = inputs.contractPrice * inputs.commissionRate;
  const realty = total * inputs.realtyShare;
  const broker = total * inputs.brokerShare;
  // Agent takes the residual after the other two are rounded, so the sum
  // always reconciles exactly to the total in displayed (rounded) form.
  const realtyRounded = Math.round(realty);
  const brokerRounded = Math.round(broker);
  const totalRounded = Math.round(total);
  const agentRounded = totalRounded - realtyRounded - brokerRounded;
  return {
    totalAmount: totalRounded,
    realtyAmount: realtyRounded,
    brokerAmount: brokerRounded,
    agentAmount: agentRounded,
    residual: total - (realtyRounded + brokerRounded + agentRounded),
  };
}

export function validateSharesSum(
  realty: number,
  broker: number,
  agent: number,
): boolean {
  const sum = realty + broker + agent;
  return Math.abs(sum - 1) < 0.0001;
}
