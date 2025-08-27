// Utility functions for formatting and calculations
export const currency = (n) => "₹ " + (n ?? 0).toFixed(2);

export const uid = () => Math.random().toString(36).slice(2, 10);

export const todayISO = () => new Date().toISOString();

export const parseNum = (v) => Number.isFinite(+v) ? +v : 0;