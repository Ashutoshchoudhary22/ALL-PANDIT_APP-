const pool = require('../config/db');
const {
  getBusyPanditProfileIds,
  getCustomerActiveBookedPanditIds,
  isPanditCurrentlyBusy,
} = require('../utils/panditAvailability');

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

function pickCityName(body) {
  const value = body.cityName ?? body.city_name;
  return value?.trim() || null;
}

const PUJA_SERVICE_OPTIONS = require('../constants/pujaServices');

const ALLOWED_PUJA_NAMES = new Set(PUJA_SERVICE_OPTIONS);

function parsePujaServices(raw) {
  if (raw === undefined || raw === null) return { value: null, error: null };
  if (!Array.isArray(raw)) {
    return { value: null, error: 'pujaServices must be an array' };
  }

  const normalized = [];
  const seen = new Set();

  for (const item of raw) {
    const name = typeof item?.name === 'string' ? item.name.trim() : '';
    const price = Number(item?.price);

    if (!name || !ALLOWED_PUJA_NAMES.has(name)) {
      return { value: null, error: `Invalid puja service: ${name || 'unknown'}` };
    }
    if (!Number.isFinite(price) || price <= 0) {
      return { value: null, error: `Invalid price for ${name}` };
    }
    if (seen.has(name)) {
      return { value: null, error: `Duplicate puja service: ${name}` };
    }

    seen.add(name);
    normalized.push({ name, price: Math.round(price) });
  }

  return { value: JSON.stringify(normalized), error: null };
}

function readPujaServices(row) {
  if (!row?.puja_services) return [];
  try {
    const parsed =
      typeof row.puja_services === 'string'
        ? JSON.parse(row.puja_services)
        : row.puja_services;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
    cityName: row.city_name,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    liveLatitude: row.live_latitude != null ? parseFloat(row.live_latitude) : null,
    liveLongitude: row.live_longitude != null ? parseFloat(row.live_longitude) : null,
    liveLocationAt: row.live_location_at,
    aadharImage: row.aadhar_image,
    panditCertificateImage: row.pandit_certificate_image,
    bankAccountHolder: row.bank_account_holder,
    bankAccountNumber: row.bank_account_number,
    bankIfsc: row.bank_ifsc,
    bankName: row.bank_name,
    passbookImage: row.passbook_image,
    profileImage: row.pandit_profile_image || row.profile_image,
    pujaServices: readPujaServices(row),
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
    pp.city_name,
    pp.latitude,
    pp.longitude,
    pp.live_latitude,
    pp.live_longitude,
    pp.live_location_at,
    pp.aadhar_image,
    pp.pandit_certificate_image,
    pp.bank_account_holder,
    pp.bank_account_number,
    pp.bank_ifsc,
    pp.bank_name,
    pp.passbook_image,
    pp.profile_image AS pandit_profile_image,
    pp.puja_services,
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

async function fetchProfileById(profileId) {
  const [rows] = await pool.query(`${PROFILE_SELECT} WHERE pp.id = ?`, [profileId]);
  return rows[0] || null;
}

function isPlatformAdmin(user) {
  return user?.role === 'admin' || user?.role === 'superadmin';
}

function formatPublicPanditProfile(row) {
  const profile = formatPanditProfile(row);
  return {
    id: profile.id,
    userId: profile.userId,
    name: profile.name,
    gender: profile.gender,
    bio: profile.bio,
    experienceYears: profile.experienceYears,
    cityName: profile.cityName,
    latitude: profile.latitude,
    longitude: profile.longitude,
    liveLatitude: profile.liveLatitude,
    liveLongitude: profile.liveLongitude,
    liveLocationAt: profile.liveLocationAt,
    profileImage: profile.profileImage,
    rating: profile.rating,
    totalReviews: profile.totalReviews,
    totalBookings: profile.totalBookings,
    isVerified: profile.isVerified,
    isOnline: profile.isOnline,
    isAvailable: profile.isAvailable,
    sameDayBooking: profile.sameDayBooking,
    languages: profile.languages,
    languageCode: profile.languageCode,
    pujaServices: profile.pujaServices,
    performingSince: profile.performingSince,
  };
}

exports.listPublicProfiles = async (req, res) => {
  try {
    const serviceName = req.query.service?.trim();

    if (serviceName && !ALLOWED_PUJA_NAMES.has(serviceName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid puja service name',
      });
    }

    const [rows] = await pool.query(
      `${PROFILE_SELECT}
       WHERE pp.status = 'approved'
       ORDER BY pp.is_verified DESC, pp.rating DESC, pp.created_at DESC`,
    );

    let profiles = rows.map(formatPublicPanditProfile);

    if (serviceName) {
      profiles = profiles.filter((profile) =>
        profile.pujaServices.some((service) => service.name === serviceName),
      );
    }

    const busyPanditIds = await getBusyPanditProfileIds(pool);
    const customerBookedPanditIds =
      req.user?.role === 'customer'
        ? await getCustomerActiveBookedPanditIds(pool, req.user.id)
        : new Set();

    profiles = profiles
      .filter((profile) => !customerBookedPanditIds.has(profile.id))
      .map((profile) => ({
        ...profile,
        isAvailable: profile.isAvailable && !isPanditCurrentlyBusy(busyPanditIds, profile.id),
      }));

    return res.status(200).json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error('List public pandit profiles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pandit profiles',
    });
  }
};

exports.listPopularServices = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 20);

    const [rows] = await pool.query(
      `${PROFILE_SELECT}
       WHERE pp.status = 'approved' AND pp.puja_services IS NOT NULL
       ORDER BY pp.updated_at DESC`,
    );

    const entries = [];

    for (const row of rows) {
      const services = readPujaServices(row);
      const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : 0;

      for (const service of services) {
        entries.push({
          name: service.name,
          price: service.price,
          updatedAt,
        });
      }
    }

    entries.sort((a, b) => b.updatedAt - a.updatedAt);

    const minPrices = new Map();
    for (const entry of entries) {
      const current = minPrices.get(entry.name);
      if (current == null || entry.price < current) {
        minPrices.set(entry.name, entry.price);
      }
    }

    const seen = new Set();
    const popular = [];

    for (const entry of entries) {
      if (seen.has(entry.name)) continue;
      seen.add(entry.name);
      popular.push({
        name: entry.name,
        minPrice: minPrices.get(entry.name),
        lastAddedAt: new Date(entry.updatedAt).toISOString(),
      });
      if (popular.length >= limit) break;
    }

    return res.status(200).json({
      success: true,
      data: popular,
    });
  } catch (error) {
    console.error('List popular puja services error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching popular puja services',
    });
  }
};

exports.getPublicProfileById = async (req, res) => {
  try {
    const { profileId } = req.params;
    const profile = await fetchProfileById(profileId);

    if (!profile || profile.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: 'Pandit profile not found',
      });
    }

    const busyPanditIds = await getBusyPanditProfileIds(pool);
    const customerBookedPanditIds =
      req.user?.role === 'customer'
        ? await getCustomerActiveBookedPanditIds(pool, req.user.id)
        : new Set();

    if (customerBookedPanditIds.has(Number(profileId))) {
      return res.status(404).json({
        success: false,
        message: 'Pandit profile not found',
      });
    }

    const publicProfile = formatPublicPanditProfile(profile);
    publicProfile.isAvailable =
      publicProfile.isAvailable && !isPanditCurrentlyBusy(busyPanditIds, publicProfile.id);

    return res.status(200).json({
      success: true,
      data: publicProfile,
    });
  } catch (error) {
    console.error('Get public pandit profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pandit profile',
    });
  }
};

exports.listAllProfiles = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can list pandit profiles',
      });
    }

    const [rows] = await pool.query(`${PROFILE_SELECT} ORDER BY pp.created_at DESC`);

    return res.status(200).json({
      success: true,
      data: rows.map(formatPanditProfile),
    });
  } catch (error) {
    console.error('List pandit profiles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pandit profiles',
    });
  }
};

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
    const cityName = pickCityName(req.body);
    const pujaServicesInput = parsePujaServices(req.body.pujaServices ?? req.body.puja_services);

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

    if (pujaServicesInput.error) {
      return res.status(400).json({
        success: false,
        message: pujaServicesInput.error,
      });
    }

    if (profileImageUrl) {
      await saveUserProfileImage(userId, profileImageUrl);
    }

    await pool.query(
      `INSERT INTO pandit_profiles
       (user_id, name, gender, bio, experience_years, city_name, latitude, longitude,
        profile_image, aadhar_image, pandit_certificate_image, bank_account_holder, bank_account_number,
        bank_ifsc, bank_name, passbook_image, puja_services, is_available, same_day_booking, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        name.trim(),
        gender || 'male',
        bio?.trim() || null,
        experienceYears ?? 0,
        cityName,
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
        pujaServicesInput.value,
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

    const cityName =
      req.body.cityName !== undefined || req.body.city_name !== undefined
        ? pickCityName(req.body)
        : undefined;

    const hasPujaServices =
      req.body.pujaServices !== undefined || req.body.puja_services !== undefined;
    const pujaServicesInput = hasPujaServices
      ? parsePujaServices(req.body.pujaServices ?? req.body.puja_services)
      : { value: undefined, error: null };

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

    if (pujaServicesInput.error) {
      return res.status(400).json({
        success: false,
        message: pujaServicesInput.error,
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
        city_name = COALESCE(?, city_name),
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
        puja_services = COALESCE(?, puja_services),
        is_available = COALESCE(?, is_available),
        is_online = COALESCE(?, is_online),
        same_day_booking = COALESCE(?, same_day_booking)
       WHERE user_id = ?`,
      [
        name?.trim() ?? null,
        gender ?? null,
        bio?.trim() ?? null,
        experienceYears ?? null,
        cityName ?? null,
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
        pujaServicesInput.value ?? null,
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

exports.updateLiveLocation = async (req, res) => {
  try {
    if (req.user.role !== 'pandit') {
      return res.status(403).json({
        success: false,
        message: 'Only pandits can update pandit live location',
      });
    }

    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const userId = req.user.id;

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

    await pool.query(
      `UPDATE pandit_profiles
       SET live_latitude = ?, live_longitude = ?, live_location_at = NOW(), is_online = TRUE
       WHERE user_id = ?`,
      [latitude, longitude, userId],
    );

    const profile = await fetchProfileByUserId(userId);

    return res.status(200).json({
      success: true,
      message: 'Live location updated',
      data: formatPanditProfile(profile),
    });
  } catch (error) {
    console.error('Update pandit live location error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating live location',
    });
  }
};

exports.getProfileById = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view pandit profile details',
      });
    }

    const { profileId } = req.params;
    const profile = await fetchProfileById(profileId);

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
    console.error('Get pandit profile by id error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pandit profile',
    });
  }
};

exports.updateProfileStatus = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update pandit profile status',
      });
    }

    const { profileId } = req.params;
    const status = req.body.status?.trim()?.toLowerCase();

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved or rejected',
      });
    }

    const profile = await fetchProfileById(profileId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Pandit profile not found',
      });
    }

    await pool.query(
      `UPDATE pandit_profiles
       SET status = ?, is_verified = ?
       WHERE id = ?`,
      [status, status === 'approved' ? 1 : 0, profileId],
    );

    const updated = await fetchProfileById(profileId);

    return res.status(200).json({
      success: true,
      message:
        status === 'approved'
          ? 'Pandit profile approved successfully'
          : 'Pandit profile rejected',
      data: formatPanditProfile(updated),
    });
  } catch (error) {
    console.error('Update pandit profile status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating pandit profile status',
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
