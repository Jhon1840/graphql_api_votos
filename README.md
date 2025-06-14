# Sistema de Votación

Sistema de votación electrónica con backend en .NET y frontend en Next.js.

## Requisitos Previos

- [Docker](https://www.docker.com/products/docker-desktop/) (para el backend)
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [pnpm](https://pnpm.io/) (gestor de paquetes para el frontend)
- [.NET SDK](https://dotnet.microsoft.com/download) (versión 8.0 o superior, solo para desarrollo)

## Estructura del Proyecto

```
acebo/
├── VotingSystem.API/     # Backend (.NET)
│   ├── Dockerfile
│   ├── Program.cs
│   └── ...
└── forntend/            # Frontend (Next.js)
    ├── app/
    ├── components/
    ├── hooks/
    └── ...
```

## Configuración y Ejecución

### 1. Backend (Docker)

El backend utiliza Docker para su ejecución y Cassandra como base de datos.

1. Asegúrate de tener Docker Desktop instalado y en ejecución.

2. Desde la raíz del proyecto, construye y ejecuta el contenedor:
   ```bash
   # Construir la imagen
   docker build -t voting-system-api ./VotingSystem.API

   # Ejecutar el contenedor
   docker run -d -p 5000:80 --name voting-system-api voting-system-api
   ```

3. Verifica que el backend esté funcionando:
   - Abre http://localhost:5000/graphql en tu navegador
   - Deberías ver la interfaz de GraphQL Playground

### 2. Frontend (Next.js)

El frontend utiliza Next.js con TypeScript y Tailwind CSS.

1. Navega al directorio del frontend:
   ```bash
   cd forntend
   ```

2. Instala las dependencias usando pnpm:
   ```bash
   pnpm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

4. El frontend estará disponible en:
   - http://localhost:3000

## Uso del Sistema

1. **Registro de Elecciones**
   - Accede a la página principal
   - Completa el formulario de registro de elección
   - Ingresa nombre y fecha de la elección

2. **Registro de Candidatos**
   - Selecciona una elección activa
   - Ingresa los datos del candidato (nombre y partido)
   - Confirma el registro

3. **Registro de Votantes**
   - Ingresa el carnet y nombre del votante
   - El sistema validará que no esté duplicado

4. **Proceso de Votación**
   - El votante ingresa su carnet
   - Selecciona un candidato
   - Confirma su voto

5. **Consulta de Resultados**
   - Los resultados se muestran en tiempo real
   - Se puede ver el total de votos por candidato

## Desarrollo

### Backend

- El backend está construido con .NET 8
- Utiliza GraphQL con HotChocolate
- La base de datos es Cassandra
- El endpoint GraphQL está en http://localhost:5000/graphql

### Frontend

- Construido con Next.js 14
- Utiliza TypeScript para type safety
- Apollo Client para las consultas GraphQL
- Tailwind CSS para los estilos
- Componentes de shadcn/ui para la interfaz

## Solución de Problemas

### Backend

1. Si el contenedor no inicia:
   ```bash
   # Ver logs del contenedor
   docker logs voting-system-api

   # Reiniciar el contenedor
   docker restart voting-system-api
   ```

2. Si necesitas reconstruir:
   ```bash
   # Detener y eliminar el contenedor
   docker stop voting-system-api
   docker rm voting-system-api

   # Reconstruir y ejecutar
   docker build -t voting-system-api ./VotingSystem.API
   docker run -d -p 5000:80 --name voting-system-api voting-system-api
   ```

### Frontend

1. Si hay problemas con las dependencias:
   ```bash
   # Limpiar caché de pnpm
   pnpm store prune

   # Reinstalar dependencias
   rm -rf node_modules
   pnpm install
   ```

2. Si el servidor de desarrollo no inicia:
   ```bash
   # Limpiar caché de Next.js
   rm -rf .next
   pnpm dev
   ```

## Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 