export interface Profesor {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  especialidad?: string;
  documento: string;
  activo?: boolean;
  fecha_creacion?: Date | string;
}

export interface ProfesorCreate {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  especialidad?: string;
  documento: string;
}

export interface ProfesorUpdate {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  especialidad?: string;
  documento?: string;
}

export interface ProfesorConAsignaturas extends Profesor {
  asignaturas?: {
    id: number;
    asignatura_id: number;
    nombre: string;
    codigo: string;
    grupo: string;
    horario: string;
    semestre: string;
    estudiantes_count: number;
  }[];
}