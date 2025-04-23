import Request from "../models/Request.js";
import User from "../models/User.js";
import Hospital from "../models/Hospital.js";
import Notification from "../models/Notification.js";
import ErrorResponse from "../utils/errorResponse.js";
import sendNotification from "../services/notification.service.js";

export const getRequests = async (req, res, next) => {
  try {
    let query;

    if (req.params.hospitalId) {
      query = Request.find({ hospital: req.params.hospitalId });
    } else {
      query = Request.find();
    }

    if (req.query.status) {
      query = query.where("status").equals(req.query.status);
    }

    if (req.query.bloodType) {
      query = query.where("bloodType").equals(req.query.bloodType);
    }

    if (req.query.urgency) {
      query = query.where("urgency").equals(req.query.urgency);
    }

    if (req.query.longitude && req.query.latitude) {
      const distance = req.query.distance || 50;
      query = query.where("location").near({
        center: {
          type: "Point",
          coordinates: [
            parseFloat(req.query.longitude),
            parseFloat(req.query.latitude),
          ],
        },
        maxDistance: distance * 1000, // Convert to meters
        spherical: true,
      });
    }

    const requests = await query
      .populate({
        path: "hospital",
        select: "name address",
      })
      .populate({
        path: "createdBy",
        select: "name role",
      })
      .populate({
        path: "fulfilledBy",
        select: "name",
      });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (err) {
    next(err);
  }
};

export const getRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate({
        path: "hospital",
        select: "name address",
      })
      .populate({
        path: "createdBy",
        select: "name role",
      })
      .populate({
        path: "fulfilledBy",
        select: "name",
      });

    if (!request) {
      return next(
        new ErrorResponse(
          `No request found with the id of ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (err) {
    next(err);
  }
};

export const createRequest = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    req.body.hospital = req.params.hospitalId;

    const hospital = await Hospital.findById(req.params.hospitalId);

    if (!hospital) {
      return next(
        new ErrorResponse(
          `No hospital with the id of ${req.params.hospitalId}`,
          404
        )
      );
    }

    if (!req.body.location) {
      req.body.location = hospital.location;
    } else {
      req.body.location = {
        type: "Point",
        coordinates: [req.body.location.longitude, req.body.location.latitude],
      };
    }

    const request = await Request.create(req.body);

    const donors = await User.find({
      bloodType: request.bloodType,
      isAvailable: true,
      role: "donor",
      location: {
        $near: {
          $geometry: request.location,
          $maxDistance: 50000, // 50km radius
        },
      },
    });

    for (const donor of donors) {
      await sendNotification({
        user: donor._id,
        message: `New blood request matching your blood type (${donor.bloodType})`,
        type: "request",
        relatedEntity: request._id,
      });
    }

    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (err) {
    next(err);
  }
};

export const updateRequest = async (req, res, next) => {
  try {
    let request = await Request.findById(req.params.id);

    if (!request) {
      return next(
        new ErrorResponse(`No request with the id of ${req.params.id}`, 404)
      );
    }

    if (
      request.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this request`,
          401
        )
      );
    }

    if (req.body.status === "fulfilled" && !request.fulfilledBy) {
      req.body.fulfilledBy = req.user.id;
      req.body.fulfilledAt = Date.now();
    }

    request = await Request.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return next(
        new ErrorResponse(`No request with the id of ${req.params.id}`, 404)
      );
    }

    if (
      request.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete this request`,
          401
        )
      );
    }

    await request.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

export const fulfillRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return next(
        new ErrorResponse(`No request with the id of ${req.params.id}`, 404)
      );
    }

    if (request.status === "fulfilled") {
      return next(new ErrorResponse(`Request has already been fulfilled`, 400));
    }

    if (req.user.role !== "donor") {
      return next(
        new ErrorResponse(`Only donors can fulfill blood requests`, 400)
      );
    }

    const donor = await User.findById(req.user.id);
    if (donor.bloodType !== request.bloodType) {
      return next(
        new ErrorResponse(
          `Your blood type (${donor.bloodType}) does not match the request (${request.bloodType})`,
          400
        )
      );
    }

    if (!donor.isAvailable) {
      return next(
        new ErrorResponse(`You are not currently available for donation`, 400)
      );
    }

    request.status = "fulfilled";
    request.fulfilledBy = req.user.id;
    request.fulfilledAt = Date.now();
    await request.save();

    await sendNotification({
      user: request.createdBy,
      message: `Your blood request has been fulfilled by ${donor.name}`,
      type: "request",
      relatedEntity: request._id,
    });

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (err) {
    next(err);
  }
};
