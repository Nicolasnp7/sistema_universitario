export interface Inscripcion {
  id?: number;
  estudiante_id: number;
  profesor_asignatura_id: number;
  nota1?: number;
  nota2?: number;
  nota3?: number;
  nota_final?: number;
  fecha_inscripcion?: Date | string;
}

export interface InscripcionCreate {
  estudiante_id: number;
  profesor_asignatura_id: number;
}

export interface InscripcionUpdate {
  nota1?: number;
  nota2?: number;
  nota3?: number;
}

export interface InscripcionCompleta extends Inscripcion {
  estudiante_nombre: string;
  estudiante_apellido: string;
  estudiante_documento: string;
  estudiante_email: string;
  asignatura_nombre: string;
  asignatura_codigo: string;
  profesor_nombre: string;
  profesor_apellido: string;
  grupo: string;
  horario: string;
  semestre: string;
  creditos: number;
}

export interface ProfesorAsignatura {
  id?: number;
  profesor_id: number;
  asignatura_id: number;
  grupo: string;
  horario: string;
  semestre?: string;
  activo?: boolean;
  fecha_creacion?: Date | string;
}

export interface ProfesorAsignaturaCreate {
  profesor_id: number;
  asignatura_id: number;
  grupo: string;
  horario: string;
  semestre?: string;
}

export interface ProfesorAsignaturaUpdate {
  grupo?: string;
  horario?: string;
  semestre?: string;
}

export interface ProfesorAsignaturaCompleta extends ProfesorAsignatura {
  profesor_nombre: string;
  profesor_apellido: string;
  profesor_especialidad: string;
  asignatura_nombre: string;
  asignatura_codigo: string;
  asignatura_creditos: number;
  estudiantes_count: number;
}