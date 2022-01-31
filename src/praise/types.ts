import { UserDocument } from '@user/types';
import mongoose from 'mongoose';
import { UserAccountDocument } from 'src/useraccount/types';

export interface QuantificationCreateUpdateInput {
  score: number;
  dismissed: boolean;
  duplicatePraiseId: string;
}

export interface PraiseImportInput {
  createdAt: string;
  giver: UserAccountDocument;
  receiver: UserAccountDocument;
  reason: string;
  sourceId: string;
  sourceName: string;
}

export interface Praise {
  reason: string;
  sourceId: string;
  sourceName: string;
  quantifications: QuantificationDocument[];
  giver: UserAccountDocument;
  receiver: UserAccountDocument;
  createdAt: Date;
  updatedAt: Date;
}

export interface PraiseDocument extends Praise, mongoose.Document {}

export interface Quantification {
  createdAt?: string;
  updatedAt?: string;
  quantifier: UserDocument;
  score?: number;
  dismissed?: boolean;
  duplicatePraise?: PraiseDocument | null;
}

export interface QuantificationDocument
  extends Quantification,
    mongoose.Document {}
