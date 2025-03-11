import mongoose, { Schema, Document } from 'mongoose';

export interface IAudioMarker extends Document {
  location: {
    type: string;
    coordinates: number[];
  };
  description: string;
  audioPath: string;
  audioKey: string;
  metadata: {
    mimetype: string;
    size: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AudioMarkerSchema: Schema = new Schema({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  audioPath: {
    type: String,
    required: true
  },
  audioKey: {
    type: String,
    required: true
  },
  metadata: {
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  }
}, { 
  timestamps: true 
});

// Create a geospatial index on the location field
AudioMarkerSchema.index({ location: '2dsphere' });

export default mongoose.model<IAudioMarker>('AudioMarker', AudioMarkerSchema);
