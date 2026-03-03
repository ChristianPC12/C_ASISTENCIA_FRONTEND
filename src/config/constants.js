// Roles del sistema
export const ROLES = {
  ADMIN: 'ADMIN',
  SECRETARIO: 'SECRETARIO'
};

export const ROL_OPCIONES = [
  { valor: 1, etiqueta: 'Administrador' },
  { valor: 2, etiqueta: 'Secretario/a' }
];

// Cultos (se cargan del backend, pero utiles para referencia)
export const CULTO_CODIGOS = {
  SABADO: 'SABADO',
  DOMINGO: 'DOMINGO',
  MIERCOLES: 'MIERCOLES'
};

// Trimestres
export const TRIMESTRE_OPCIONES = [
  { valor: 1, etiqueta: '1er Trimestre (Ene-Mar)' },
  { valor: 2, etiqueta: '2do Trimestre (Abr-Jun)' },
  { valor: 3, etiqueta: '3er Trimestre (Jul-Sep)' },
  { valor: 4, etiqueta: '4to Trimestre (Oct-Dic)' }
];

// Formulario inicial de asistencia
export const ASISTENCIA_FORM_INICIAL = {
  culto_id: '',
  fecha: '',
  llegaron_antes_hora: 0,
  llegaron_despues_hora: 0,
  ninos: 0,
  jovenes: 0,
  total_asistentes: 0,
  proc_barrio: 0,
  proc_guayabo: 0,
  visitas_barrio: 0,
  nombres_visitas_barrio: '',
  visitas_guayabo: 0,
  nombres_visitas_guayabo: '',
  retiros_antes_terminar: 0,
  se_quedaron_todo: 0,
  observaciones: ''
};

// Formulario inicial de usuario
export const USUARIO_FORM_INICIAL = {
  id: null,
  nombre_completo: '',
  usuario: '',
  password: '',
  rol_id: 2,
  activo: true
};

// Limites de campos
export const LIMITES = {
  NOMBRE_COMPLETO_MIN: 3,
  NOMBRE_COMPLETO_MAX: 120,
  USUARIO_MIN: 3,
  USUARIO_MAX: 50,
  PASSWORD_MIN: 6
};

// Anio actual para filtros
export const ANIO_ACTUAL = new Date().getFullYear();

// Generar lista de anios para el selector (desde 2024 hasta anio actual + 1)
export const ANIO_OPCIONES = Array.from(
  { length: ANIO_ACTUAL - 2024 + 2 },
  (_, i) => 2024 + i
);
