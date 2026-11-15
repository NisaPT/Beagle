# Escola dos Avós Beagle

Jogos educativos para crianças a partir dos 3 anos. Aplicação web estática (HTML + JavaScript + Three.js), instalável como PWA.

## Testar localmente
    py -m http.server 8000      (Windows)
    python3 -m http.server 8000 (macOS/Linux)
Abrir http://localhost:8000 (não abrir index.html por file://).

## Publicar
Alojamento estático (Vercel): Framework "Other", sem comando de build, diretório de saída vazio.
Nova versão: aumentar `VERSAO` em `sw.js` e o `?v=` do `app.js` em `index.html`.
