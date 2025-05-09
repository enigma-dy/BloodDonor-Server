import Hospital from "../models/Hospital.js";
import User from "../models/User.js";
import ErrorResponse from "../utils/errorResponse.js";
import axios from "axios";

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

    const parsedQuery = JSON.parse(queryStr);

    // Custom filters
    if (req.query.lga) {
      parsedQuery.lga = { $regex: req.query.lga, $options: "i" };
    }

    if (req.query.state) {
      parsedQuery.state = { $regex: req.query.state, $options: "i" };
    }

    query = Hospital.find(parsedQuery);

    // Select
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Hospital.countDocuments(parsedQuery);

    query = query.skip(startIndex).limit(limit);

    const hospitals = await query;

    const pagination = {};

    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }

    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
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

    const existingHospital = await Hospital.findOne({
      email: req.body.email,
    }).select("-password");

    if (existingHospital) {
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

    if (req.body.longitude && req.body.latitude) {
      req.body.location = {
        type: "Point",
        coordinates: [req.body.longitude, req.body.latitude],
      };
    }

    if (!req.body.longitude || !req.body.latitude) {
      const { address, state, lga } = req.body;

      if (address || state || lga) {
        const response = await axios.get(GEOCODING_API_URL, {
          params: {
            q: `${address}, ${state}, ${lga}`,
            key: GEOCODING_API_KEY,
          },
        });

        if (response.data.results.length === 0) {
          return next(
            new ErrorResponse("Unable to find coordinates for the address", 400)
          );
        }

        const { lat, lng } = response.data.results[0].geometry;

        req.body.location = {
          type: "Point",
          coordinates: [lng, lat],
        };
      }
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
