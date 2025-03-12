import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required!"],
  },
  description: {
    type: String,
    required: [true, "Description is required!"],
  },
  grade: {
    type: String, // ✅ Added grade field to store percentage or GPA
    required: [true, "Grade is required!"],
  },
  timeline: {
    from: {
      type: Date,
      required: [true, "Start date (from) is required!"],
    },
    to: {
      type: Date,
      default: null, // Default to null for ongoing events
    },
  },
});

export const Timeline = mongoose.model("Timeline", timelineSchema);
