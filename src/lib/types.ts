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

export type LaborEvent = {
  id: string;
  date: string;
  time: string;
  location: string;
  type: 'Entrada' | 'Salida';
};
