export interface Estudiante {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  fecha_nacimiento?: Date | string;
  documento: string;
  activo?: boolean;
  fecha_creacion?: Date | string;
}

export interface EstudianteCreate {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  fecha_nacimiento?: string;
  documento: string;
}

export interface EstudianteUpdate {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  documento?: string;
}

export interface EstudianteConAsignaturas extends Estudiante {
  asignaturas?: {
    id: number;
    nombre: string;
    codigo: string;
    profesor: string;
    grupo: string;
    nota1?: number;
    nota2?: number;
    nota3?: number;
    nota_final?: number;
  }[];
}