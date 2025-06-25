# TradingAnalyze-AI - Render Deployment

## Build Settings for Render

### Build Command:
```
npm install && npm run build
```

### Start Command:
```
npm start
```

### Environment Variables (Configurar en Render Dashboard):
- `NODE_ENV=production`
- `GEMINI_API_KEY=your_gemini_api_key_here`

### Root Directory:
```
.
```

### Publish Directory:
```
dist
```

## Post-Deployment Checklist:
1. ✅ Verificar que la aplicación carga correctamente
2. ✅ Probar conexiones a APIs de crypto (Binance, BingX)
3. ✅ Configurar dominio personalizado (opcional)
4. ✅ Verificar HTTPS está habilitado
5. ✅ Probar análisis con Gemini AI

## Important Notes:
- La aplicación usa APIs directas de exchanges (sin CORS issues en producción)
- El análisis AI requiere configurar GEMINI_API_KEY
- Los datos se almacenan en localStorage del navegador
- No requiere base de datos externa
