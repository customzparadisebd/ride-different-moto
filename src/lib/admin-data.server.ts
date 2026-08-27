// ============================================================
// ADMIN DASHBOARD DATE HELPERS
// Purpose: Date-window math used by dashboard server functions.
// Note: Server-fn modules must stay thin wrappers — helpers kept
//       here so the serverFn split transform cannot drop them.
// ============================================================
export const startOfDayISO = (daysAgo: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

/**
 * Calculates Today's Sales based on successful SteadFast submissions
 * in the Bangladesh Standard Time (UTC+6) window of 8:00 AM to 8:00 PM.
 */
export function getTodaysSalesWindow() {
  // Current UTC time
  const now = new Date();
  
  // Bangladesh is UTC+6
  const offset = 6 * 60; // 6 hours in minutes
  const bdNow = new Date(now.getTime() + offset * 60000);
  
  // Create start (8:00 AM BD) and end (8:00 PM BD) for "today" in BD time
  const bdStart = new Date(bdNow);
  bdStart.setUTCHours(8, 0, 0, 0);
  
  const bdEnd = new Date(bdNow);
  bdEnd.setUTCHours(20, 0, 0, 0);

  // Convert back to UTC for querying the database
  const utcStart = new Date(bdStart.getTime() - offset * 60000);
  const utcEnd = new Date(bdEnd.getTime() - offset * 60000);
  
  return {
    start: utcStart.toISOString(),
    end: utcEnd.toISOString(),
  };
}

