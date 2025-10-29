#!/bin/bash

# Demostración de Mejoras en el Manejo de Errores
# Este script muestra cómo probar las mejoras implementadas

echo "=== DEMOSTRACIÓN DE MEJORAS EN MANEJO DE ERRORES ==="
echo ""

# Primero, iniciar el servidor (debe ejecutarse en otra terminal)
echo "1. Para probar estas mejoras, inicie el servidor con:"
echo "   yarn start:dev"
echo ""

echo "2. Luego ejecute estos comandos cURL para probar los diferentes casos de error:"
echo ""

echo "=== ERRORES DE AUTENTICACIÓN ==="
echo ""

echo "# Error 401 - Sin token:"
echo 'curl -X GET http://localhost:3000/tasks'
echo ""

echo "# Error 401 - Token inválido:"
echo 'curl -X GET http://localhost:3000/tasks -H "Authorization: Bearer invalid-token"'
echo ""

echo "# Error 401 - Header malformado:"
echo 'curl -X GET http://localhost:3000/tasks -H "Authorization: InvalidFormat token"'
echo ""

echo "=== ERRORES DE VALIDACIÓN ==="
echo ""

echo "# Error 400 - UUID inválido en parámetro:"
echo 'curl -X GET http://localhost:3000/tasks/invalid-uuid -H "Authorization: Bearer VALID_TOKEN"'
echo ""

echo "# Error 400 - Título faltante:"
echo 'curl -X POST http://localhost:3000/tasks/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VALID_TOKEN" \
  -d "{\"description\": \"Test description\"}"'
echo ""

echo "# Error 400 - Título vacío:"
echo 'curl -X POST http://localhost:3000/tasks/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VALID_TOKEN" \
  -d "{\"title\": \"\", \"description\": \"Test description\"}"'
echo ""

echo "# Error 400 - Título demasiado largo:"
LONG_TITLE=$(printf 'a%.0s' {1..256})
echo 'curl -X POST http://localhost:3000/tasks/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VALID_TOKEN" \
  -d "{\"title\": \"'$LONG_TITLE'\", \"description\": \"Test\"}"'
echo ""

echo "# Error 400 - Fecha inválida:"
echo 'curl -X POST http://localhost:3000/tasks/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VALID_TOKEN" \
  -d "{\"title\": \"Valid title\", \"dueDate\": \"invalid-date\"}"'
echo ""

echo "# Error 400 - Propiedades no permitidas:"
echo 'curl -X POST http://localhost:3000/tasks/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VALID_TOKEN" \
  -d "{\"title\": \"Valid title\", \"maliciousField\": \"hack attempt\"}"'
echo ""

echo "# Error 400 - Contenido potencialmente malicioso:"
echo 'curl -X POST http://localhost:3000/tasks/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VALID_TOKEN" \
  -d "{\"title\": \"<script>alert(\\\"xss\\\")</script>\", \"description\": \"Test\"}"'
echo ""

echo "=== ERRORES DE AUTORIZACIÓN (requiere token válido) ==="
echo ""

echo "# Error 403 - Intentar acceder a tarea de otro usuario:"
echo 'curl -X GET http://localhost:3000/tasks/OTHER_USER_TASK_ID -H "Authorization: Bearer VALID_TOKEN"'
echo ""

echo "# Error 404 - Tarea no existe:"
echo 'curl -X GET http://localhost:3000/tasks/550e8400-e29b-41d4-a716-446655440999 -H "Authorization: Bearer VALID_TOKEN"'
echo ""

echo "=== FORMATO DE RESPUESTA DE ERROR ESTANDARIZADO ==="
echo ""
echo "Todas las respuestas de error seguirán este formato:"
echo '{'
echo '  "statusCode": 400,'
echo '  "error": "Bad Request",'
echo '  "message": "Mensaje de error específico",'
echo '  "timestamp": "2024-10-29T10:00:00.000Z",'
echo '  "path": "/tasks/create",'
echo '  "method": "POST"'
echo '}'
echo ""

echo "=== INSTRUCCIONES ADICIONALES ==="
echo ""
echo "1. Reemplace VALID_TOKEN con un token JWT real obtenido del endpoint /auth/sign-in"
echo "2. Reemplace OTHER_USER_TASK_ID con el ID de una tarea que pertenezca a otro usuario"
echo "3. Observe los logs del servidor para ver el logging detallado de errores"
echo "4. Los errores 5xx se registran como ERROR, los 403/401 como WARN"
echo ""

echo "=== CASOS DE ERROR CUBIERTOS ==="
echo ""
echo "✅ 401 Unauthorized:"
echo "   - Token no proporcionado"
echo "   - Token inválido o malformado"
echo "   - Token expirado"
echo "   - Header de autorización mal formado"
echo ""
echo "✅ 403 Forbidden:"
echo "   - Usuario intenta acceder a tarea que no le pertenece"
echo "   - Usuario del token ya no existe en la base de datos"
echo "   - ID de usuario no coincide entre token y base de datos"
echo ""
echo "✅ 400 Bad Request:"
echo "   - Formato de UUID inválido"
echo "   - Datos de validación incorrectos"
echo "   - Campos requeridos faltantes"
echo "   - Datos demasiado largos"
echo "   - Contenido potencialmente malicioso"
echo "   - Propiedades no permitidas en el request"
echo ""
echo "✅ 404 Not Found:"
echo "   - Tarea no existe"
echo "   - Endpoints no existentes"
echo ""
echo "✅ 500 Internal Server Error:"
echo "   - Errores de base de datos no esperados"
echo "   - Errores de aplicación no manejados"
echo ""

echo "=== LOGGING Y AUDITORIA ==="
echo ""
echo "✅ Logging completo de intentos de acceso"
echo "✅ Tracking de operaciones por usuario"  
echo "✅ Identificación de patrones de ataque potenciales"
echo "✅ Stack traces para debugging (solo en desarrollo)"
echo "✅ Información contextual (método, URL, usuario, timestamp)"
echo ""

echo "La aplicación ahora maneja correctamente el caso específico donde un usuario"
echo "intenta acceder o editar una tarea sin permisos, devolviendo error 403 Forbidden,"
echo "junto con muchos otros casos extremos y de seguridad."
