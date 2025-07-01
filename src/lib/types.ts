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
  location: string;
};

export type Location = {
  id: string;
  name: string;
  campus: string;
  address: string;
};

export type LaborEvent = {
  id: string;
  date: string;
  clockInTime: string;
  clockOutTime: string | null;
  location: string;
  status: 'En Progreso' | 'Completado';
};
