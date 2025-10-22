# Guía del Sistema de Colores TuPatrimonio

## 🎨 Sistema Dual de Colores Implementado

TuPatrimonio ahora usa un **sistema dual** que separa funcionalidad de identidad de marca:

### 📱 **Botones y Elementos Funcionales (Gris Neutro)**
```css
--tp-buttons: #404040;           /* Gris oscuro para botones */
--tp-buttons-hover: #555555;     /* Gris más claro para hover */
--tp-buttons-5: #4040400d;       /* Variaciones con opacidad */
```

**Usar para:**
- ✅ Botones de acción general
- ✅ Elementos de navegación  
- ✅ Controles de interfaz
- ✅ Elementos funcionales

### 🏷️ **Marca e Identidad (Vino Corporativo)**
```css
--tp-brand: #800039;             /* Vino de marca para textos importantes */
--tp-brand-light: #a50049;       /* Vino claro para acentos */
--tp-brand-dark: #600028;        /* Vino oscuro para variaciones */
--tp-brand-5: #8000390d;         /* Variaciones con opacidad */
```

**Usar para:**
- ✅ Nombre "TuPatrimonio"
- ✅ Títulos de servicios principales ("Firma Electrónica", "Notaría Digital")
- ✅ Iconos destacados grandes (w-16, w-12, w-8)
- ✅ Números y estadísticas importantes
- ✅ Enlaces de marca
- ✅ Elementos que refuerzan identidad corporativa

## 📋 **Elementos Ya Actualizados**

### **Textos de Marca (Vino):**
- ✅ "TuPatrimonio" en headers de todas las páginas
- ✅ "Firma Electrónica" en títulos principales
- ✅ "Notaría Digital" en títulos
- ✅ "Verificación de Identidad" en títulos
- ✅ "Blog TuPatrimonio" 
- ✅ Frases con marca: "para Chile", "Legales"
- ✅ Estadísticas: "+500", "+15,000", "99.8%"
- ✅ Números de pasos: "1", "2", "3", "4"

### **Iconos de Marca (Vino):**
- ✅ Iconos principales grandes (Globe, CheckCircle, Shield, Clock)
- ✅ Iconos de servicios (Stamp, Fingerprint, Users, Building)
- ✅ Iconos de características destacadas

### **Botones Funcionales (Gris):**
- ✅ Botones "Probar Gratis", "Ver Demo", etc.
- ✅ Selector de país
- ✅ Elementos de navegación

## 🎯 **Resultado Visual Logrado**

### **Antes:**
- Todo era vino (#800039) → Sobresaturación visual
- No había jerarquía clara

### **Después:**
- **Botones grises** → Funcionales, menos prominentes
- **Elementos de marca en vino** → Refuerzan identidad
- **Jerarquía clara** → Usuarios saben qué es importante

## 🔧 **Cómo Aplicar en Nuevos Elementos**

### **Para Textos Importantes:**
```html
<!-- Nombre de la empresa -->
<h1>Servicios <span className="text-[var(--tp-brand)]">TuPatrimonio</span></h1>

<!-- Títulos de servicios -->
<h2><span className="text-[var(--tp-brand)]">Firma Electrónica</span> Válida</h2>

<!-- Estadísticas importantes -->
<div className="text-3xl font-bold text-[var(--tp-brand)]">+500</div>
```

### **Para Iconos Destacados:**
```html
<!-- Iconos de servicios principales -->
<CheckCircle className="w-8 h-8 text-[var(--tp-brand)]" />

<!-- Iconos de características -->
<Shield className="w-16 h-16 text-[var(--tp-brand)]" />
```

### **Para Botones Funcionales:**
```html
<!-- Botones de acción -->
<Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
  Acción
</Button>
```

### **Para Fondos Sutiles:**
```html
<!-- Fondos con color de marca sutil -->
<div className="bg-[var(--tp-brand-5)] border border-[var(--tp-brand-20)]">
  Contenido destacado
</div>
```

## 🔮 **Para Futuros Desarrollos**

1. **Nuevos servicios**: Usar `text-[var(--tp-brand)]` para nombres
2. **CTAs importantes**: Considerar `bg-[var(--tp-brand)]` para destacar
3. **Elementos de marca**: Siempre usar variables `--tp-brand-*`
4. **Elementos funcionales**: Usar variables `--tp-buttons-*`

---

**El sistema está completamente implementado y es escalable para futuros desarrollos.**
