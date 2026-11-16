# Escola dos Avós Beagle

Jogos educativos para crianças a partir dos 3 anos. Aplicação web estática (HTML + JavaScript + Three.js), instalável como PWA.

## Testar localmente
    py -m http.server 8000      (Windows)
    python3 -m http.server 8000 (macOS/Linux)
Abrir http://localhost:8000 (não abrir index.html por file://).

## Publicar
Alojamento estático (Vercel): Framework "Other", sem comando de build, diretório de saída vazio.
Nova versão: aumentar `VERSAO` em `sw.js` e o `?v=` do `app.js` em `index.html`.


## Animais 3D
Cão, gato, vaca e pato são modelos 3D com esqueleto em `modelos/animais/*.glb` (≈700 KB cada), carregados por `js/animais3d.js`:
passam pela quinta 3D (andam com as pernas e saltam) e pelas cartas dos desafios (andam no lugar e saltam ao toque).
As imagens `media/img/{cao,gato,vaca,pato}.webp` são renders desses modelos.
