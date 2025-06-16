export interface Asignatura {
  id?: number;
  nombre: string;
  codigo: string;
  creditos: number;
  descripcion?: string;
  activo?: boolean;
  fecha_creacion?: Date | string;
}

export interface AsignaturaCreate {
  nombre: string;
  codigo: string;
  creditos: number;
  descripcion?: string;
}

export interface AsignaturaUpdate {
  nombre?: string;
  codigo?: string;
  creditos?: number;
  descripcion?: string;
}

export interface AsignaturaConProfesores extends Asignatura {
  profesores?: {
    id: number;
    profesor_id: number;
    nombre: string;
    apellido: string;
    especialidad: string;
    grupo: string;
    horario: string;
    semestre: string;
    estudiantes_count: number;
  }[];
}