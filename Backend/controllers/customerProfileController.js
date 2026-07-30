const pool = require('../config/db');

function pickProfileImage(body) {
  const value = body.profileImage ?? body.profile_image;
  return value?.trim() || null;
}

function pickCityName(body) {
  const value = body.cityName ?? body.city_name;
  return value?.trim() || null;
}

async function saveUserProfileImage(userId, profileImage) {
  if (!profileImage) return;
  await pool.query('UPDATE users SET profile_image = ? WHERE id = ?', [profileImage, userId]);
}

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
    cityName: row.city_name,
    latitude: row.latitude != null ? parseFloat(row.latitude) : null,
    longitude: row.longitude != null ? parseFloat(row.longitude) : null,
    mobile: row.mobile,
    email: row.email,
    profileImage: row.profile_image,
    memberSince: row.user_created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PROFILE_SELECT = `
  SELECT
    cp.id,
    cp.customer_id,
    cp.first_name,
    cp.last_name,
    cp.gender,
    cp.dob,
    cp.address,
    cp.city_name,
    cp.latitude,
    cp.longitude,
    cp.created_at,
    cp.updated_at,
    u.mobile,
    u.email,
    u.profile_image,
    u.created_at AS user_created_at
  FROM customer_profiles cp
  INNER JOIN users u ON u.id = cp.customer_id
`;

async function fetchProfileByCustomerId(customerId) {
  const [rows] = await pool.query(`${PROFILE_SELECT} WHERE cp.customer_id = ?`, [customerId]);
  return rows[0] || null;
}

function isPlatformAdmin(user) {
  return user?.role === 'admin' || user?.role === 'superadmin';
}

exports.listAllProfiles = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can list customer profiles',
      });
    }

    const [rows] = await pool.query(`${PROFILE_SELECT} ORDER BY cp.created_at DESC`);

    return res.status(200).json({
      success: true,
      data: rows.map(formatProfile),
    });
  } catch (error) {
    console.error('List customer profiles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching customer profiles',
    });
  }
};

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
      latitude,
      longitude,
    } = req.body;

    const profileImageUrl = pickProfileImage(req.body);
    const cityName = pickCityName(req.body);

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

    if (profileImageUrl) {
      await saveUserProfileImage(customerId, profileImageUrl);
    }

    await pool.query(
      `INSERT INTO customer_profiles
       (customer_id, first_name, last_name, gender, dob, address, city_name, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        firstName?.trim() || null,
        lastName?.trim() || null,
        gender || null,
        dob || null,
        address?.trim() || null,
        cityName,
        latitude ?? null,
        longitude ?? null,
      ],
    );

    const profile = await fetchProfileByCustomerId(customerId);

    return res.status(201).json({
      success: true,
      message: 'Customer profile created successfully',
      data: formatProfile(profile),
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
    const profile = await fetchProfileByCustomerId(customerId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: formatProfile(profile),
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
      latitude,
      longitude,
    } = req.body;

    const profileImageUrl =
      req.body.profileImage !== undefined || req.body.profile_image !== undefined
        ? pickProfileImage(req.body)
        : undefined;

    const cityName =
      req.body.cityName !== undefined || req.body.city_name !== undefined
        ? pickCityName(req.body)
        : undefined;

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

    if (profileImageUrl !== undefined) {
      await saveUserProfileImage(customerId, profileImageUrl);
    }

    await pool.query(
      `UPDATE customer_profiles SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        gender = COALESCE(?, gender),
        dob = COALESCE(?, dob),
        address = COALESCE(?, address),
        city_name = COALESCE(?, city_name),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude)
       WHERE customer_id = ?`,
      [
        firstName?.trim() ?? null,
        lastName?.trim() ?? null,
        gender ?? null,
        dob ?? null,
        address?.trim() ?? null,
        cityName ?? null,
        latitude ?? null,
        longitude ?? null,
        customerId,
      ],
    );

    const profile = await fetchProfileByCustomerId(customerId);

    return res.status(200).json({
      success: true,
      message: 'Customer profile updated successfully',
      data: formatProfile(profile),
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
    const profile = await fetchProfileByCustomerId(customerId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: formatProfile(profile),
    });
  } catch (error) {
    console.error('Get profile by customerId error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
    });
  }
};
