"use client";

import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { CalendarDays } from "lucide-react";

interface PersianDatePickerProps {
  value: string; // ISO gregorian string e.g. "2026-10-07"
  onChange: (isoDate: string) => void;
  placeholder?: string;
  className?: string;
}

export function PersianDatePickerInput({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  className = "",
}: PersianDatePickerProps) {
  // Convert ISO string → DateObject for library
  const dateValue = value
    ? new DateObject({ date: new Date(value), calendar: persian, locale: persian_fa })
    : undefined;

  const handleChange = (date: DateObject | null) => {
    if (!date) {
      onChange("");
      return;
    }
    // Convert back to ISO gregorian string
    const gregorian = date.convert(undefined); // undefined → converts to Gregorian
    const iso = `${gregorian.year}-${String(gregorian.month.number).padStart(2, "0")}-${String(gregorian.day).padStart(2, "0")}`;
    onChange(iso);
  };

  return (
    <div className={`relative ${className}`}>
      <DatePicker
        value={dateValue}
        onChange={handleChange as (date: DateObject | DateObject[] | null) => void}
        calendar={persian}
        locale={persian_fa}
        calendarPosition="bottom-right"
        zIndex={9999}
        render={(value: string, openCalendar: () => void) => (
          <button
            type="button"
            onClick={openCalendar}
            className={`
              mt-2 flex items-center justify-between w-full h-9 px-3 rounded-md border text-sm
              bg-background text-foreground border-input
              hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/50
              transition-colors duration-200 cursor-pointer
              ${!value ? "text-muted-foreground" : ""}
            `}
          >
            <span className="truncate">{value || placeholder}</span>
            <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        )}
        mapDays={({ date }) => {
          const isWeekend = date.weekDay.index === 6; // جمعه
          return {
            className: isWeekend ? "!text-rose-500 font-semibold" : "",
          };
        }}
        containerClassName="w-full"
        style={{ width: "100%" }}
      />
    </div>
  );
}
