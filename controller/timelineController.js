import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Timeline } from "../models/timelineSchema.js";

export const postTimeline = catchAsyncErrors(async (req, res, next) => {
  const { title, description, grade, from, to } = req.body; // ✅ Added `grade`

  console.log("Received Data:", req.body); // ✅ Debugging

  // Ensure `from` and `to` are converted to Date before saving
  const newTimeline = await Timeline.create({
    title,
    description,
    grade, // ✅ Include `grade`
    timeline: {
      from: from ? new Date(from) : null, // ✅ Convert to Date
      to: to ? new Date(to) : null, // ✅ Convert to Date (or null)
    },
  });

  console.log("Saved Timeline:", newTimeline); // ✅ Debugging

  res.status(201).json({
    success: true,
    message: "Timeline Added Successfully!",
    newTimeline,
  });
});

export const deleteTimeline = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  let timeline = await Timeline.findById(id);
  if (!timeline) {
    return next(new ErrorHandler("Timeline not found", 404));
  }
  await timeline.deleteOne();
  res.status(200).json({
    success: true,
    message: "Timeline Deleted!",
  });
});

export const getAllTimelines = catchAsyncErrors(async (req, res, next) => {
  const timelines = await Timeline.find();
  res.status(200).json({
    success: true,
    timelines,
  });
});
