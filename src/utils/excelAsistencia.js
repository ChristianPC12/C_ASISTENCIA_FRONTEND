import {
  CATEGORIAS_METRICA_ORDEN,
  ETIQUETAS_SECCION,
  inferirCategoriaPorClave,
  tipoMetricaPorClave
} from './metricasConfig';

const COLOR = {
  azul: 'FF003366',
  dorado: 'FFC5A028',
  doradoOscuro: 'FFA88620',
  fondo: 'FFF4F6F9',
  texto: 'FF2D3436',
  textoSec: 'FF636E72',
  borde: 'FFDEE2E6',
  blanco: 'FFFFFFFF'
};

const FUENTE = 'Calibri';
const CLAVE_TOTAL = 'total_asistentes';
const MAX_TARJETAS = 5;

const relleno = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const lado = (argb, style = 'thin') => ({ style, color: { argb } });

const esVacio = (valor) => valor === null || valor === undefined || valor === '';
const aNumero = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
};
const esCero = (valor) => typeof valor === 'number' ? valor === 0 : /^0+(?:[.,]0+)?$/.test(String(valor ?? '').trim());
const letraColumna = (n) => {
  let texto = '';
  let resto = n;
  while (resto > 0) {
    const mod = (resto - 1) % 26;
    texto = String.fromCharCode(65 + mod) + texto;
    resto = Math.floor((resto - 1) / 26);
  }
  return texto;
};

function fechaIsoADate(iso) {
  const [anio, mes, dia] = String(iso || '').split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia);
}

function fechaLegible(iso) {
  const [anio, mes, dia] = String(iso || '').split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : String(iso || '');
}

function hoyLegible() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function crearLibro(Workbook) {
  const libro = new Workbook();
  libro.creator = 'Sistema C_ASISTENCIA';
  libro.created = new Date();
  return libro;
}

async function cargarWorkbook() {
  const modulo = await import('exceljs');
  return modulo.Workbook || modulo.default?.Workbook;
}

function categoriaDe(clave, configuradas) {
  const config = configuradas.find((item) => item.clave === clave);
  return config?.seccion || config?.categoria || inferirCategoriaPorClave(clave);
}

function ordenarClaves(claves, configuradas) {
  const ordenCategoria = (clave) => {
    const indice = CATEGORIAS_METRICA_ORDEN.indexOf(categoriaDe(clave, configuradas));
    return indice < 0 ? CATEGORIAS_METRICA_ORDEN.length : indice;
  };
  const ordenConfig = (clave) => {
    const indice = configuradas.findIndex((item) => item.clave === clave);
    return indice < 0 ? configuradas.length : indice;
  };
  return [...claves].sort((a, b) => (ordenCategoria(a) - ordenCategoria(b)) || (ordenConfig(a) - ordenConfig(b)));
}

function dividirColumnas(totalColumnas, cantidad) {
  const base = Math.floor(totalColumnas / cantidad);
  const extra = totalColumnas % cantidad;
  let inicio = 1;
  return Array.from({ length: cantidad }, (_, i) => {
    const ancho = base + (i < extra ? 1 : 0);
    const tramo = { desde: inicio, hasta: inicio + ancho - 1 };
    inicio += ancho;
    return tramo;
  });
}

// Tarjeta limpia: fondo suave, filete dorado arriba, etiqueta gris, cifra azul grande.
function dibujarTarjetas(hoja, filaInicial, tramos, tarjetas) {
  const alturas = [18, 36, 18];
  alturas.forEach((alto, i) => { hoja.getRow(filaInicial + i).height = alto; });

  tarjetas.forEach((tarjeta, idx) => {
    const { desde, hasta } = tramos[idx];
    [
      [filaInicial, tarjeta.etiqueta, { size: 9, bold: true, color: { argb: COLOR.textoSec } }],
      [filaInicial + 1, tarjeta.valor, { size: 24, bold: true, color: { argb: COLOR.azul } }],
      [filaInicial + 2, tarjeta.detalle || '', { size: 9, color: { argb: COLOR.textoSec } }]
    ].forEach(([fila, valor, fuente], i) => {
      if (hasta > desde) hoja.mergeCells(fila, desde, fila, hasta);
      const celda = hoja.getCell(fila, desde);
      celda.value = valor;
      celda.font = { name: FUENTE, ...fuente };
      celda.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      for (let col = desde; col <= hasta; col += 1) {
        const parte = hoja.getCell(fila, col);
        parte.fill = relleno(COLOR.fondo);
        parte.border = {
          top: i === 0 ? lado(COLOR.dorado, 'medium') : undefined,
          left: col === desde ? lado(COLOR.blanco, 'thick') : undefined,
          right: col === hasta ? lado(COLOR.blanco, 'thick') : undefined
        };
      }
    });
  });
}

function etiquetaDe(clave, mapaEtiquetas) {
  return mapaEtiquetas?.[clave] || clave;
}

/**
 * Informe de varios registros (hoja "Informe").
 * registros: lista del backend. configuradas: metricas del setup. mapaEtiquetas: clave -> etiqueta.
 */
export async function construirExcelInforme({
  registros,
  configuradas = [],
  mapaEtiquetas = {},
  organizacion = '',
  filtrosTexto = ''
}) {
  const Workbook = await cargarWorkbook();
  const libro = crearLibro(Workbook);

  const clavesPresentes = new Set();
  registros.forEach((registro) => {
    Object.entries(registro?.metricas || {}).forEach(([clave, valor]) => {
      if (clave === CLAVE_TOTAL || esVacio(valor)) return;
      if (typeof valor === 'string' && valor.trim() === '') return;
      if (esCero(valor)) return;
      clavesPresentes.add(clave);
    });
  });

  const columnas = [
    { clave: 'fecha', titulo: 'Fecha', ancho: 12, tipo: 'fecha' },
    { clave: 'culto', titulo: 'Culto', ancho: 18, tipo: 'texto' },
    { clave: CLAVE_TOTAL, titulo: 'Total', ancho: 10, tipo: 'numero' },
    ...ordenarClaves(clavesPresentes, configuradas).map((clave) => {
      const titulo = etiquetaDe(clave, mapaEtiquetas);
      const tipo = tipoMetricaPorClave(clave);
      const ancho = tipo === 'numero'
        ? Math.min(Math.max(Math.ceil(titulo.length / 2.2) + 3, 11), 16)
        : (clave === 'observaciones' ? 36 : 28);
      return { clave, titulo, ancho, tipo };
    })
  ];
  const total = columnas.length;
  const ultima = letraColumna(total);

  const filaEncabezado = 9;
  const hoja = libro.addWorksheet('Informe', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: filaEncabezado, showGridLines: false }]
  });
  columnas.forEach((col, i) => { hoja.getColumn(i + 1).width = col.ancho; });

  const valorDe = (registro, col) => {
    if (col.clave === 'fecha') return fechaIsoADate(registro.fecha);
    if (col.clave === 'culto') return registro.culto_nombre || registro.culto_codigo || '-';
    if (col.clave === CLAVE_TOTAL) return aNumero(registro.total_asistentes);
    const bruto = registro?.metricas?.[col.clave];
    if (esVacio(bruto)) return null;
    return col.tipo === 'numero' ? aNumero(bruto) : String(bruto);
  };

  hoja.mergeCells(`A1:${ultima}1`);
  hoja.getCell('A1').value = 'Informe de asistencia';
  hoja.getCell('A1').font = { name: FUENTE, size: 20, bold: true, color: { argb: COLOR.azul } };
  hoja.getRow(1).height = 32;
  hoja.mergeCells(`A2:${ultima}2`);
  hoja.getCell('A2').value = organizacion;
  hoja.getCell('A2').font = { name: FUENTE, size: 11, color: { argb: COLOR.textoSec } };
  hoja.mergeCells(`A3:${ultima}3`);
  hoja.getCell('A3').value = [filtrosTexto, `Generado el ${hoyLegible()}`].filter(Boolean).join('   ·   ');
  hoja.getCell('A3').font = { name: FUENTE, size: 10, color: { argb: COLOR.textoSec } };
  hoja.getRow(4).height = 10;

  const totales = registros.map((r) => aNumero(r.total_asistentes));
  const suma = totales.reduce((a, b) => a + b, 0);
  const promedio = totales.length ? Math.round((suma / totales.length) * 10) / 10 : 0;
  const mayor = registros.reduce((a, r) => (aNumero(r.total_asistentes) > aNumero(a.total_asistentes) ? r : a), registros[0]);
  const menor = registros.reduce((a, r) => (aNumero(r.total_asistentes) < aNumero(a.total_asistentes) ? r : a), registros[0]);
  const detalleRegistro = (r) => `${r.culto_nombre || r.culto_codigo || ''} · ${fechaLegible(r.fecha)}`;
  const tarjetas = [
    { etiqueta: 'REGISTROS', valor: registros.length, detalle: 'en este informe' },
    { etiqueta: 'ASISTENCIA TOTAL', valor: suma, detalle: 'suma de asistentes' },
    { etiqueta: 'PROMEDIO', valor: promedio, detalle: 'asistentes por culto' },
    { etiqueta: 'MÁXIMO', valor: aNumero(mayor.total_asistentes), detalle: detalleRegistro(mayor) },
    { etiqueta: 'MÍNIMO', valor: aNumero(menor.total_asistentes), detalle: detalleRegistro(menor) }
  ].slice(0, Math.min(MAX_TARJETAS, total));
  dibujarTarjetas(hoja, 5, dividirColumnas(total, tarjetas.length), tarjetas);
  hoja.getRow(8).height = 14;

  const encabezado = hoja.getRow(filaEncabezado);
  encabezado.height = 46;
  columnas.forEach((col, i) => {
    const celda = encabezado.getCell(i + 1);
    celda.value = col.titulo;
    celda.font = { name: FUENTE, size: 10.5, bold: true, color: { argb: COLOR.azul } };
    celda.alignment = {
      horizontal: col.tipo === 'numero' ? 'right' : 'left',
      vertical: 'bottom',
      wrapText: true,
      indent: col.tipo === 'texto' && i > 1 ? 1 : 0
    };
    celda.border = { bottom: lado(COLOR.dorado, 'medium') };
  });

  registros.forEach((registro, idx) => {
    const fila = hoja.getRow(filaEncabezado + 1 + idx);
    fila.height = 26;
    columnas.forEach((col, i) => {
      const celda = fila.getCell(i + 1);
      celda.value = valorDe(registro, col);
      if (col.tipo === 'fecha') celda.numFmt = 'dd/mm/yyyy';
      celda.font = {
        name: FUENTE,
        size: 11,
        bold: col.clave === CLAVE_TOTAL,
        color: { argb: col.clave === CLAVE_TOTAL ? COLOR.azul : COLOR.texto }
      };
      celda.alignment = {
        horizontal: col.tipo === 'numero' ? 'right' : 'left',
        vertical: 'middle',
        wrapText: col.tipo === 'texto' && i > 1,
        indent: col.tipo === 'texto' && i > 1 ? 1 : 0
      };
      celda.border = { bottom: lado(COLOR.borde, 'hair') };
    });
  });

  const ultimaFilaDatos = filaEncabezado + registros.length;
  const filaTotal = hoja.getRow(ultimaFilaDatos + 1);
  filaTotal.height = 28;
  const filaPromedio = hoja.getRow(ultimaFilaDatos + 2);
  filaPromedio.height = 24;
  columnas.forEach((col, i) => {
    const celdaTotal = filaTotal.getCell(i + 1);
    const celdaPromedio = filaPromedio.getCell(i + 1);
    if (i === 0) {
      celdaTotal.value = 'Total';
      celdaPromedio.value = 'Promedio por culto';
    }
    if (col.tipo === 'numero') {
      const valores = registros.map((r) => valorDe(r, col)).filter((v) => v !== null);
      const sumaCol = valores.reduce((a, b) => a + b, 0);
      celdaTotal.value = sumaCol;
      celdaPromedio.value = registros.length ? Math.round((sumaCol / registros.length) * 10) / 10 : 0;
      celdaPromedio.numFmt = '0.0';
    }
    celdaTotal.font = { name: FUENTE, size: 11.5, bold: true, color: { argb: COLOR.azul } };
    celdaTotal.alignment = { horizontal: col.tipo === 'numero' ? 'right' : 'left', vertical: 'middle' };
    celdaTotal.border = { top: lado(COLOR.azul, 'medium') };
    celdaPromedio.font = { name: FUENTE, size: 10.5, italic: true, color: { argb: COLOR.textoSec } };
    celdaPromedio.alignment = { horizontal: col.tipo === 'numero' ? 'right' : 'left', vertical: 'middle' };
  });

  hoja.autoFilter = { from: { row: filaEncabezado, column: 1 }, to: { row: ultimaFilaDatos, column: total } };
  hoja.pageSetup = {
    orientation: 'landscape',
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: `${filaEncabezado}:${filaEncabezado}`
  };
  hoja.headerFooter.oddFooter = `&L&8C_ASISTENCIA&C&8Página &P de &N&R&8Generado ${hoyLegible()}`;

  return libro.xlsx.writeBuffer();
}

/**
 * Detalle de un registro (hoja "Detalle"): tarjetas arriba y secciones por categoria.
 */
export async function construirExcelDetalle({
  registro,
  configuradas = [],
  mapaEtiquetas = {},
  organizacion = ''
}) {
  const Workbook = await cargarWorkbook();
  const libro = crearLibro(Workbook);
  const hoja = libro.addWorksheet('Detalle', { views: [{ showGridLines: false }] });
  [18, 18, 18, 18].forEach((ancho, i) => { hoja.getColumn(i + 1).width = ancho; });

  const nombreCulto = registro.culto_nombre || registro.culto_codigo || '-';
  const metricas = registro.metricas || {};
  const total = aNumero(registro.total_asistentes);

  hoja.mergeCells('A1:D1');
  hoja.getCell('A1').value = 'Detalle del registro';
  hoja.getCell('A1').font = { name: FUENTE, size: 20, bold: true, color: { argb: COLOR.azul } };
  hoja.getRow(1).height = 32;
  hoja.mergeCells('A2:D2');
  hoja.getCell('A2').value = `${nombreCulto}  ·  ${fechaLegible(registro.fecha)}`;
  hoja.getCell('A2').font = { name: FUENTE, size: 12, bold: true, color: { argb: COLOR.doradoOscuro } };
  hoja.mergeCells('A3:D3');
  hoja.getCell('A3').value = organizacion;
  hoja.getCell('A3').font = { name: FUENTE, size: 10, color: { argb: COLOR.textoSec } };
  hoja.getRow(4).height = 10;

  const tarjetas = [{ etiqueta: 'TOTAL DE ASISTENTES', valor: total, detalle: 'personas en el culto' }];
  const clavesVisitas = Object.keys(metricas).filter((c) => c.startsWith('visitas_') && !esVacio(metricas[c]));
  if (clavesVisitas.length > 0) {
    const totalVisitas = clavesVisitas.reduce((acc, c) => acc + aNumero(metricas[c]), 0);
    tarjetas.push({ etiqueta: 'VISITAS', valor: totalVisitas, detalle: 'personas visitantes' });
  } else if (!esVacio(metricas.se_quedaron_todo) && total > 0) {
    tarjetas.push({
      etiqueta: 'SE QUEDARON',
      valor: `${Math.round((aNumero(metricas.se_quedaron_todo) / total) * 100)}%`,
      detalle: 'hasta el final'
    });
  }
  const tramos = tarjetas.length === 1
    ? [{ desde: 1, hasta: 4 }]
    : [{ desde: 1, hasta: 2 }, { desde: 3, hasta: 4 }];
  dibujarTarjetas(hoja, 5, tramos, tarjetas);
  hoja.getRow(8).height = 14;

  const porCategoria = {};
  ordenarClaves(Object.keys(metricas).filter((c) => c !== CLAVE_TOTAL && !esVacio(metricas[c])), configuradas)
    .forEach((clave) => {
      if (typeof metricas[clave] === 'string' && metricas[clave].trim() === '') return;
      const categoria = categoriaDe(clave, configuradas);
      (porCategoria[categoria] = porCategoria[categoria] || []).push(clave);
    });

  let fila = 9;
  CATEGORIAS_METRICA_ORDEN.filter((cat) => porCategoria[cat]?.length).forEach((categoria) => {
    hoja.mergeCells(`A${fila}:D${fila}`);
    const titulo = hoja.getCell(`A${fila}`);
    titulo.value = ETIQUETAS_SECCION[categoria] || categoria;
    titulo.font = { name: FUENTE, size: 12, bold: true, color: { argb: COLOR.azul } };
    titulo.alignment = { vertical: 'bottom' };
    ['A', 'B', 'C', 'D'].forEach((l) => { hoja.getCell(`${l}${fila}`).border = { bottom: lado(COLOR.dorado, 'medium') }; });
    hoja.getRow(fila).height = 26;
    fila += 1;

    porCategoria[categoria].forEach((clave) => {
      const bruto = metricas[clave];
      const numerico = tipoMetricaPorClave(clave) === 'numero';
      hoja.mergeCells(`A${fila}:B${fila}`);
      hoja.mergeCells(`C${fila}:D${fila}`);
      const etiqueta = hoja.getCell(`A${fila}`);
      const valor = hoja.getCell(`C${fila}`);
      etiqueta.value = etiquetaDe(clave, mapaEtiquetas);
      valor.value = numerico ? aNumero(bruto) : String(bruto);
      etiqueta.font = { name: FUENTE, size: 11, color: { argb: COLOR.textoSec } };
      valor.font = { name: FUENTE, size: 11.5, bold: true, color: { argb: COLOR.texto } };
      etiqueta.alignment = { vertical: 'middle', wrapText: true };
      valor.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      ['A', 'B', 'C', 'D'].forEach((l) => { hoja.getCell(`${l}${fila}`).border = { bottom: lado(COLOR.borde, 'hair') }; });
      const lineas = numerico ? 1 : Math.ceil(String(bruto).length / 34);
      hoja.getRow(fila).height = Math.max(24, lineas * 16 + 8);
      fila += 1;
    });
    fila += 1;
  });

  const pie = [
    registro.registrado_por_nombre ? `Registrado por ${registro.registrado_por_nombre}` : '',
    registro.creado_en ? `Creado el ${registro.creado_en}` : ''
  ].filter(Boolean).join('   ·   ');
  if (pie) {
    hoja.mergeCells(`A${fila}:D${fila}`);
    hoja.getCell(`A${fila}`).value = pie;
    hoja.getCell(`A${fila}`).font = { name: FUENTE, size: 9, italic: true, color: { argb: COLOR.textoSec } };
  }

  hoja.pageSetup = { orientation: 'portrait', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  return libro.xlsx.writeBuffer();
}
