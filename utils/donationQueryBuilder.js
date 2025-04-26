import Donation from "../models/Donation.js";

export class DonationQueryBuilder {
  constructor() {
    this.query = Donation.find();
  }

  // Filter by donor ID
  byDonor(donorId) {
    if (donorId) {
      this.query = this.query.where("donor").equals(donorId);
    }
    return this;
  }

  // Filter by hospital ID
  byHospital(hospitalId) {
    if (hospitalId) {
      this.query = this.query.where("hospital").equals(hospitalId);
    }
    return this;
  }

  // Filter by blood type
  byBloodType(bloodType) {
    if (bloodType) {
      this.query = this.query.where("bloodType").equals(bloodType);
    }
    return this;
  }

  // Filter by status
  byStatus(status) {
    if (status) {
      this.query = this.query.where("status").equals(status);
    }
    return this;
  }

  // Filter by minimum quantity
  minQuantity(quantity) {
    if (quantity) {
      this.query = this.query.where("quantity").gte(Number(quantity));
    }
    return this;
  }

  // Filter by maximum quantity
  maxQuantity(quantity) {
    if (quantity) {
      this.query = this.query.where("quantity").lte(Number(quantity));
    }
    return this;
  }


byDateRange(startDate, endDate) {
  if (startDate || endDate) {
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);
    this.query = this.query.where("donationDate", dateQuery);
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
    return await this.query.exec();
  }
}
