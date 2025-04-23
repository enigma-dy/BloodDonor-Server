import Hospital from "../models/Hospital.js";
import User from "../models/User.js";
import ErrorResponse from "../utils/errorResponse.js";

export const getHospitals = async (req, res, next) => {
  try {
    let query;

    const reqQuery = { ...req.query };

    const removeFields = ["select", "sort", "page", "limit"];

    removeFields.forEach((param) => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);

    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    query = Hospital.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Hospital.countDocuments();

    query = query.skip(startIndex).limit(limit);

    const hospitals = await query;

    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: hospitals.length,
      pagination,
      data: hospitals,
    });
  } catch (err) {
    next(err);
  }
};

export const getHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return next(
        new ErrorResponse(`Hospital not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};

export const createHospital = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;

    req.body.location = {
      type: "Point",
      coordinates: [req.body.longitude, req.body.latitude],
    };

    const existingHospistal = await Hospital.findOne({
      email: req.body.email,
    }).select("+password");

    if (existingHospistal) {
      return next(
        new ErrorResponse("This Email has already been registered", 401)
      );
    }

    const hospital = await Hospital.create(req.body);

    res.status(201).json({
      success: true,
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};

export const updateHospital = async (req, res, next) => {
  try {
    let hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return next(
        new ErrorResponse(`Hospital not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is hospital owner or admin
    if (
      hospital.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this hospital`,
          401
        )
      );
    }

    // Update location if provided
    if (req.body.longitude && req.body.latitude) {
      req.body.location = {
        type: "Point",
        coordinates: [req.body.longitude, req.body.latitude],
      };
    }

    hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return next(
        new ErrorResponse(`Hospital not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is hospital owner or admin
    if (
      hospital.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete this hospital`,
          401
        )
      );
    }

    await hospital.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

export const getHospitalsInRadius = async (req, res, next) => {
  try {
    const { longitude, latitude, distance } = req.params;

    // Calc radius using radians
    // Divide distance by radius of Earth
    // Earth Radius = 6,378 km
    const radius = distance / 6378;

    const hospitals = await Hospital.find({
      location: {
        $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
      },
    });

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (err) {
    next(err);
  }
};

export const getHospitalBloodBank = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return next(
        new ErrorResponse(`Hospital not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: hospital.bloodBank,
    });
  } catch (err) {
    next(err);
  }
};
