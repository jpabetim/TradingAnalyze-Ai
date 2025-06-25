# 🔐 Guía de Configuración de API Keys para Despliegue

## ⚠️ IMPORTANTE: Configuración Segura de API Keys

### 📋 **API Keys Necesarias**

Para que la aplicación funcione correctamente, necesitas configurar las siguientes API keys:

#### 🤖 **1. Gemini AI (Obligatorio)**
- **Propósito:** Análisis de IA y chat asistente
- **Obtener en:** [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Variable:** `GEMINI_API_KEY`

#### 📊 **2. BingX API (Opcional)**
- **Propósito:** Datos de cripto en tiempo real
- **Obtener en:** [BingX API](https://bingx.com/en-us/support/articles/360016415633)
- **Variable:** `VITE_BINGX_API_KEY`

#### 📈 **3. Alpha Vantage (Opcional)**
- **Propósito:** Datos de forex y acciones
- **Obtener en:** [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
- **Variable:** `VITE_ALPHA_VANTAGE_API_KEY`

#### 💹 **4. Twelve Data (Opcional)**
- **Propósito:** Datos de mercado alternativos
- **Obtener en:** [Twelve Data](https://twelvedata.com/pricing)
- **Variable:** `VITE_TWELVE_DATA_API_KEY`

---

## 🚀 **Métodos de Configuración**

### **Opción 1: Variables de Entorno del Sistema**
```bash
# Linux/Mac
export GEMINI_API_KEY="tu_clave_gemini_aqui"
export VITE_BINGX_API_KEY="tu_clave_bingx_aqui"

# Windows
set GEMINI_API_KEY=tu_clave_gemini_aqui
set VITE_BINGX_API_KEY=tu_clave_bingx_aqui
```

### **Opción 2: Archivo .env.local**
Crea un archivo `.env.local` en la raíz del proyecto:
```env
GEMINI_API_KEY=tu_clave_gemini_aqui
VITE_BINGX_API_KEY=tu_clave_bingx_aqui
VITE_ALPHA_VANTAGE_API_KEY=tu_clave_alpha_vantage_aqui
VITE_TWELVE_DATA_API_KEY=tu_clave_twelve_data_aqui
```

### **Opción 3: Configuración in-app**
La aplicación incluye un gestor de API keys que permite:
- Configurar las claves directamente en la UI
- Almacenamiento seguro en localStorage
- Validación de claves en tiempo real

---

## 🔒 **Configuración para Vercel**

1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a **Settings** > **Environment Variables**
4. Agrega cada variable:
   ```
   GEMINI_API_KEY = tu_clave_aqui
   VITE_BINGX_API_KEY = tu_clave_aqui
   VITE_ALPHA_VANTAGE_API_KEY = tu_clave_aqui
   VITE_TWELVE_DATA_API_KEY = tu_clave_aqui
   ```

## 🔒 **Configuración para Netlify**

1. Ve a tu dashboard de Netlify
2. Selecciona tu proyecto
3. Ve a **Site Settings** > **Environment Variables**
4. Agrega cada variable con su valor correspondiente

---

## ⚡ **Configuración Mínima (Solo IA)**

Si solo quieres usar las funciones de IA:
```env
GEMINI_API_KEY=tu_clave_gemini_aqui
```

Los datos de mercado seguirán funcionando con:
- Binance (sin API key requerida)
- Yahoo Finance (sin API key requerida)

---

## 🛡️ **Seguridad**

### ✅ **Buenas Prácticas**
- ✅ Las claves no están hardcodeadas en el código
- ✅ Archivo `.env` está en `.gitignore`
- ✅ Variables `VITE_*` solo para APIs públicas
- ✅ Variables sin `VITE_` para APIs sensibles (backend)

### ⚠️ **Nunca hagas esto**
- ❌ No subas las claves API al repositorio Git
- ❌ No compartas las claves en screenshots
- ❌ No uses las mismas claves en desarrollo y producción

---

## 🧪 **Testing sin API Keys**

La aplicación incluye un modo de desarrollo que permite:
- Usar datos mock para testing
- Botón "🧪 Probar Señales (Dev)" para cargar datos de ejemplo
- Funcionalidad completa del gráfico sin APIs externas

---

## 📞 **Soporte**

Si tienes problemas con la configuración:
1. Verifica que las variables estén correctamente configuradas
2. Revisa la consola del navegador para errores específicos
3. Usa el botón de testing para verificar que el gráfico funciona
4. Contacta soporte si persisten los problemas
