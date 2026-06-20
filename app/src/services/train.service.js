const { query } = require('../config/db');

/**
 * Search for trains running between two stations (identified by their codes)
 * on a given date. Returns train details with human-readable station names
 * and per-class seat availability for that date.
 *
 * @param {{ source: string, destination: string, date: string }} params
 *   source      — station_code of the origin station  (e.g. 'NDLS')
 *   destination — station_code of the arrival station (e.g. 'HWH')
 *   date        — journey date in YYYY-MM-DD format
 */
const searchTrains = async ({ source, destination, date }) => {
  try {
    const srcName = source.trim();
    const destName = destination.trim();

    // Main search query: join trains → train_inventory.
    // Only returns trains that have inventory loaded for the requested date.
    const result = await query(
      `SELECT
          t.id,
          t.train_number,
          t.train_name,
          t.source_station AS source_code,
          t.source_station AS source_name,
          t.destination_station AS destination_code,
          t.destination_station AS destination_name,
          -- Aggregate seat availability per class for the requested date
          JSON_AGG(
              JSON_BUILD_OBJECT(
                  'class',          ti.travel_class,
                  'totalSeats',     ti.total_seats,
                  'availableSeats', ti.available_seats
              )
              ORDER BY ti.travel_class
          ) AS availability
       FROM trains t
       JOIN train_inventory ti
           ON  ti.train_id    = t.id
           AND ti.journey_date = $3
       WHERE
           t.source_station ILIKE $1
           AND t.destination_station ILIKE $2
       GROUP BY
           t.id, t.train_number, t.train_name,
           t.source_station, t.destination_station
       ORDER BY t.train_number`,
      [srcName, destName, date]
    );

    // Shape each row into the documented response format
    const trains = result.rows.map((row) => ({
      id:          row.id,
      trainNumber: row.train_number,
      trainName:   row.train_name,
      source: {
        code: row.source_code,
        name: row.source_name,
      },
      destination: {
        code: row.destination_code,
        name: row.destination_name,
      },
      availability: row.availability,
    }));

    return {
      success: true,
      data: {
        source: {
          code: srcName,
          name: srcName,
        },
        destination: {
          code: destName,
          name: destName,
        },
        date,
        trains,
      },
    };
  } catch (err) {
    console.error('[TrainService] searchTrains error:', err.message);
    return {
      success: false,
      statusCode: 500,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};

/**
 * Fetch seat availability for a specific train, journey date, and travel class.
 * Read-only — does not reserve or modify any seats.
 *
 * @param {{ trainId: number, date: string, travelClass: string }} params
 */
const getAvailability = async ({ trainId, date, travelClass }) => {
  try {
    const trainResult = await query(
      `SELECT
          t.id,
          t.train_number,
          t.train_name,
          t.source_station AS source_code,
          t.source_station AS source_name,
          t.destination_station AS destination_code,
          t.destination_station AS destination_name
       FROM trains t
       WHERE t.id = $1`,
      [trainId]
    );

    if (trainResult.rows.length === 0) {
      return {
        success: false,
        statusCode: 404,
        message: `Train with id ${trainId} not found.`,
      };
    }

    const train = trainResult.rows[0];

    // Fetch the inventory record for the requested date and class
    const inventoryResult = await query(
      `SELECT
          ti.total_seats,
          ti.available_seats,
          ti.journey_date,
          ti.travel_class
       FROM train_inventory ti
       WHERE
           ti.train_id                    = $1
           AND ti.journey_date            = $2
           AND LOWER(ti.travel_class)     = LOWER($3)`,
      [trainId, date, travelClass]
    );

    if (inventoryResult.rows.length === 0) {
      return {
        success: false,
        statusCode: 404,
        message: `No inventory found for train ${trainId} on ${date} in class "${travelClass}".`,
      };
    }

    const inv = inventoryResult.rows[0];

    return {
      success: true,
      data: {
        trainId:     train.id,
        trainNumber: train.train_number,
        trainName:   train.train_name,
        source: {
          code: train.source_code,
          name: train.source_name,
        },
        destination: {
          code: train.destination_code,
          name: train.destination_name,
        },
        date:           inv.journey_date,
        class:          inv.travel_class,
        totalSeats:     inv.total_seats,
        availableSeats: inv.available_seats,
      },
    };
  } catch (err) {
    console.error('[TrainService] getAvailability error:', err.message);
    return {
      success: false,
      statusCode: 500,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};

module.exports = { searchTrains, getAvailability };
