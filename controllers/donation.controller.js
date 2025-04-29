import Donation from "../models/Donation.js";
import User from "../models/User.js";
import Hospital from "../models/Hospital.js";
import Notification from "../models/Notification.js";
import ErrorResponse from "../utils/errorResponse.js";
import sendNotification from "../services/notification.service.js";
import { DonationQueryBuilder } from "../utils/donationQueryBuilder.js";
import mongoose from "mongoose";

export const getDonations = async (req, res, next) => {
  try {
    const {
      donor,
      hospital,
      bloodType,
      status,
      minQuantity,
      maxQuantity,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    const donations = await new DonationQueryBuilder()
      .byDonor(donor)
      .byHospital(hospital)
      .byBloodType(bloodType)
      .byStatus(status)
      .minQuantity(minQuantity)
      .maxQuantity(maxQuantity)
      .byDateRange(startDate, endDate)
      .sort(sortBy, sortOrder)
      .withDetails()
      .paginate(parseInt(page), parseInt(limit))
      .execute();

    res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (err) {
    next(err);
  }
};

export const getDonationById = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate({
        path: "donor",
        select: "name bloodType",
      })
      .populate({
        path: "hospital",
        select: "name address",
      });

    if (!donation) {
      return next(
        new ErrorResponse(
          `No donation found with the id of ${req.params.id}`,
          404
        )
      );
    }

    if (!donation.donor) {
      return next(
        new ErrorResponse(`Donor information missing for this donation`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (err) {
    console.error(`Error getting donation ${req.params.id}:`, err);
    next(err);
  }
};

export const createDonation = async (req, res, next) => {
  try {
    req.body.hospital = req.params.hospitalId;
    req.body.donor = req.user.id;
    req.body.donationDate = new Date();

    const hospital = await Hospital.findById(req.params.hospitalId);
    if (!hospital) {
      return next(new ErrorResponse(`Hospital not found`, 404));
    }

    const donor = await User.findById(req.user.id);

    if (req.body.bloodType && req.body.bloodType !== donor.bloodType) {
      return next(
        new ErrorResponse(
          `You can only donate your registered blood type (${donor.bloodType})`,
          400
        )
      );
    }

    const quantity = req.body.quantity || 1;

    if (isNaN(quantity) || quantity <= 0) {
      return next(new ErrorResponse(`Quantity must be a positive number`, 400));
    }

    if (donor.lastDonationDate) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);

      if (new Date(donor.lastDonationDate) > threeMonthsAgo) {
        const nextDonationDate = new Date(donor.lastDonationDate);
        nextDonationDate.setMonth(nextDonationDate.getMonth() + 2);
        return next(
          new ErrorResponse(
            `You must wait until ${nextDonationDate.toLocaleDateString()} to donate again. ` +
              `Last donation was on ${new Date(
                donor.lastDonationDate
              ).toLocaleDateString()}`,
            400
          )
        );
      }
    }

    // Create the donation record
    const donation = await Donation.create({
      ...req.body,
      quantity: quantity,
    });

    // Update donor's last donation date
    donor.lastDonationDate = donation.donationDate;
    await donor.save();

    // Update hospital's blood bank inventory
    if (donor.bloodType && hospital.bloodBank.has(donor.bloodType)) {
      hospital.bloodBank.set(
        donor.bloodType,
        hospital.bloodBank.get(donor.bloodType) + quantity
      );
      await hospital.save();
    }

    // Send notification
    await sendNotification({
      user: hospital.createdBy,
      message: `New donation recorded for ${donor.name} (${donor.bloodType} x${quantity})`,
      type: "donation",
      relatedEntity: donation._id,
    });

    return res.status(201).json({
      success: true,
      data: donation,
      bloodBankUpdated: !!donor.bloodType,
    });
  } catch (err) {
    console.error("Donation creation error:", err.message);
    return next(new ErrorResponse(err.message, 500));
  }
};

export const updateDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return next(
        new ErrorResponse(`No donation with the id of ${req.params.id}`, 404)
      );
    }

    const updatedDonation = await Donation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (req.body.status === "completed") {
      const hospital = await Hospital.findById(updatedDonation.hospital);
      if (!hospital) {
        return next(new ErrorResponse(`Hospital not found`, 404));
      }

      const currentQuantity =
        hospital.bloodBank.get(updatedDonation.bloodType) || 0;
      hospital.bloodBank.set(
        updatedDonation.bloodType,
        currentQuantity + updatedDonation.quantity
      );
      await hospital.save();
    }

    res.status(200).json({
      success: true,
      data: updatedDonation,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return next(
        new ErrorResponse(`No donation with the id of ${req.params.id}`, 404)
      );
    }

    if (
      donation.donor.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete this donation`,
          401
        )
      );
    }

    await donation.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
