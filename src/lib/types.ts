
export type User = {
  name: string;
  email: string;
  avatarUrl: string;
  academicBackground: string;
  coordinatedCourses: string[];
};

export type DaySchedule = {
  day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
  startTime: string;
  endTime: string;
  startLocation: string;
  endLocation: string;
};

export type Schedule = {
  id: string;
  name: string;
  entries: DaySchedule[];
};

export type Location = {
  id: string;
  name: string;
  campus: string;
  address: string;
};

export type Incident = {
  time: string;
  location: string;
};

export type LaborDay = {
  date: string; // "YYYY-MM-DD"
  entry?: Incident;
  exit?: Incident;
  projectedEntry?: Incident;
  projectedExit?: Incident;
};

export type Period = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  laborDays: LaborDay[];
  totalDurationMinutes: number; // Expected duration based on 8 hours per working day
  includeSaturdays: boolean;
};
