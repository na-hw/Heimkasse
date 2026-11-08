"use client";

import { DayPicker, type DayPickerProps } from "react-day-picker";
import { DayPicker as JalaliDayPicker, faIR as jalaliLocale } from "react-day-picker/persian";
import { useCalendarConfig } from "./useCalendarConfig";
import styles from "./Calendar.module.css";

/**
 * Month grid with full keyboard support. Uses the Jalali calendar when the
 * Persian UI is set to Jalali display; values are always Gregorian Dates.
 */
export function Calendar(props: DayPickerProps) {
  const config = useCalendarConfig();
  const shared = {
    dir: config.dir,
    numerals: config.numerals,
    weekStartsOn: config.weekStartsOn,
    className: styles.calendar,
    showOutsideDays: true,
  };
  const { locale: _ignored, ...rest } = props;
  if (config.jalali) return <JalaliDayPicker {...shared} {...rest} locale={jalaliLocale} />;
  return <DayPicker {...shared} {...rest} locale={config.locale} />;
}
