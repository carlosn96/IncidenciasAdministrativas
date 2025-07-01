export type User = {
  name: string;
  email: string;
  avatarUrl: string;
  academicBackground: string;
  coordinatedCourses: string[];
};

export type ScheduleEntry = {
  day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
  startTime: string;
  endTime: string;
  startLocation: string;
  endLocation: string;
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
};

export type Period = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  includeSaturdays: boolean;
  laborDays: LaborDay[];
};
