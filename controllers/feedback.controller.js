import Feedback from "../models/Feedback.js";
import ErrorResponse from "../utils/errorResponse.js";

export const getFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find()
      .populate({
        path: "user",
        select: "name email role",
      })
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback,
    });
  } catch (err) {
    next(err);
  }
};

export const getEntityFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({
      type: req.params.type,
      relatedEntity: req.params.entityId,
    })
      .populate({
        path: "user",
        select: "name",
      })
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback,
    });
  } catch (err) {
    next(err);
  }
};

export const createFeedback = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    const feedback = await Feedback.create(req.body);

    res.status(201).json({
      success: true,
      data: feedback,
    });
  } catch (err) {
    next(err);
  }
};

export const updateFeedback = async (req, res, next) => {
  try {
    let feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return next(
        new ErrorResponse(`Feedback not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is feedback owner
    if (feedback.user.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this feedback`,
          401
        )
      );
    }

    feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return next(
        new ErrorResponse(`Feedback not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is feedback owner or admin
    if (feedback.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete this feedback`,
          401
        )
      );
    }

    await feedback.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
