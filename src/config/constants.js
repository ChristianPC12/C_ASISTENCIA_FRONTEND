// Roles del sistema: ADMIN (acceso total), USUARIO (permisos por sección), SUPERADMIN (nacional)
export const ROLES = {
  ADMIN: 'ADMIN',
  USUARIO: 'USUARIO',
  SUPERADMIN: 'SUPERADMIN'
};

export const ETIQUETA_ROL = {
  ADMIN: 'Administrador',
  USUARIO: 'Usuario',
  SUPERADMIN: 'Superadministrador'
};

export const NIVELES_PERMISO = {
  LECTOR: 'LECTOR',
  EDITOR: 'EDITOR',
  INSTRUCTOR: 'INSTRUCTOR'
};

export const ETIQUETA_NIVEL = {
  LECTOR: 'Lector',
  EDITOR: 'Editor',
  INSTRUCTOR: 'Instructor'
};

// Debe coincidir con Permisos::SECCIONES del backend. Etiquetas iguales al menú lateral.
// INSTRUCTOR no se asigna desde Administrador: se crea en Estudios Bíblicos > Instructores.
export const SECCIONES_PERMISO = [
  {
    clave: 'asistencia',
    etiqueta: 'Nuevo Registro / Ver Registros',
    rutas: ['/registro', '/registros'],
    niveles: ['LECTOR', 'EDITOR'],
    nota: 'Lector solo ve los registros; Editor también registra.'
  },
  {
    clave: 'estadisticas',
    etiqueta: 'Estadísticas',
    rutas: ['/estadisticas'],
    niveles: ['LECTOR'],
    nota: 'Solo lectura: esta sección solo muestra datos, no hay nada que editar.'
  },
  {
    clave: 'comparaciones',
    etiqueta: 'Comparaciones',
    rutas: ['/comparaciones'],
    niveles: ['LECTOR'],
    nota: 'Solo lectura: esta sección solo muestra datos, no hay nada que editar.'
  },
  {
    clave: 'presentaciones',
    etiqueta: 'Presentaciones',
    rutas: ['/presentaciones'],
    niveles: ['LECTOR', 'EDITOR']
  },
  {
    clave: 'campanas',
    etiqueta: 'Campañas',
    rutas: ['/campanas'],
    niveles: ['LECTOR', 'EDITOR']
  },
  {
    clave: 'visitas',
    etiqueta: 'Visitas',
    rutas: ['/visitas'],
    niveles: ['LECTOR', 'EDITOR']
  },
  {
    clave: 'estudios_biblicos',
    etiqueta: 'Estudios Bíblicos',
    rutas: ['/estudios-biblicos'],
    niveles: ['LECTOR', 'EDITOR']
  },
  {
    clave: 'juntas_iglesia',
    etiqueta: 'Juntas de Iglesia',
    rutas: ['/juntas-iglesia'],
    niveles: ['LECTOR', 'EDITOR']
  }
];

export const MAX_USUARIOS_POR_CUENTA = 50;

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

// Meses
export const MES_OPCIONES = [
  { valor: 1, etiqueta: 'Enero' },
  { valor: 2, etiqueta: 'Febrero' },
  { valor: 3, etiqueta: 'Marzo' },
  { valor: 4, etiqueta: 'Abril' },
  { valor: 5, etiqueta: 'Mayo' },
  { valor: 6, etiqueta: 'Junio' },
  { valor: 7, etiqueta: 'Julio' },
  { valor: 8, etiqueta: 'Agosto' },
  { valor: 9, etiqueta: 'Septiembre' },
  { valor: 10, etiqueta: 'Octubre' },
  { valor: 11, etiqueta: 'Noviembre' },
  { valor: 12, etiqueta: 'Diciembre' }
];


// Dias de vigencia de contrasena que se pueden elegir para un usuario del sistema
export const VIGENCIAS_PASSWORD = [30, 60, 90];

// Formulario inicial de usuario
export const USUARIO_FORM_INICIAL = {
  id: null,
  nombre_completo: '',
  usuario: '',
  password: '',
  password_confirmacion: '',
  password_vigencia_dias: VIGENCIAS_PASSWORD[0],
  password_actualizada_en: '',
  es_admin: false,
  permisos: {},
  activo: true
};

// Limites de campos
export const LIMITES = {
  NOMBRE_COMPLETO_MIN: 3,
  NOMBRE_COMPLETO_MAX: 120,
  USUARIO_MIN: 3,
  USUARIO_MAX: 50,
  PASSWORD_MIN: 12,
  PASSWORD_MAX: 64
};

// Anio actual para filtros
export const ANIO_ACTUAL = new Date().getFullYear();

// Generar lista de anios para el selector (desde 2024 hasta anio actual + 1)
export const ANIO_OPCIONES = Array.from(
  { length: ANIO_ACTUAL - 2024 + 2 },
  (_, i) => 2024 + i
);
