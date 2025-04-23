import User from "../models/User.js";
import Hospital from "../models/Hospital.js";
import Request from "../models/Request.js";

const searchDonors = async (bloodType, location, maxDistance = 50) => {
  try {
    const donors = await User.find({
      role: "donor",
      bloodType,
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [location.longitude, location.latitude],
          },
          $maxDistance: maxDistance * 1000, // Convert km to meters
        },
      },
    }).select("name bloodType phone location");

    return donors;
  } catch (err) {
    console.error("Error searching donors:", err);
    throw err;
  }
};

const searchHospitals = async (location, maxDistance = 50) => {
  try {
    const hospitals = await Hospital.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [location.longitude, location.latitude],
          },
          $maxDistance: maxDistance * 1000, // Convert km to meters
        },
      },
    }).select("name address phone location bloodBank");

    return hospitals;
  } catch (err) {
    console.error("Error searching hospitals:", err);
    throw err;
  }
};

const searchRequests = async (bloodType, location, maxDistance = 50) => {
  try {
    const requests = await Request.find({
      bloodType,
      status: "open",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [location.longitude, location.latitude],
          },
          $maxDistance: maxDistance * 1000, // Convert km to meters
        },
      },
    })
      .populate({
        path: "hospital",
        select: "name address",
      })
      .select("patientName bloodType quantity urgency hospital");

    return requests;
  } catch (err) {
    console.error("Error searching requests:", err);
    throw err;
  }
};

export { searchDonors, searchHospitals, searchRequests };
