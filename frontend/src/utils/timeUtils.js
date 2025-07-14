/**
 * Time formatting utilities
 */

/**
 * Convert 24-hour time format to 12-hour format with AM/PM
 * @param {string} time24 - Time in 24-hour format (HH:MM)
 * @returns {string} Time in 12-hour format (H:MM AM/PM)
 */
export const formatTimeTo12Hour = (time24) => {
  if (!time24 || typeof time24 !== 'string') {
    return '';
  }

  const [hours, minutes] = time24.split(':');
  const hour24 = parseInt(hours, 10);

  if (isNaN(hour24) || hour24 < 0 || hour24 > 23) {
    return time24; // Return original if invalid
  }

  let hour12 = hour24;
  let period = 'AM';

  if (hour24 === 0) {
    hour12 = 12; // Midnight
  } else if (hour24 === 12) {
    period = 'PM'; // Noon
  } else if (hour24 > 12) {
    hour12 = hour24 - 12;
    period = 'PM';
  }

  return `${hour12}:${minutes} ${period}`;
};

/**
 * Convert 12-hour time format to 24-hour format
 * @param {string} time12 - Time in 12-hour format (H:MM AM/PM)
 * @returns {string} Time in 24-hour format (HH:MM)
 */
export const formatTimeTo24Hour = (time12) => {
  if (!time12 || typeof time12 !== 'string') {
    return '';
  }

  const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match = time12.match(timeRegex);

  if (!match) {
    return time12; // Return original if it doesn't match expected format
  }

  let [, hours, minutes, period] = match;
  let hour24 = parseInt(hours, 10);

  if (period.toUpperCase() === 'AM') {
    if (hour24 === 12) {
      hour24 = 0; // Midnight
    }
  } else {
    // PM
    if (hour24 !== 12) {
      hour24 += 12;
    }
  }

  // Ensure two-digit format
  const formattedHour = hour24.toString().padStart(2, '0');

  return `${formattedHour}:${minutes}`;
};

/**
 * Format time range for display
 * @param {string} openTime - Opening time in 24-hour format
 * @param {string} closeTime - Closing time in 24-hour format
 * @param {boolean} isClosed - Whether the location is closed
 * @returns {string} Formatted time range
 */
export const formatTimeRange = (openTime, closeTime, isClosed = false) => {
  if (isClosed) {
    return 'Fechado';
  }

  if (!openTime || !closeTime) {
    return 'Não definido';
  }

  const openFormatted = formatTimeTo12Hour(openTime);
  const closeFormatted = formatTimeTo12Hour(closeTime);

  return `${openFormatted} - ${closeFormatted}`;
};

/**
 * Format operating hours for display
 * @param {Object} operatingHours - Operating hours object
 * @returns {Object} Formatted operating hours with display strings
 */
export const formatOperatingHours = (operatingHours) => {
  if (!operatingHours || typeof operatingHours !== 'object') {
    return {};
  }

  const dayNames = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo',
    holidays: 'Feriados',
  };

  const formatted = {};

  Object.keys(operatingHours).forEach((day) => {
    const dayHours = operatingHours[day];
    const dayLabel = dayNames[day] || day;

    if (dayHours && typeof dayHours === 'object') {
      const openTime = dayHours.open_time || dayHours.open || '';
      const closeTime = dayHours.close_time || dayHours.close || '';
      const isClosed = dayHours.is_closed || dayHours.closed || false;

      formatted[day] = {
        ...dayHours,
        dayLabel,
        displayText: formatTimeRange(openTime, closeTime, isClosed),
        openTimeFormatted: openTime ? formatTimeTo12Hour(openTime) : '',
        closeTimeFormatted: closeTime ? formatTimeTo12Hour(closeTime) : '',
      };
    }
  });

  return formatted;
};

/**
 * Validate time format (24-hour)
 * @param {string} time - Time string to validate
 * @returns {boolean} True if valid 24-hour format
 */
export const isValidTime24 = (time) => {
  if (!time || typeof time !== 'string') {
    return false;
  }

  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Get current time in 24-hour format
 * @returns {string} Current time in HH:MM format
 */
export const getCurrentTime24 = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Compare two times in 24-hour format
 * @param {string} time1 - First time
 * @param {string} time2 - Second time
 * @returns {number} -1 if time1 < time2, 0 if equal, 1 if time1 > time2
 */
export const compareTimes24 = (time1, time2) => {
  if (!isValidTime24(time1) || !isValidTime24(time2)) {
    return 0;
  }

  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);

  const totalMinutes1 = hours1 * 60 + minutes1;
  const totalMinutes2 = hours2 * 60 + minutes2;

  if (totalMinutes1 < totalMinutes2) return -1;
  if (totalMinutes1 > totalMinutes2) return 1;
  return 0;
};
