import mongoose, { Document, Schema } from 'mongoose';

export interface IMetric {
  x: number;
  y: number;
  z: number;
  fall: boolean;
  date: string;
  isResolved: boolean;
  resolvedAt: string;
  resolvedBy: string;
}

export interface IDevice extends Document {
  macAddress: string;
  metric: IMetric[];
}

const metricSchema = new Schema(
  {
    x: Number,
    y: Number,
    z: Number,
    fall: Boolean,
    date: String,
    isResolved: { type: Boolean, default: false },
    resolvedAt: String,
    resolvedBy: String,
  },
  { _id: true },
);

const deviceSchema = new Schema<IDevice>({
  macAddress: { type: String, required: true },
  metric: [metricSchema],
});

const DeviceModel = mongoose.model<IDevice>('Device', deviceSchema);
export default DeviceModel;
