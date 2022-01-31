import { PeriodDocument } from '@period/types';
import mongoose from 'mongoose';
import { mongoosePagination, Pagination } from 'mongoose-paginate-ts';

async function validateEndDate(this: any, endDate: string) {
  // This rule don't apply when no change to endDate has been made
  if (!this.$__.activePaths.states.modify.endDate) return true;

  // Find two last periods
  const twoLastPeriods = await PeriodModel.find(
    {},
    {},
    { limit: 2, sort: { endDate: -1 } }
  );

  // No period exists = this is the first period = allow any date
  if (!twoLastPeriods || twoLastPeriods.length === 0) return true;

  let d1;
  const d2 = new Date(endDate);

  // Save new period = compare to last period
  // Update period = compare to 2nd last period
  if (this.isNew) {
    d1 = twoLastPeriods[0].endDate;
  } else {
    d1 = twoLastPeriods[1].endDate;
  }
  d1.setDate(d1.getDate() + 7);

  if (d2 < d1) return false; // Must be minimum 7 days later than previous period

  return true;
}

async function validateOnlyUpdateLastPeriod(this: any, endDate: string) {
  // This rule don't apply to new documents
  if (this.isNew) return true;

  // This rule don't apply when no change to endDate has been made
  if (!this.$__.activePaths.states.modify.endDate) return true;

  // Find two last periods
  const twoLastPeriods = await PeriodModel.find(
    {},
    {},
    { limit: 2, sort: { endDate: -1 } }
  );

  // No period exists = this is the first period = allow any date
  // Only one item in array, this is the last and first period = allow any date
  if (!twoLastPeriods || twoLastPeriods.length === 1) return true;

  // Date change only allowed on last period
  if (!twoLastPeriods[0]._id.equals(this._id)) return false;

  return true;
}

async function validateOnlyUpdateOpenPeriod(this: any, endDate: string) {
  // This rule don't apply to new documents
  if (this.isNew) return true;

  // This rule don't apply when no change to endDate has been made
  if (!this.$__.activePaths.states.modify.endDate) return true;

  if (this.status !== 'OPEN') return false;

  return true;
}

const endDateValidators = [
  {
    validator: validateEndDate,
    msg: 'Must be minimum 7 days later than previous period.',
  },
  {
    validator: validateOnlyUpdateLastPeriod,
    msg: 'Date change only allowed on last period.',
  },
  {
    validator: validateOnlyUpdateOpenPeriod,
    msg: 'Date change only allowed on open periods.',
  },
];

const periodSchema = new mongoose.Schema<PeriodDocument>(
  {
    name: { type: String, required: true, minlength: 3, maxlength: 64 },
    status: {
      type: String,
      enum: ['OPEN', 'QUANTIFY', 'CLOSED'],
      default: 'OPEN',
    },
    endDate: {
      type: Date,
      required: true,
      validate: endDateValidators,
    },
    quantifiers: { type: [String] },
  },
  {
    timestamps: true,
  }
);

periodSchema.plugin(mongoosePagination);

const PeriodModel = mongoose.model<PeriodDocument, Pagination<PeriodDocument>>(
  'Period',
  periodSchema
);

export { PeriodModel };
