const BOOKING_DRAFT_KEY = 'maison_edem_booking_draft';

const tomorrowISO = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const emptyBookingDraft = {
  reservation_date: tomorrowISO(),
  start_time: '19:00',
  guest_count: 2,
  area: '',
  special_notes: '',
  table_id: null,
};

export const getBookingDraft = () => {
  const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
  if (!raw) return emptyBookingDraft;

  try {
    return { ...emptyBookingDraft, ...JSON.parse(raw) };
  } catch {
    sessionStorage.removeItem(BOOKING_DRAFT_KEY);
    return emptyBookingDraft;
  }
};

export const saveBookingDraft = (draft) => {
  sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
};

export const clearBookingDraft = () => {
  sessionStorage.removeItem(BOOKING_DRAFT_KEY);
};
