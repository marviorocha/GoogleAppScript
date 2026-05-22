# Guia de Extensão - Novos Tipos de Links

## 📚 Introdução

Este guia demonstra como adicionar novos tipos de links ao sistema de forma escalável e sem quebrar o código existente.

---

## 🎯 Passo a Passo: Adicionar Novo Tipo

### Estrutura de Decisão

Antes de começar, identifique:

1. **Qual será o nome do link?**

   - Exemplo: `link_video_1`, `link_manual_1`, `link_whatsapp_1`

2. **Que tipo de recurso é?**

   - `file` = arquivo do Google Drive
   - `folder` = pasta do Google Drive
   - Extensível para: YouTube, OneDrive, etc.

3. **Como deve parecer?**
   - Label (texto do link): "Vídeo", "Manual", "Compartilhar"
   - Cor: código hex RGB
   - Descrição: para comentário no código

---

## 📋 Exemplo 1: Adicionar Tipo VIDEO

### Requisitos

- Campo: `link_video_1`, `link_video_2`, etc.
- Tipo: Arquivo do Drive
- Visual: Vermelho, com texto "Vídeo"

### Implementação

#### Etapa 1: Adicionar ao LinkRegistry

Abra `SliderUtils.js` e encontre:

```javascript
const LinkRegistry = {
  PROPOSTA: {
    /* ... */
  },
  CATALOGO: {
    /* ... */
  },
  MANUAL: {
    /* ... */
  },
  // Adicione aqui:
};
```

Adicione no final:

```javascript
VIDEO: {
  type: 'file',
  label: 'Vídeo de Demonstração',
  color: '#D33427',  // Vermelho Google
  description: 'Link para vídeo do produto'
},
```

Cores sugeridas por tipo:

- 🔵 Azul: `#1F8FE6` (corporativo)
- 🟢 Verde: `#34A853` (folders)
- 🔴 Vermelho: `#D33427` (ação/vídeo)
- 🟠 Laranja: `#F57C00` (técnico/manual)
- 🟣 Roxo: `#8E24AA` (premium)

#### Etapa 2: Adicionar Padrão ao LinkTypeDetector

Encontre a classe `LinkTypeDetector`:

```javascript
class LinkTypeDetector {
  static patterns = [
    { regex: /link_proposta/i, linkType: "PROPOSTA" },
    { regex: /link_catalogo/i, linkType: "CATALOGO" },
    { regex: /link_manual/i, linkType: "MANUAL" },
    // Adicione aqui:
  ];
}
```

Adicione antes do padrão fallback `link_`:

```javascript
{ regex: /link_video/i, linkType: 'VIDEO' },
```

#### Etapa 3: Usar na Proposta

```javascript
const detalhes_proposta = {
  nome: "Cliente",
  link_video_1: "1VIDEO_DRIVE_ID_HERE",
  link_video_2: "https://drive.google.com/file/d/1ANOTHER_VIDEO_ID/view",
};

// Resultado automático:
// {{LINK_VIDEO_1}} → "Vídeo de Demonstração" (🔴 vermelho com underline)
// {{LINK_VIDEO_2}} → "Vídeo de Demonstração" (🔴 vermelho com underline)
```

#### Etapa 4: Testar

```javascript
function testVideoLink() {
  // Teste detecção
  const detected = LinkTypeDetector.detect("link_video_1");
  Logger.log("Tipo: " + detected); // Esperado: VIDEO

  // Teste processamento
  const result = LinkProcessor.processField("link_video_1", "1VIDEO_ID");
  Logger.log("Resultado: " + JSON.stringify(result));

  // Verifique:
  // - url: https://drive.google.com/file/d/1VIDEO_ID/view
  // - linkType: VIDEO
  // - config.label: "Vídeo de Demonstração"
  // - config.color: "#D33427"
}
```

---

## 📋 Exemplo 2: Adicionar Tipo YOUTUBE (URL Externa)

### Requisitos

- Campo: `link_youtube_1`
- Tipo: URL externa (não Drive)
- Visual: Vermelho YouTube, com texto "Assista no YouTube"

### Implementação

#### Etapa 1: Estender LinkRegistry

```javascript
YOUTUBE: {
  type: 'external',  // ✨ Novo tipo
  label: 'Assista no YouTube',
  color: '#FF0000',  // Vermelho YouTube
  description: 'Link para vídeo YouTube'
},
```

#### Etapa 2: Estender LinkTypeDetector

```javascript
{ regex: /link_youtube/i, linkType: 'YOUTUBE' },
```

#### Etapa 3: Estender LinkProcessor (se necessário)

Se o link é uma URL externa (não Drive), o LinkProcessor atual pode precisar de ajuste.

Dentro de `LinkProcessor.processField()`, após extrair:

```javascript
// Se for YouTube, o valor é a URL completa
if (linkType === "YOUTUBE") {
  return {
    placeholder: `{{${key.toUpperCase()}}}`,
    url: value, // ✨ Use URL diretamente
    linkType,
    config: linkConfig,
    id: null,
    resourceType: "external",
  };
}
```

#### Etapa 4: Usar

```javascript
const detalhes_proposta = {
  link_youtube_1: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
};

// Resultado automático:
// {{LINK_YOUTUBE_1}} → "Assista no YouTube" (🔴 vermelho com underline)
```

---

## 📋 Exemplo 3: Adicionar Tipo WHATSAPP (Link Compartilhar)

### Requisitos

- Campo: `link_whatsapp_1`
- Tipo: Número de telefone/link WhatsApp
- Visual: Verde WhatsApp
- URL: `https://wa.me/NUMERO`

### Implementação

#### Etapa 1: LinkRegistry

```javascript
WHATSAPP: {
  type: 'external',
  label: 'Fale conosco no WhatsApp',
  color: '#25D366',  // Verde WhatsApp
  description: 'Link para contato WhatsApp'
},
```

#### Etapa 2: LinkTypeDetector

```javascript
{ regex: /link_whatsapp/i, linkType: 'WHATSAPP' },
```

#### Etapa 3: Estender LinkProcessor

Dentro de `LinkProcessor.processField()`:

```javascript
// Para WhatsApp, format phone number
if (linkType === "WHATSAPP") {
  // Remove caracteres não-numéricos
  const phone = value.replace(/\D/g, "");
  // WhatsApp API: wa.me/COUNTRY_CODE+NUMBER
  const url = `https://wa.me/${phone}`;

  return {
    placeholder: `{{${key.toUpperCase()}}}`,
    url,
    linkType,
    config: linkConfig,
    id: phone,
    resourceType: "external",
  };
}
```

#### Etapa 4: Usar

```javascript
const detalhes_proposta = {
  link_whatsapp_1: "11987654321",
  link_whatsapp_2: "(11) 98765-4321", // Formato formatado também funciona
};

// Resultado automático:
// {{LINK_WHATSAPP_1}} → "https://wa.me/11987654321" → "Fale conosco no WhatsApp" (🟢)
// {{LINK_WHATSAPP_2}} → "https://wa.me/11987654321" → "Fale conosco no WhatsApp" (🟢)
```

---

## 📋 Exemplo 4: Adicionar Tipo DRIVE Genérico

### Requisitos

- Campo: `link_drive_1` (para tipos não mapeados)
- Auto-detecta se é arquivo ou pasta
- Visual: Azul Google Drive padrão

### Solução

Já existe! Apenas use:

```javascript
const detalhes_proposta = {
  link_drive_1: "1ABC...",
  link_drive_2: "https://drive.google.com/drive/folders/1XYZ...",
};

// Resultado automático (sem configurar nada):
// {{LINK_DRIVE_1}} → auto-detecta e ajusta tipo
// {{LINK_DRIVE_2}} → auto-detecta como pasta
```

---

## 🏗️ Arquitetura de Suporte a Tipos Customizados

### Para Links Internos (Google Drive)

```
Entrada: "1ABC..." ou "https://drive.google.com/..."
         ↓
DriveIdExtractor.extract()
         ↓
Retorna: {id: "1ABC...", type: "file" ou "folder"}
         ↓
DriveUrlBuilder.buildAuto()
         ↓
Saída: "https://drive.google.com/file/d/1ABC.../view"
       ou
       "https://drive.google.com/drive/folders/1ABC..."
```

### Para Links Externos (YouTube, WhatsApp)

```
Entrada: "https://youtube.com/..." ou "11987654321"
         ↓
LinkProcessor.processField() (customizado por tipo)
         ↓
Processamento especial (formatação, validação)
         ↓
Saída: URL final pronta
```

---

## 🔧 Template: Novo Tipo Customizado

Se precisar criar um tipo totalmente customizado:

### 1. Defina no LinkRegistry

```javascript
CUSTOMIZADO: {
  type: 'custom',
  label: 'Seu Label Aqui',
  color: '#YOUR_HEX_COLOR',
  description: 'Descrição'
}
```

### 2. Adicione padrão ao LinkTypeDetector

```javascript
{ regex: /link_customizado/i, linkType: 'CUSTOMIZADO' }
```

### 3. Customize LinkProcessor se necessário

```javascript
// Dentro de LinkProcessor.processField(), após detectar tipo:
if (linkType === "CUSTOMIZADO") {
  // Sua lógica aqui
  const url = processCustomValue(value);
  return {
    placeholder,
    url,
    linkType,
    config: linkConfig,
    id: null,
    resourceType: "custom",
  };
}

function processCustomValue(value) {
  // Sua transformação aqui
  return transformedUrl;
}
```

### 4. Teste

```javascript
function testCustom() {
  const result = LinkProcessor.processAll({
    link_customizado_1: "seu_valor",
  });
  Logger.log(JSON.stringify(result, null, 2));
}
```

---

## 🎨 Guia de Cores

Use cores que se destacam em apresentações (fundo branco):

| Tipo     | Cor                | Código Hex | RGB          | Uso                |
| -------- | ------------------ | ---------- | ------------ | ------------------ |
| Proposta | 🔵 Azul Google     | `#1F8FE6`  | 31, 142, 230 | Padrão corporativo |
| Catálogo | 🟢 Verde Google    | `#34A853`  | 52, 168, 83  | Folders/coleções   |
| Vídeo    | 🔴 Vermelho Google | `#D33427`  | 211, 52, 39  | Ação/multimedia    |
| Manual   | 🟠 Laranja         | `#F57C00`  | 245, 124, 0  | Documentação       |
| Premium  | 🟣 Roxo            | `#8E24AA`  | 142, 36, 170 | Conteúdo premium   |
| Download | 🟦 Azul Escuro     | `#1565C0`  | 21, 101, 192 | Arquivos           |
| Info     | 🔵 Ciano           | `#00BCD4`  | 0, 188, 212  | Informações        |

---

## ✅ Checklist: Adicionando Novo Tipo

- [ ] Definiu nome do campo? (ex: `link_video_1`)
- [ ] Definiu label visual? (ex: "Vídeo de Demonstração")
- [ ] Selecionou cor? (ex: `#D33427`)
- [ ] Adicionou entrada ao `LinkRegistry`?
- [ ] Adicionou padrão ao `LinkTypeDetector`?
- [ ] Criou função de teste?
- [ ] Testou com dados reais?
- [ ] Atualizou documentação?
- [ ] Informou equipe sobre nova disponibilidade?

---

## 🚨 Problemas Comuns e Soluções

### Problema: "Tipo de link não reconhecido"

**Causa:** Padrão regex não está correto

**Solução:**

```javascript
// Verifique o padrão
const testKey = "link_video_1";
const regex = /link_video/i;
Logger.log("Match: " + regex.test(testKey));  // Deve ser true

// Adicione mais alternativas se necessário
{ regex: /link_video|video_link|link_vid/i, linkType: 'VIDEO' }
```

### Problema: Cor não aparece certa

**Causa:** Cor em formato errado ou inválida

**Solução:**

```javascript
// Use sempre formato hex com 6 dígitos
✅ "#1F8FE6"  // Correto
❌ "1F8FE6"   // Falta #
❌ "#1F8"     // Muito curto
❌ "blue"     // Não é hex

// Para validar:
const isValidHex = /#[0-9A-Fa-f]{6}/.test(color);
Logger.log("Cor válida: " + isValidHex);
```

### Problema: Link não funciona

**Causa:** URL inválida ou ID malformado

**Solução:**

```javascript
// Verifique ID extraído
const extracted = DriveIdExtractor.extract(value);
Logger.log("ID: " + extracted.id);
Logger.log("Tipo: " + extracted.type);

// Verifique URL gerada
const url = DriveUrlBuilder.buildAuto(extracted.id, extracted.type);
Logger.log("URL: " + url);

// Teste abrindo URL no navegador
```

---

## 📞 Suporte

Para questões:

1. Verifique se o padrão regex está correto
2. Teste com `LinkTypeDetector.detect()`
3. Verifique cores em formato hex válido
4. Use `Logger.log()` para debug

---

## 📚 Referência Rápida

### Adicionar tipo em 3 linhas

```javascript
// 1. LinkRegistry
VIDEO: { type: 'file', label: 'Vídeo', color: '#D33427' },

// 2. LinkTypeDetector
{ regex: /link_video/i, linkType: 'VIDEO' },

// 3. Usar
link_video_1: "1VIDEO_ID"
```

Pronto! 🚀
