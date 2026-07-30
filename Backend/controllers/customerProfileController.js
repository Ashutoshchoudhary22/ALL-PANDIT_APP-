const pool = require('../config/db');

function formatProfile(row) {
  if (!row) return null;

  return {
    id: row.id,
    customerId: row.customer_id,
    firstName: row.first_name,
    lastName: row.last_name,
    gender: row.gender,
    dob: row.dob,
    address: row.address,
    cityId: row.city_id,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

exports.createProfile = async (req, res) => {
  try {
    if (req.user.accountType !== 'customer' && req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can create a customer profile',
      });
    }

    const customerId = req.user.id;
    const {
      firstName,
      lastName,
      gender,
      dob,
      address,
      cityId,
      latitude,
      longitude,
    } = req.body;

    const [customers] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [customerId, 'customer'],
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM customer_profiles WHERE customer_id = ?',
      [customerId],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Customer profile already exists',
      });
    }

    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender value',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO customer_profiles
       (customer_id, first_name, last_name, gender, dob, address, city_id, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        firstName?.trim() || null,
        lastName?.trim() || null,
        gender || null,
        dob || null,
        address?.trim() || null,
        cityId || null,
        latitude ?? null,
        longitude ?? null,
      ],
    );

    const [rows] = await pool.query(
      'SELECT * FROM customer_profiles WHERE id = ?',
      [result.insertId],
    );

    return res.status(201).json({
      success: true,
      message: 'Customer profile created successfully',
      data: formatProfile(rows[0]),
    });
  } catch (error) {
    console.error('Create profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating profile',
    });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    if (req.user.accountType !== 'customer' && req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can access customer profile',
      });
    }

    const customerId = req.user.id;

    const [rows] = await pool.query(
      'SELECT * FROM customer_profiles WHERE customer_id = ?',
      [customerId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: formatProfile(rows[0]),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
    });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    if (req.user.accountType !== 'customer' && req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can update customer profile',
      });
    }

    const customerId = req.user.id;
    const {
      firstName,
      lastName,
      gender,
      dob,
      address,
      cityId,
      latitude,
      longitude,
    } = req.body;

    const [existing] = await pool.query(
      'SELECT id FROM customer_profiles WHERE customer_id = ?',
      [customerId],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found',
      });
    }

    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender value',
      });
    }

    await pool.query(
      `UPDATE customer_profiles SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        gender = COALESCE(?, gender),
        dob = COALESCE(?, dob),
        address = COALESCE(?, address),
        city_id = COALESCE(?, city_id),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude)
       WHERE customer_id = ?`,
      [
        firstName?.trim() ?? null,
        lastName?.trim() ?? null,
        gender ?? null,
        dob ?? null,
        address?.trim() ?? null,
        cityId ?? null,
        latitude ?? null,
        longitude ?? null,
        customerId,
      ],
    );

    const [rows] = await pool.query(
      'SELECT * FROM customer_profiles WHERE customer_id = ?',
      [customerId],
    );

    return res.status(200).json({
      success: true,
      message: 'Customer profile updated successfully',
      data: formatProfile(rows[0]),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
    });
  }
};

exports.getProfileByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM customer_profiles WHERE customer_id = ?',
      [customerId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: formatProfile(rows[0]),
    });
  } catch (error) {
    console.error('Get profile by customerId error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
    });
  }
};
