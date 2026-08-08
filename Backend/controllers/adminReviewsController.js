const pool = require('../config/db');

function isPlatformAdmin(user) {
  return user?.role === 'admin' || user?.role === 'superadmin';
}

function mapReviewRow(row) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    customerId: row.customer_id,
    customerName: row.customer_name?.trim() || 'Customer',
    customerProfileImage: row.customer_profile_image || null,
    serviceName: row.service_name,
    bookingDate: row.booking_date,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: row.created_at,
  };
}

exports.listPanditReviewSummaries = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view pandit reviews',
      });
    }

    const [rows] = await pool.query(
      `SELECT pp.id AS profile_id,
              pp.name,
              pp.profile_image,
              u.mobile,
              u.profile_image AS user_profile_image,
              COALESCE(pp.rating, 0) AS rating,
              COALESCE(pp.total_reviews, 0) AS total_reviews,
              (
                SELECT COUNT(*)
                FROM booking_reviews br
                WHERE br.pandit_profile_id = pp.id
              ) AS review_count,
              (
                SELECT br.comment
                FROM booking_reviews br
                WHERE br.pandit_profile_id = pp.id
                ORDER BY br.created_at DESC
                LIMIT 1
              ) AS latest_comment,
              (
                SELECT br.rating
                FROM booking_reviews br
                WHERE br.pandit_profile_id = pp.id
                ORDER BY br.created_at DESC
                LIMIT 1
              ) AS latest_rating,
              (
                SELECT br.created_at
                FROM booking_reviews br
                WHERE br.pandit_profile_id = pp.id
                ORDER BY br.created_at DESC
                LIMIT 1
              ) AS latest_review_at
       FROM pandit_profiles pp
       INNER JOIN users u ON u.id = pp.user_id
       WHERE u.status != 'blocked'
       ORDER BY review_count DESC, pp.rating DESC, pp.name ASC`,
    );

    const pandits = rows.map((row) => ({
      profileId: row.profile_id,
      name: row.name,
      mobile: row.mobile,
      profileImage: row.profile_image || row.user_profile_image,
      rating: Number(row.rating ?? 0),
      totalReviews: Number(row.total_reviews ?? 0),
      reviewCount: Number(row.review_count ?? 0),
      latestReview: row.latest_comment
        ? {
            rating: Number(row.latest_rating ?? 0),
            comment: row.latest_comment,
            createdAt: row.latest_review_at,
          }
        : null,
    }));

    const totalReviews = pandits.reduce((sum, pandit) => sum + pandit.reviewCount, 0);
    const ratedPandits = pandits.filter((pandit) => pandit.reviewCount > 0);
    const averageRating =
      ratedPandits.length > 0
        ? Number(
            (
              ratedPandits.reduce((sum, pandit) => sum + pandit.rating, 0) / ratedPandits.length
            ).toFixed(1),
          )
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalReviews,
        averageRating,
        pandits,
      },
    });
  } catch (error) {
    console.error('List pandit review summaries error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pandit review summaries',
    });
  }
};

exports.getPanditReviews = async (req, res) => {
  try {
    if (!isPlatformAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view pandit reviews',
      });
    }

    const profileId = Number(req.params.profileId);
    if (!Number.isInteger(profileId) || profileId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pandit profile id',
      });
    }

    const [[profileRows], [reviewRows]] = await Promise.all([
      pool.query(
        `SELECT pp.id,
                pp.name,
                pp.profile_image,
                pp.rating,
                pp.total_reviews,
                u.mobile,
                u.profile_image AS user_profile_image
         FROM pandit_profiles pp
         INNER JOIN users u ON u.id = pp.user_id
         WHERE pp.id = ?
         LIMIT 1`,
        [profileId],
      ),
      pool.query(
        `SELECT br.*,
                b.service_name,
                b.booking_date,
                TRIM(CONCAT(COALESCE(cp.first_name, ''), ' ', COALESCE(cp.last_name, ''))) AS customer_name,
                u.profile_image AS customer_profile_image
         FROM booking_reviews br
         INNER JOIN bookings b ON b.id = br.booking_id
         LEFT JOIN customer_profiles cp ON cp.customer_id = br.customer_id
         LEFT JOIN users u ON u.id = br.customer_id
         WHERE br.pandit_profile_id = ?
         ORDER BY br.created_at DESC
         LIMIT 200`,
        [profileId],
      ),
    ]);

    if (profileRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pandit profile not found',
      });
    }

    const profile = profileRows[0];
    const reviews = reviewRows.map(mapReviewRow);
    const computedRating =
      reviews.length > 0
        ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
        : Number(profile.rating ?? 0);

    return res.status(200).json({
      success: true,
      data: {
        profileId: profile.id,
        name: profile.name,
        mobile: profile.mobile,
        profileImage: profile.profile_image || profile.user_profile_image,
        rating: computedRating,
        totalReviews: reviews.length,
        reviews,
      },
    });
  } catch (error) {
    console.error('Get pandit reviews error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pandit reviews',
    });
  }
};
