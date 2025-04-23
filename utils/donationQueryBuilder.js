import Donation from "../models/Donation.js";

export class DonationQueryBuilder {
  constructor() {
    this.query = Donation.find();
    this.filters = {};
  }

  // Filter by donor ID
  byDonor(donorId) {
    if (donorId) {
      this.filters.donor = donorId;
    }
    return this;
  }

  // Filter by hospital ID
  byHospital(hospitalId) {
    if (hospitalId) {
      this.filters.hospital = hospitalId;
    }
    return this;
  }

  // Filter by blood type
  byBloodType(bloodType) {
    if (bloodType) {
      this.filters.bloodType = bloodType;
    }
    return this;
  }

  // Filter by status
  byStatus(status) {
    if (status) {
      this.filters.status = status;
    }
    return this;
  }

  // Filter by minimum quantity
  minQuantity(quantity) {
    if (quantity) {
      this.filters.quantity = { $gte: Number(quantity) };
    }
    return this;
  }

  // Filter by maximum quantity
  maxQuantity(quantity) {
    if (quantity) {
      this.filters.quantity = this.filters.quantity || {};
      this.filters.quantity.$lte = Number(quantity);
    }
    return this;
  }

  // Filter by date range
  byDateRange(startDate, endDate) {
    if (startDate || endDate) {
      this.filters.donationDate = {};
      if (startDate) {
        this.filters.donationDate.$gte = new Date(startDate);
      }
      if (endDate) {
        this.filters.donationDate.$lte = new Date(endDate);
      }
    }
    return this;
  }

  // Sort results
  sort(sortBy, sortOrder = "asc") {
    if (sortBy) {
      const sortDirection = sortOrder.toLowerCase() === "desc" ? -1 : 1;
      this.query = this.query.sort({ [sortBy]: sortDirection });
    }
    return this;
  }

  // Pagination
  paginate(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  // Populate donor and hospital details
  withDetails() {
    this.query = this.query
      .populate({
        path: "donor",
        select: "name bloodType",
      })
      .populate({
        path: "hospital",
        select: "name address",
      });
    return this;
  }

  // Execute the query
  async execute() {
    if (Object.keys(this.filters).length > 0) {
      this.query = this.query.where(this.filters);
    }
    return await this.query.exec();
  }
}
