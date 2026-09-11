import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { todayISO } from '../../lib/format';

const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const toISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const initialCalendar = (selectedDate) => {
  const [year, month] = selectedDate.split('-').map(Number);
  return { month: month - 1, year };
};

export function StaffCalendar({ selectedDate, bookingDates, onSelect }) {
  const [view, setView] = useState(() => initialCalendar(selectedDate));

  const days = useMemo(() => {
    const firstDay = new Date(view.year, view.month, 1);
    const mondayIndex = (firstDay.getDay() + 6) % 7;
    const startDate = new Date(view.year, view.month, 1 - mondayIndex);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const iso = toISO(date);
      return {
        iso,
        number: date.getDate(),
        outside: date.getMonth() !== view.month,
        today: iso === todayISO(),
        selected: iso === selectedDate,
        hasBooking: bookingDates.has(iso),
      };
    });
  }, [bookingDates, selectedDate, view]);

  const moveMonth = (offset) => {
    const next = new Date(view.year, view.month + offset, 1);
    setView({ month: next.getMonth(), year: next.getFullYear() });
  };

  return (
    <div className="staff-calendar">
      <div className="staff-calendar-head">
        <button type="button" onClick={() => moveMonth(-1)} aria-label="Tháng trước">
          <ChevronLeft size={18} />
        </button>
        <strong>{MONTHS[view.month]} {view.year}</strong>
        <button type="button" onClick={() => moveMonth(1)} aria-label="Tháng sau">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="staff-weekdays">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="staff-calendar-grid">
        {days.map((day) => (
          <button
            className={[
              'staff-calendar-day',
              day.outside ? 'outside' : '',
              day.today ? 'today' : '',
              day.selected ? 'selected' : '',
              day.hasBooking ? 'has-booking' : '',
            ].filter(Boolean).join(' ')}
            key={day.iso}
            type="button"
            onClick={() => onSelect(day.iso)}
          >
            {day.number}
          </button>
        ))}
      </div>
      <div className="staff-calendar-footer">
        <span>● Có đơn đặt bàn</span>
        <button type="button" onClick={() => onSelect(todayISO())}>
          Hôm nay
        </button>
      </div>
    </div>
  );
}
