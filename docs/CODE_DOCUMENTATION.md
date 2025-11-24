# Documentación del Código - Agency ERP

## 📚 Índice

1. [Arquitectura General](#arquitectura-general)
2. [Flujo de Datos](#flujo-de-datos)
3. [Componentes Principales](#componentes-principales)
4. [Backend](#backend)
5. [Seguridad](#seguridad)
6. [Guía Rápida](#guía-rápida)

---

## 🏗️ Arquitectura General

### Stack Tecnológico

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Base de Datos**: MySQL (o mockData.json en desarrollo)
- **Autenticación**: JWT + Cookies HTTP-only
- **Estilos**: Tailwind CSS (inline)

### Estructura de Directorios

```
Lucas-Agency/
├── components/          # Componentes React
│   ├── Dashboard.tsx   # Vista principal con métricas
│   ├── LoginPage.tsx   # Página de login
│   ├── RegisterPage.tsx # Página de registro
│   ├── ProjectDetail.tsx # Modal de detalles de proyecto
│   └── ...
├── context/            # React Context para estado global
│   └── AuthContext.tsx # Contexto de autenticación
├── hooks/              # Custom hooks
│   ├── useProjects.ts  # Hook para gestión de proyectos
│   └── usePricingConfig.ts # Hook para configuración de precios
├── services/           # Servicios de API
│   └── apiService.ts   # Cliente HTTP para backend
├── server/             # Backend Node.js
│   ├── index.js        # Servidor Express
│   ├── db.js           # Conexión a base de datos
│   ├── mockDb.js       # Simulador de DB para desarrollo
│   ├── routes/         # Rutas de API
│   │   ├── auth.js     # Autenticación (login/register)
│   │   ├── data.js     # CRUD de proyectos/clientes/finanzas
│   │   └── config.js   # Configuración de precios
│   └── middleware/     # Middlewares personalizados
│       └── validators.js # Validación de inputs
├── types.ts            # Definiciones de tipos TypeScript
├── App.tsx             # Componente raíz
└── main.tsx            # Punto de entrada
```

---

## 🔄 Flujo de Datos

### 1. Autenticación

```
Usuario ingresa credenciales
    ↓
LoginPage → apiService.login()
    ↓
Backend valida y genera JWT
    ↓
JWT guardado en cookie HTTP-only
    ↓
AuthContext actualiza estado
    ↓
App redirige a Dashboard
```

### 2. Carga de Datos

```
App.tsx monta
    ↓
useProjects hook se ejecuta
    ↓
useEffect llama a loadData()
    ↓
apiService.getProjects/Clients/Finances()
    ↓
Backend query a DB (o mockData.json)
    ↓
Datos guardados en estado local
    ↓
Componentes renderizan con datos
```

### 3. Actualización de Proyecto

```
Usuario edita proyecto en ProjectDetail
    ↓
Click en "Guardar Cambios Globales"
    ↓
onUpdateProject(data)
    ↓
useProjects.updateProject()
    ↓
apiService.updateProject(fullProject)
    ↓
Backend PUT /api/projects/:id
    ↓
mockDb.query UPDATE o pool.query SQL
    ↓
Datos guardados en mockData.json o MySQL
    ↓
Estado local actualizado
    ↓
UI re-renderiza
```

---

## 🧩 Componentes Principales

### App.tsx (Componente Raíz)

**Responsabilidades:**
- Routing basado en estado `view`
- Gestión de autenticación
- Orquestación de vistas
- Manejo de modales globales

**Estados Principales:**
```typescript
view: 'dashboard' | 'projects' | 'clients' | 'finance'  // Vista actual
selectedProjectId: string | null  // Proyecto seleccionado para modal
showAddClient: boolean  // Modal de añadir cliente
showAddProject: boolean  // Modal de añadir proyecto
showPricingConfig: boolean  // Modal de configuración de precios
```

**Hooks Utilizados:**
- `useAuth()`: Autenticación y estado de usuario
- `useProjects()`: Gestión de proyectos, clientes, finanzas

### Dashboard.tsx

**Responsabilidades:**
- Mostrar métricas clave (total proyectos, activos, ingresos)
- Gráfico de finanzas
- Vista de proyecto activo

**Props:**
```typescript
{
  projects: Project[],  // Lista de todos los proyectos
  finances: FinanceRecord[]  // Registros financieros
}
```

### ProjectDetail.tsx

**Responsabilidades:**
- Modal completo de detalles de proyecto
- 4 pestañas: Flujo de Trabajo, Datos y Edición, Bitácora, Finanzas
- CRUD de checklist items
- Gestión de precios y descuentos
- Envío de emails

**States Internos:**
```typescript
activeTab: 'workflow' | 'data' | 'log' | 'finance'
generalData: { planType, deadline, paymentStatus, devUrl, ... }
pricingData: { basePrice, customPrice, discount, ... }
discoveryData: { buyerPersona, competitors, ... }
checklists: { [stage]: ChecklistItem[] }
```

**Lógica de Precios:**
1. `basePrice` se calcula automáticamente según `planType`
2. Si hay `customPrice`, se usa en lugar de `basePrice`
3. Se aplica `discount` con tipo `percentage` o `fixed`
4. `finalPrice = calculateFinalPrice(base, custom, discount, discountType)`

### useProjects.ts (Hook Custom)

**Responsabilidad:** Centralizar toda la lógica de datos

**Funciones Principales:**
```typescript
// Cargar todos los datos (proyectos, clientes, finanzas, logs)
loadData()

// CRUD Proyectos
addProject(project: Project)
updateProject(id: string, fields: Partial<Project>)
deleteProject(id: string)

// CRUD Clientes
addClient(client: Client)

// CRUD Finanzas
addFinance(record: FinanceRecord)

// Logs
addLog(log: ProjectLog)
updateLog(log: ProjectLog)
```

**Optimizaciones:**
- Usa `useMemo` para evitar re-cálculos innecesarios
- Actualiza estado local inmediatamente (optimistic updates)
- Maneja errores silenciosamente en la mayoría de casos

---

## 🗄️ Backend

### Estructura de Rutas

#### `/api/auth` (auth.js)

**POST /api/auth/login**
- Body: `{ email, password }`  
- Validación: Email format, password not empty
- Rate limit: 5 intentos / 15 min
- Respuesta: JWT en cookie + user data

**POST /api/auth/register**
- Body: `{ email, password }`
- Validación: Email format, password >= 8 chars con mayúscula/minúscula/número
- Rate limit: 5 intentos / 15 min
- Verifica email duplicado
- Respuesta: Success message

**POST /api/auth/logout**
- Limpia cookie con JWT
- Respuesta: Success

**GET /api/auth/check**
- Middleware: `verifyToken`
- Respuesta: User data si autenticado

#### `/api` (data.js)

**GET /api/projects**
- Middleware: `verifyToken`
- Query MySQL o mockData
- JOIN con clients para traer `clientName`
- Respuesta: Array de proyectos

**POST /api/projects**
- Middleware: `verifyToken`
- Body: `{ clientId, planType, deadline, ... }`
- INSERT into database
- Respuesta: Proyecto creado con ID

**PUT /api/projects/:id**
- Middleware: `verifyToken`
- Body: Campos completos del proyecto
- UPDATE en database
- WHERE id = :id AND user_id = req.user.id (seguridad)
- Respuesta: Success

**DELETE /api/projects/:id**
- Middleware: `verifyToken`
- DELETE FROM projects WHERE id = :id
- Respuesta: Success

Rutas similares para `/api/clients`, `/api/finances`, `/api/logs`

#### `/api/config` (config.js)

**GET /api/config/pricing**
- Middleware: `verifyToken`
- Lee `server/pricingConfig.json`
- Respuesta: `{ singlePage, multipage, ecommerce, custom }`

**POST /api/config/pricing**
- Middleware: `verifyToken`
- Body: Nuevos precios
- Escribe en `server/pricingConfig.json`
- Respuesta: Success

### mockDb.js vs MySQL

**mockDb.js** (Desarrollo)
- Simula operaciones de DB
- Lee/escribe en `server/mockData.json`
- Parsea query SQL para identificar operación
- Ideal para desarrollo rápido sin MySQL

**MySQL** (Producción)
- Pool de conexiones `mysql2/promise`
- Queries preparados (previene SQL injection)
- Activado con `USE_MOCK_DB=false` en `.env`

**Cambiar entre modos:**
```bash
# .env
USE_MOCK_DB=true   # Para desarrollo local
USE_MOCK_DB=false  # Para producción con MySQL
```

---

## 🔐 Seguridad

### Implementado

✅ **Helmet.js** - Headers de seguridad HTTP
✅ **Rate Limiting** - 5 intentos / 15 min en auth
✅ **Input Validation** - express-validator en login/register
✅ **JWT con HTTP-only cookies** - No accesible desde JavaScript
✅ **Passwords hasheados** - bcrypt con salt de 10 rondas
✅ **Verificación de email duplicado** - Sin revelar existencia
✅ **Console.logs condicionalizados** - Solo en desarrollo
✅ **.env en .gitignore** - Secretos no se suben a Git

### Consideraciones de Seguridad

**🔒 Cookies HTTP-Only**
```javascript
res.cookie('token', token, {
    httpOnly: true,  // No accesible desde JS (anti-XSS)
    secure: process.env.NODE_ENV === 'production',  // Solo HTTPS en prod
    sameSite: 'strict',  // Anti-CSRF
    maxAge: 24 * 60 * 60 * 1000  // 24 horas
});
```

**🛡️ Validación de Inputs**
```javascript
// Ejemplo de validator
body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
```

**⏱️ Rate Limiting**
```javascript
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 5,  // Máximo 5 requests
    message: { error: 'Too many attempts, please try again later' }
});
```

### Producción Checklist

Antes de desplegar:
- [ ] Generar JWT_SECRET fuerte: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Configurar `USE_MOCK_DB=false`
- [ ] Configurar credenciales MySQL
- [ ] Actualizar CORS con dominio real
- [ ] Verificar `NODE_ENV=production`
- [ ] Configurar HTTPS

---

## 🚀 Guía Rápida

### Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env
cp .env.example .env
# Editar .env con tus valores

# 3. Ejecutar en desarrollo
npm run dev        # Frontend en puerto 3000
npm run server     # Backend en puerto 3001
```

### Tareas Comunes

**Agregar un nuevo proyecto:**
1. Usuario hace click en "+ Nuevo Proyecto" en vista Proyectos
2. Modal se abre con formulario
3. Selecciona cliente, plan, deadline
4. Submit llama a `addProject()`
5. Hook ejecuta `apiService.addProject()`
6. Backend inserta en DB y devuelve proyecto con ID
7. Hook actualiza estado local
8. Modal se cierra, lista se actualiza

**Cambiar precio base de un plan:**
1. Click en ⚙️ Settings en header
2. Modal "Configuración de Precios" se abre
3. Editar precio de "Single Page", "Multipage", etc.
4. Click en "Guardar Configuración"
5. `usePricingConfig.updatePricing()` ejecuta
6. Backend escribe en `pricingConfig.json`
7. Proyectos existentes con ese plan se actualizan automáticamente

**Debugging:**
```bash
# Ver logs del servidor
# Los logs mostraran queries SQL (en desarrollo) si NODE_ENV=development

# Ver requests de red
# Abrir DevTools > Network para ver API calls

# Verificar datos guardados (mockDB)
cat server/mockData.json | jq .projects

# Verificar datos guardados (MySQL)
mysql -u root -p
USE agency_db;
SELECT * FROM projects;
```

###Archivos Clave para Modificar

**Agregar nuevo campo a Proyecto:**
1. `types.ts` - Agregar field a interface `Project`
2. `server/routes/data.js` - Agregar columna en INSERT y UPDATE
3. `server/mockDb.js` - Agregar field en mapping (si usas mockDB)
4. `components/ProjectDetail.tsx` - Agregar input en formulario
5. MySQL - `ALTER TABLE projects ADD COLUMN new_field VARCHAR(255);`

**Agregar nueva vista (ej: "Reportes"):**
1. `App.tsx` - Agregar `'reports'` al type de `view`
2. `App.tsx` - Agregar botón en sidebar que haga `handleViewChange('reports')`
3. `App.tsx` - Agregar condicional `{view === 'reports' && <ReportsView />}`
4. Crear `components/ReportsView.tsx`
5. Actualizar `handleViewChange` para agregar ruta `/reports`

---

## 📝 Convenciones de Código

### Nombres de Variables
- **camelCase** para variables y funciones: `projectData`, `handleSubmit`
- **PascalCase** para componentes y tipos: `ProjectDetail`, `FinanceRecord`
- **UPPER_SNAKE_CASE** para constantes: `JWT_SECRET`, `API_URL`

### Organización de Componentes
```typescript
// 1. Imports
import React, { useState } from 'react';

// 2. Types/Interfaces (si no están en types.ts)
interface Props { ... }

// 3. Componente
function MyComponent({ prop1, prop2 }: Props) {
  // 3.1 Hooks
  const [state, setState] = useState();
  
  // 3.2 Handlers
  const handleClick = () => { ... };
  
  // 3.3 Effects
  useEffect(() => { ... }, []);
  
  // 3.4 Render
  return ( ... );
}

// 4. Export
export default MyComponent;
```

### Comentarios
- **JSDoc** para funciones públicas
- **// Inline comments** para lógica compleja
- **// TODO:** para tareas pendientes
- **// FIXME:** para bugs conocidos

---

## 🐛 Problemas Comunes

**"El login no funciona"**
- Verificar que el servidor esté corriendo en puerto 3001
- Verificar credenciales (usuario demo: `demo@agency.com` / `password`)
- Revisar consola del navegador para errores
- Verificar que no haya rate limiting activo

**"Los cambios no se guardan"**
- Verificar que `mockDb.js` esté sincronizado con la query SQL
- Revisar `server/mockData.json` para ver si se escribió
- Si usas MySQL, verificar conexión con `server/db.js`

**"URL no cambia al navegar"**
- Esto es normal si no refrescaste después del fix
- El routing ahora actualiza la URL con `window.history.pushState`
- Botón "atrás" del navegador debería funcionar

**"Precio Base no aparece"**
- Verificar que el proyecto tenga `planType` definido
- Revisar `server/pricingConfig.json` para precios configurados
- Backend aplica default "Single Page" si `planType` es null

---

## 📖 Recursos Adicionales

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT.io](https://jwt.io/) - Debugger de JWT

---

**Última actualización:** 23/Nov/2025  
**Versión:** 1.0.0  
**Autor:** Lucas Leone Agency
