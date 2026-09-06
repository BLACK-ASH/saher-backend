// Shared shape for populated bill docs passed to export renderers.
// user is lean-populated to a subset of User fields; schema typing keeps it ObjectId.
import type { HydratedDocument } from 'mongoose';
import type { BillType } from '../../database/bill.model.js';

export type BillUserSubset = {
  displayName?: string | null;
  email?: string | null;
};

export type BillMediaSubset = {
  src: string;
  alt: string;
};

export type BillSettlementSubset = {
  status: string;
  mode?: string;
  settleDate?: Date | null;
};

export type BillDocumentT = Omit<HydratedDocument<BillType>, 'user' | 'images'> & {
  user: BillUserSubset;
  images?: BillMediaSubset[];
  settlement?: BillSettlementSubset | null;
};
