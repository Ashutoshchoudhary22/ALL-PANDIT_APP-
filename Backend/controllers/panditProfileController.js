const pool = require('../config/db');

const LANGUAGE_LABELS = {
  hi: 'Hindi',
  en: 'English',
  sa: 'Sanskrit',
  sanskrit: 'Sanskrit',
};

function mapLanguageCode(code) {
  if (!code) return [];
  const parts = code.split(',').map((p) => p.trim().toLowerCase());
  return parts.map((p) => LANGUAGE_LABELS[p] || p);
}

function pickProfileImage(body) {
  const value = body.profileImage ?? body.profile_image;
  return value?.trim() || null;
}

async function saveUserProfileImage(userId, profileImage) {
  if (!profileImage) return;
  await pool.query('UPDATE users SET profile_image = ? WHERE id = ?', [profileImage, userId]);
}

function formatPanditProfile(row) {
  if (!row) return null;

  const experienceYears = row.experience_years ?? 0;
  const memberSinceYear = row.user_created_at
    ? new Date(row.user_created_at).getFullYear()
    : null;
  const performingSince =
    experienceYears > 0 && memberSinceYear
      ? memberSinceYear - experienceYears
      : memberSinceYear;

  return {
    id: row.profile_id,
    userId: row.user_id,
    name: row.name,
    gender: row.gender,
    bio: row.bio,
    experienceYears,
    cityId: row.city_id,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    aadharImage: row.aadhar_image,
    panditCertificateImage: row.pandit_certificate_image,
    bankAccountHolder: row.bank_account_holder,
    bankAccountNumber: row.bank_account_number,
    bankIfsc: row.bank_ifsc,
    bankName: row.bank_name,
    passbookImage: row.passbook_image,
    profileImage: row.pandit_profile_image || row.profile_image,
    rating: row.rating ? parseFloat(row.rating) : 0,
    totalReviews: row.total_reviews ?? 0,
    totalBookings: row.total_bookings ?? 0,
    isVerified: Boolean(row.is_verified),
    isOnline: Boolean(row.is_online),
    isAvailable: Boolean(row.is_available),
    sameDayBooking: Boolean(row.same_day_booking),
    status: row.status,
    mobile: row.mobile,
    email: row.email,
    languageCode: row.language_code,
    languages: mapLanguageCode(row.language_code),
    memberSince: row.user_created_at,
    performingSince,
    profileCreatedAt: row.created_at,
    profileUpdatedAt: row.updated_at,
  };
}

const PROFILE_SELECT = `
  SELECT
    pp.id AS profile_id,
    pp.user_id,
    pp.name,
    pp.gender,
    pp.bio,
    pp.experience_years,
    pp.city_id,
    pp.latitude,
    pp.longitude,
    pp.aadhar_image,
    pp.pandit_certificate_image,
    pp.bank_account_holder,
    pp.bank_account_number,
    pp.bank_ifsc,
    pp.bank_name,
    pp.passbook_image,
    pp.profile_image AS pandit_profile_image,
    pp.rating,
    pp.total_reviews,
    pp.total_bookings,
    pp.is_verified,
    pp.is_online,
    pp.is_available,
    pp.same_day_booking,
    pp.status,
    pp.created_at,
    pp.updated_at,
    u.mobile,
    u.email,
    u.profile_image,
    u.language_code,
    u.created_at AS user_created_at
  FROM pandit_profiles pp
  INNER JOIN users u ON u.id = pp.user_id
`;

async function fetchProfileByUserId(userId) {
  const [rows] = await pool.query(`${PROFILE_SELECT} WHERE pp.user_id = ?`, [userId]);
  return rows[0] || null;
}

exports.createProfile = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({
        success: false,
        message: 'Only pandits can create a pandit profile',
      });
    }

    const userId = req.user.id;
    const {
      name,
      gender,
      bio,
      experienceYears,
      cityId,
      latitude,
      longitude,
      isAvailable,
      sameDayBooking,
      aadharImage,
      panditCertificateImage,
      bankAccountHolder,
      bankAccountNumber,
      bankIfsc,
      bankName,
      passbookImage,
    } = req.body;

    const profileImageUrl = pickProfileImage(req.body);

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    const [users] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [userId, 'pandit'],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pandit account not found',
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM pandit_profiles WHERE user_id = ?',
      [userId],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Pandit profile already exists',
      });
    }

    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender value',
      });
    }

    if (profileImageUrl) {
      await saveUserProfileImage(userId, profileImageUrl);
    }

    await pool.query(
      `INSERT INTO pandit_profiles
       (user_id, name, gender, bio, experience_years, city_id, latitude, longitude,
        profile_image, aadhar_image, pandit_certificate_image, bank_account_holder, bank_account_number,
        bank_ifsc, bank_name, passbook_image, is_available, same_day_booking, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        name.trim(),
        gender || 'male',
        bio?.trim() || null,
        experienceYears ?? 0,
        cityId || null,
        latitude ?? null,
        longitude ?? null,
        profileImageUrl,
        aadharImage?.trim() || null,
        panditCertificateImage?.trim() || null,
        bankAccountHolder?.trim() || null,
        bankAccountNumber?.trim() || null,
        bankIfsc?.trim()?.toUpperCase() || null,
        bankName?.trim() || null,
        passbookImage?.trim() || null,
        isAvailable !== undefined ? Boolean(isAvailable) : true,
        Boolean(sameDayBooking),
      ],
    );

    const profile = await fetchProfileByUserId(userId);

    return res.status(201).json({
      success: true,
      message: 'Pandit profile created successfully',
      data: formatPanditProfile(profile),
    });
  } catch (error) {
    console.error('Create pandit profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating pandit profile',
    });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({
        success: false,
        message: 'Only pandits can access pandit profile',
      });
    }

    const profile = await fetchProfileByUserId(req.user.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Pandit profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: formatPanditProfile(profile),
    });
  } catch (error) {
    console.error('Get pandit profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pandit profile',
    });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({
        success: false,
        message: 'Only pandits can update pandit profile',
      });
    }

    const userId = req.user.id;
    const {
      name,
      gender,
      bio,
      experienceYears,
      cityId,
      latitude,
      longitude,
      isAvailable,
      isOnline,
      sameDayBooking,
      languageCode,
      aadharImage,
      panditCertificateImage,
      bankAccountHolder,
      bankAccountNumber,
      bankIfsc,
      bankName,
      passbookImage,
    } = req.body;

    const profileImageUrl =
      req.body.profileImage !== undefined || req.body.profile_image !== undefined
        ? pickProfileImage(req.body)
        : undefined;

    const [existing] = await pool.query(
      'SELECT id FROM pandit_profiles WHERE user_id = ?',
      [userId],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pandit profile not found',
      });
    }

    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender value',
      });
    }

    if (profileImageUrl !== undefined) {
      await saveUserProfileImage(userId, profileImageUrl);
    }

    if (languageCode !== undefined) {
      await pool.query('UPDATE users SET language_code = ? WHERE id = ?', [
        languageCode?.trim() || 'hi',
        userId,
      ]);
    }

    await pool.query(
      `UPDATE pandit_profiles SET
        name = COALESCE(?, name),
        gender = COALESCE(?, gender),
        bio = COALESCE(?, bio),
        experience_years = COALESCE(?, experience_years),
        city_id = COALESCE(?, city_id),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        profile_image = COALESCE(?, profile_image),
        aadhar_image = COALESCE(?, aadhar_image),
        pandit_certificate_image = COALESCE(?, pandit_certificate_image),
        bank_account_holder = COALESCE(?, bank_account_holder),
        bank_account_number = COALESCE(?, bank_account_number),
        bank_ifsc = COALESCE(?, bank_ifsc),
        bank_name = COALESCE(?, bank_name),
        passbook_image = COALESCE(?, passbook_image),
        is_available = COALESCE(?, is_available),
        is_online = COALESCE(?, is_online),
        same_day_booking = COALESCE(?, same_day_booking)
       WHERE user_id = ?`,
      [
        name?.trim() ?? null,
        gender ?? null,
        bio?.trim() ?? null,
        experienceYears ?? null,
        cityId ?? null,
        latitude ?? null,
        longitude ?? null,
        profileImageUrl ?? null,
        aadharImage?.trim() ?? null,
        panditCertificateImage?.trim() ?? null,
        bankAccountHolder?.trim() ?? null,
        bankAccountNumber?.trim() ?? null,
        bankIfsc?.trim()?.toUpperCase() ?? null,
        bankName?.trim() ?? null,
        passbookImage?.trim() ?? null,
        isAvailable !== undefined ? Boolean(isAvailable) : null,
        isOnline !== undefined ? Boolean(isOnline) : null,
        sameDayBooking !== undefined ? Boolean(sameDayBooking) : null,
        userId,
      ],
    );

    const profile = await fetchProfileByUserId(userId);

    return res.status(200).json({
      success: true,
      message: 'Pandit profile updated successfully',
      data: formatPanditProfile(profile),
    });
  } catch (error) {
    console.error('Update pandit profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating pandit profile',
    });
  }
};

exports.getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await fetchProfileByUserId(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Pandit profile not found',
      });
    }

    if (profile.status !== 'approved' && req.user?.id !== profile.user_id) {
      return res.status(403).json({
        success: false,
        message: 'This pandit profile is not publicly available',
      });
    }

    return res.status(200).json({
      success: true,
      data: formatPanditProfile(profile),
    });
  } catch (error) {
    console.error('Get pandit profile by userId error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pandit profile',
    });
  }
};
