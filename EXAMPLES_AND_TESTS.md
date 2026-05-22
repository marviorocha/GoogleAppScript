# Exemplos Práticos de Uso - LinkProcessor e Refatoração

## 📚 Exemplos de Uso

### Exemplo 1: Processamento Básico

```javascript
// Dados de entrada
const detalhes_proposta = {
  nome: "Cliente ABC",
  link_proposta_1: "1dEYlUC5QYmhsAVDS016QTrRD965jYlel",
  link_catalogo_1:
    "https://drive.google.com/drive/folders/1_zJK29lb5bzh1wB-EkagINL_nl0SX0iW?usp=drive_link",
};

// Processar todos os links
const linksMap = LinkProcessor.processAll(detalhes_proposta);

// Resultado:
// {
//   "{{LINK_PROPOSTA_1}}": {
//     "url": "https://drive.google.com/file/d/1dEYlUC5QYmhsAVDS016QTrRD965jYlel/view",
//     "config": {
//       "type": "file",
//       "label": "Proposta Técnica",
//       "color": "#1F8FE6"
//     },
//     "linkType": "PROPOSTA"
//   },
//   "{{LINK_CATALOGO_1}}": {
//     "url": "https://drive.google.com/drive/folders/1_zJK29lb5bzh1wB-EkagINL_nl0SX0iW",
//     "config": {
//       "type": "folder",
//       "label": "Catálogo de Produtos",
//       "color": "#34A853"
//     },
//     "linkType": "CATALOGO"
//   }
// }
```

### Exemplo 2: Adicionar Novo Tipo de Link (VIDEO)

#### Passo 1: Configurar LinkRegistry

```javascript
// Adicionar após MANUAL no LinkRegistry
VIDEO: {
  type: 'file',
  label: 'Vídeo de Demonstração',
  color: '#D33427',  // Vermelho Google
  description: 'Link para vídeo do produto'
},
```

#### Passo 2: Adicionar Padrão ao LinkTypeDetector

```javascript
// Adicionar antes do fallback em LinkTypeDetector.patterns
{ regex: /link_video/i, linkType: 'VIDEO' },
```

#### Passo 3: Usar na Proposta

```javascript
const detalhes_proposta = {
  link_video_1: "1VIDEO_DRIVE_ID_AQUI",
};

// Pronto! Automático:
// {{LINK_VIDEO_1}} → "Vídeo de Demonstração" (link vermelho)
```

---

## 🧪 Testes Unitários

### Teste 1: DriveIdExtractor

```javascript
function testDriveIdExtractor() {
  Logger.log("=== Teste DriveIdExtractor ===");

  // Teste 1: ID Puro
  let result = DriveIdExtractor.extract("1dEYlUC5QYmhsAVDS016QTrRD965jYlel");
  Logger.log("ID Puro: " + JSON.stringify(result));
  // Esperado: {id: "1dEYlUC5QYmhsAVDS016QTrRD965jYlel", type: "file"}

  // Teste 2: URL de Arquivo
  result = DriveIdExtractor.extract(
    "https://drive.google.com/file/d/1dEYlUC5QYmhsAVDS016QTrRD965jYlel/view"
  );
  Logger.log("URL Arquivo: " + JSON.stringify(result));
  // Esperado: {id: "1dEYlUC5QYmhsAVDS016QTrRD965jYlel", type: "file"}

  // Teste 3: URL de Pasta
  result = DriveIdExtractor.extract(
    "https://drive.google.com/drive/folders/1_zJK29lb5bzh1wB-EkagINL_nl0SX0iW?usp=drive_link"
  );
  Logger.log("URL Pasta: " + JSON.stringify(result));
  // Esperado: {id: "1_zJK29lb5bzh1wB-EkagINL_nl0SX0iW", type: "folder"}

  // Teste 4: URL com Sharing
  result = DriveIdExtractor.extract(
    "https://drive.google.com/file/d/1ABC/view?usp=sharing"
  );
  Logger.log("URL Sharing: " + JSON.stringify(result));
  // Esperado: {id: "1ABC", type: "file"}

  // Teste 5: Formato text()
  result = DriveIdExtractor.extract('text("1TEXT_FORMAT_ID_HERE")');
  Logger.log("Formato text(): " + JSON.stringify(result));
  // Esperado: {id: "1TEXT_FORMAT_ID_HERE", type: "file"}

  // Teste 6: Valor Nulo
  result = DriveIdExtractor.extract(null);
  Logger.log("Nulo: " + JSON.stringify(result));
  // Esperado: {id: null, type: null}

  // Teste 7: String Vazia
  result = DriveIdExtractor.extract("");
  Logger.log("Vazio: " + JSON.stringify(result));
  // Esperado: {id: null, type: null}

  // Teste 8: ID Muito Curto
  result = DriveIdExtractor.extract("ABC");
  Logger.log("ID Curto: " + JSON.stringify(result));
  // Esperado: {id: null, type: null}
}
```

### Teste 2: LinkTypeDetector

```javascript
function testLinkTypeDetector() {
  Logger.log("=== Teste LinkTypeDetector ===");

  let detectedType;

  detectedType = LinkTypeDetector.detect("link_proposta_1");
  Logger.log("link_proposta_1 → " + detectedType); // PROPOSTA

  detectedType = LinkTypeDetector.detect("LINK_CATALOGO_2");
  Logger.log("LINK_CATALOGO_2 → " + detectedType); // CATALOGO

  detectedType = LinkTypeDetector.detect("link_video_3");
  Logger.log("link_video_3 → " + detectedType); // VIDEO

  detectedType = LinkTypeDetector.detect("link_manual_1");
  Logger.log("link_manual_1 → " + detectedType); // MANUAL

  detectedType = LinkTypeDetector.detect("link_drive_custom");
  Logger.log("link_drive_custom → " + detectedType); // DRIVE

  detectedType = LinkTypeDetector.detect("link_unknown_type");
  Logger.log("link_unknown_type → " + detectedType); // DRIVE (fallback)

  detectedType = LinkTypeDetector.detect("random_field");
  Logger.log("random_field → " + detectedType); // DRIVE (fallback)
}
```

### Teste 3: DriveUrlBuilder

```javascript
function testDriveUrlBuilder() {
  Logger.log("=== Teste DriveUrlBuilder ===");

  // Teste 1: Arquivo
  let url = DriveUrlBuilder.build("1ABC", "file");
  Logger.log("Arquivo: " + url);
  // Esperado: https://drive.google.com/file/d/1ABC/view

  // Teste 2: Pasta
  url = DriveUrlBuilder.build("1ABC", "folder");
  Logger.log("Pasta: " + url);
  // Esperado: https://drive.google.com/drive/folders/1ABC

  // Teste 3: Padrão (arquivo)
  url = DriveUrlBuilder.build("1ABC");
  Logger.log("Padrão: " + url);
  // Esperado: https://drive.google.com/file/d/1ABC/view

  // Teste 4: Auto com tipo
  url = DriveUrlBuilder.buildAuto("1ABC", "folder");
  Logger.log("Auto (folder): " + url);
  // Esperado: https://drive.google.com/drive/folders/1ABC

  // Teste 5: Auto sem tipo (padrão file)
  url = DriveUrlBuilder.buildAuto("1ABC", null);
  Logger.log("Auto (null): " + url);
  // Esperado: https://drive.google.com/file/d/1ABC/view
}
```

### Teste 4: LinkProcessor

```javascript
function testLinkProcessor() {
  Logger.log("=== Teste LinkProcessor ===");

  const detalhes_proposta = {
    nome: "Cliente Teste",
    link_proposta_1: "1dEYlUC5QYmhsAVDS016QTrRD965jYlel",
    link_catalogo_1:
      "https://drive.google.com/drive/folders/1_zJK29lb5bzh1wB-EkagINL_nl0SX0iW?usp=drive_link",
    link_video_1: "1VIDEO_ID",
    link_manual_1: "https://drive.google.com/file/d/1MANUAL_ID/view",
    outro_campo: "valor qualquer",
  };

  // Processar um campo individual
  let field = LinkProcessor.processField(
    "link_proposta_1",
    detalhes_proposta.link_proposta_1
  );
  Logger.log("Campo individual: " + JSON.stringify(field));

  // Processar todos os campos
  const links = LinkProcessor.processAll(detalhes_proposta);
  Logger.log("Todos os links: " + JSON.stringify(links, null, 2));

  // Verificar resultados
  Logger.log("Quantidade de links encontrados: " + Object.keys(links).length);
  // Esperado: 4 (proposta, catalogo, video, manual)

  Logger.log("Link de proposta URL: " + links["{{LINK_PROPOSTA_1}}"].url);
  Logger.log("Link de catálogo URL: " + links["{{LINK_CATALOGO_1}}"].url);
  Logger.log(
    "Link de vídeo config: " + JSON.stringify(links["{{LINK_VIDEO_1}}"].config)
  );
}
```

---

## 🔍 Testes de Integração

### Teste 5: Fluxo Completo

```javascript
function testIntegrationFlow() {
  Logger.log("=== Teste Integração Completa ===");

  // Simular dados de proposta completos
  const detalhes_proposta = {
    nome: "Empresa ABC Ltda",
    endereco: "Rua Principal, 123",
    link_proposta_1: "1dEYlUC5QYmhsAVDS016QTrRD965jYlel",
    link_proposta_2: "1_another_proposal_id",
    link_catalogo_1:
      "https://drive.google.com/drive/folders/1_zJK29lb5bzh1wB-EkagINL_nl0SX0iW?usp=drive_link",
    link_catalogo_2: "https://drive.google.com/drive/folders/1_second_catalog",
    link_video_1: "1VIDEO_DEMO",
    link_manual_1: "https://drive.google.com/file/d/1MANUAL/view?usp=sharing",
    preco_1: "$ 10.000,00",
  };

  // 1. Processar links
  const linksToProcess = LinkProcessor.processAll(detalhes_proposta);

  Logger.log("Passo 1 - Links processados:");
  for (const [placeholder, linkData] of Object.entries(linksToProcess)) {
    Logger.log(
      "  " +
        placeholder +
        " → " +
        linkData.config.label +
        " (" +
        linkData.config.color +
        ")"
    );
  }

  // 2. Verificar URLs
  Logger.log("\nPasso 2 - URLs construídas:");
  for (const [placeholder, linkData] of Object.entries(linksToProcess)) {
    Logger.log("  " + linkData.url);
  }

  // 3. Verificar tipos de recurso
  Logger.log("\nPasso 3 - Tipos de recurso:");
  Logger.log(
    "  PROPOSTA: " + linksToProcess["{{LINK_PROPOSTA_1}}"].config.type
  );
  Logger.log(
    "  CATALOGO: " + linksToProcess["{{LINK_CATALOGO_1}}"].config.type
  );

  // 4. Verificar formatação visual
  Logger.log("\nPasso 4 - Formatação visual:");
  Logger.log(
    "  PROPOSTA: " +
      linksToProcess["{{LINK_PROPOSTA_1}}"].config.label +
      " com cor " +
      linksToProcess["{{LINK_PROPOSTA_1}}"].config.color
  );
  Logger.log(
    "  CATALOGO: " +
      linksToProcess["{{LINK_CATALOGO_1}}"].config.label +
      " com cor " +
      linksToProcess["{{LINK_CATALOGO_1}}"].config.color
  );
}
```

---

## 📊 Comparação: Antes vs Depois

### Cenário: Adicionar Novo Tipo de Link (link_video)

#### ❌ ANTES (Código Original)

```javascript
// 1. Modificar gerarApresentacaoDoModelo()
const linksToProcess = {};
for (const [chave, valor] of Object.entries(detalhes_proposta)) {
  if (isImageKey(chave)) continue;
  const rawVal = valor === null || valor === undefined ? "" : String(valor);

  if (/link/i.test(chave) && rawVal) {
    const driveId = extractDriveIdFromValue(rawVal);
    if (driveId) {
      // ❌ Problema: Não diferencia tipos
      const url = `https://drive.google.com/file/d/${driveId}/view`;
      linksToProcess[`{{${chave.toUpperCase()}}}`] = url;
      continue;
    }
  }
  // ...
}

// 2. Modificar replaceAllLinksInSlide()
function replaceAllLinksInSlide(slide, linksMap, label) {
  // ❌ Label hardcoded: sempre "LINK PROPOSTA"
  // ❌ Cor hardcoded: sempre branca
  // ❌ Sem underline
}

// 3. Resultado: Todos os links se parecem iguais
// {{LINK_VIDEO_1}} tem mesma cor/label que {{LINK_PROPOSTA_1}}
```

**Linhas modificadas:** 30+
**Arquivo modificados:** 1
**Complexidade:** Alta
**Risco:** Alto (pode quebrar código existente)

#### ✅ DEPOIS (Código Refatorado)

```javascript
// Adicione uma entrada ao LinkRegistry:
const LinkRegistry = {
  // ... existentes
  VIDEO: {
    type: "file",
    label: "Vídeo de Demonstração",
    color: "#D33427",
    description: "Link para vídeo do produto",
  },
};

// Adicione um padrão ao LinkTypeDetector:
class LinkTypeDetector {
  static patterns = [
    // ... existentes
    { regex: /link_video/i, linkType: "VIDEO" },
  ];
}

// Pronto! Basta usar:
// link_video_1: "1VIDEO_ID"

// Resultado automático:
// {{LINK_VIDEO_1}} → "Vídeo de Demonstração" (link vermelho com underline)
```

**Linhas modificadas:** 3
**Arquivos modificados:** 1
**Complexidade:** Mínima
**Risco:** Zero

---

## 🚀 Migração do Código Legado

Se você tem código antigo chamando as funções antigas:

```javascript
// ❌ CÓDIGO ANTIGO (ainda funciona)
function oldFunction() {
  const id = extractDriveIdFromValue(value);
  const url = `https://drive.google.com/file/d/${id}/view`;
  replaceAllLinksInSlide(slide, { "{{LINK}}": url }, "Meu Link");
}

// ✅ NOVO (recomendado)
function newFunction() {
  const extracted = DriveIdExtractor.extract(value);
  const url = DriveUrlBuilder.buildAuto(extracted.id, extracted.type);

  const linksMap = {
    "{{LINK}}": {
      url,
      config: LinkRegistry.PROPOSTA,
    },
  };

  ImprovedLinkReplacer.replaceAllInSlide(slide, linksMap);
}
```

**Ambas funcionam!** A nova é apenas melhor e mais escalável.

---

## 💡 Dicas de Debugging

### Problema: Link não aparece

```javascript
// 1. Verifique se o campo é detectado
const linkType = LinkTypeDetector.detect("link_campo_1");
Logger.log("Tipo detectado: " + linkType);

// 2. Verifique se o ID foi extraído
const extracted = DriveIdExtractor.extract(value);
Logger.log("ID extraído: " + extracted.id);

// 3. Verifique se o tipo de recurso foi detectado
Logger.log("Tipo de recurso: " + extracted.type);

// 4. Verifique a URL gerada
const url = DriveUrlBuilder.buildAuto(extracted.id, extracted.type);
Logger.log("URL: " + url);
```

### Problema: Cores erradas

```javascript
// Verifique a configuração de LinkRegistry
Logger.log(JSON.stringify(LinkRegistry, null, 2));

// Verifique se a configuração está sendo usada
const processed = LinkProcessor.processField(key, value);
Logger.log("Config usada: " + JSON.stringify(processed.config));
```

---

## 📝 Checklist de Testes

Antes de usar em produção, execute:

- [ ] `testDriveIdExtractor()` - Todos os formatos
- [ ] `testLinkTypeDetector()` - Detecção de tipos
- [ ] `testDriveUrlBuilder()` - Construção de URLs
- [ ] `testLinkProcessor()` - Processamento batch
- [ ] `testIntegrationFlow()` - Fluxo completo

Todos devem passar sem erros.
