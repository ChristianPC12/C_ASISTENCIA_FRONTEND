---
name: react-doctor
description: Run after making React changes to catch issues early. Use when reviewing code, finishing a feature, or fixing bugs in a React project.
version: 1.1.0
---

# React Doctor

Scans your React codebase for security, performance, correctness, and architecture issues. Outputs a 0-100 score with actionable diagnostics.

## Usage

```bash
npx -y react-doctor@latest . --verbose --diff
```

## Workflow

1. Leer `CONTEXTO_ACTUAL.md` para ubicarse rapido en el estado vigente.
2. Leer `prompt_frontend.md` si el cambio toca arquitectura, auth, rutas o API.
3. Ejecutar `react-doctor`.
4. Corregir primero errores de seguridad/correctitud, luego performance/arquitectura.
5. Re-ejecutar hasta eliminar findings criticos.
6. Si hubo cambios funcionales, actualizar contexto en `.agents/react-doctor`.

## Notes

- Este skill se usa despues de cambios React; no sustituye pruebas manuales de flujo.
- Si hay contradiccion entre docs y codigo, priorizar el codigo y actualizar docs.
