import mongoose, { Document, Schema } from 'mongoose';

export interface IMetric {
  x: number;
  y: number;
  z: number;
  fall: boolean;
  date: string;
}

export interface IDevice extends Document {
  macAddress: string;
  metric: IMetric[];
}

const deviceSchema = new Schema<IDevice>({
  macAddress: { type: String, required: true },
  metric: [
    {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number, required: true },
      fall: { type: Boolean, required: true },
      date: { type: String, required: true },
    },
  ],
});

const DeviceModel = mongoose.model<IDevice>('Device', deviceSchema);
export default DeviceModel;
