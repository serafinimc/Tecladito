# Guion de generación de audios

Este documento conserva el texto y el orden usados para generar los audios del modo de repetición. No corregir las grafías fonéticas (`Sé`, `Sero`, `Sinco`) sin volver a generar el audio correspondiente.

## Archivos fuente

| Bloque | Archivo | Segmentos esperados |
| --- | --- | ---: |
| Preguntas | `public/audio/prompts/All prompts.mp3` | 37 |
| Felicitaciones | `public/audio/praise/All praise together.mp3` | 6 |
| Respuestas | `public/audio/feedback/All feedback.mp3` | 37 |
| Caracteres | `public/audio/characters/letras_y_numeros/All characters.mp3` | 37 |

Los bloques de 37 segmentos siguen este orden:

```text
a, b, c, d, e, f, g, h, i, j, k, l, m, n, ñ, o, p, q, r, s, t, u, v, w, x, y, z,
0, 1, 2, 3, 4, 5, 6, 7, 8, 9
```

## Archivos resultantes

Los masters fueron divididos usando silencios de al menos `0.25 s` por debajo de `-40 dB`, conservando `0.07 s` de margen alrededor de cada voz. Los cortes se codificaron como MP3 a `128 kbps`.

- Preguntas: `public/audio/prompts/{carácter}.mp3`
- Felicitaciones: `public/audio/praise/{nombre}.mp3`
- Respuestas: `public/audio/feedback/{carácter}.mp3`
- Caracteres: `public/audio/characters/{carácter}.mp3`

Los cuatro archivos `All *.mp3` se conservan como masters originales.

## Prompts

```text
[curious] ¿Dónde está la letra A?

[curious] ¿Dónde está la letra ve larga?

[curious] ¿Dónde está la letra ce?

[curious] ¿Dónde está la letra de?

[curious] ¿Dónde está la letra E?

[curious] ¿Dónde está la letra efe?

[curious] ¿Dónde está la letra ge?

[curious] ¿Dónde está la letra hache?

[curious] ¿Dónde está la letra I?

[curious] ¿Dónde está la letra jota?

[curious] ¿Dónde está la letra ka?

[curious] ¿Dónde está la letra ele?

[curious] ¿Dónde está la letra eme?

[curious] ¿Dónde está la letra ene?

[curious] ¿Dónde está la letra eñe?

[curious] ¿Dónde está la letra O?

[curious] ¿Dónde está la letra pe?

[curious] ¿Dónde está la letra cu?

[curious] ¿Dónde está la letra erre?

[curious] ¿Dónde está la letra ese?

[curious] ¿Dónde está la letra te?

[curious] ¿Dónde está la letra U?

[curious] ¿Dónde está la letra ve corta?

[curious] ¿Dónde está la letra doble ve?

[curious] ¿Dónde está la letra equis?

[curious] ¿Dónde está la letra i griega?

[curious] ¿Dónde está la letra zeta?

[curious] ¿Dónde está el número cero?

[curious] ¿Dónde está el número uno?

[curious] ¿Dónde está el número dos?

[curious] ¿Dónde está el número tres?

[curious] ¿Dónde está el número cuatro?

[curious] ¿Dónde está el número cinco?

[curious] ¿Dónde está el número seis?

[curious] ¿Dónde está el número siete?

[curious] ¿Dónde está el número ocho?

[curious] ¿Dónde está el número nueve?
```

## Praise

```text
[cheerfully] ¡Excelente!

[cheerfully] ¡Muy bien!

[cheerfully] ¡Sí!

[cheerfully] ¡Eso!

[cheerfully] ¡Perfecto!

[cheerfully] ¡Genial!
```

El orden sugerido para nombrar los cortes es:

```text
excelente, muy-bien, si, eso, perfecto, genial
```

## Feedback

```text
[cheerfully] ¡Esa es la letra A!

[cheerfully] ¡Esa es la letra ve larga!

[cheerfully] ¡Esa es la letra ce!

[cheerfully] ¡Esa es la letra de!

[cheerfully] ¡Esa es la letra E!

[cheerfully] ¡Esa es la letra efe!

[cheerfully] ¡Esa es la letra ge!

[cheerfully] ¡Esa es la letra hache!

[cheerfully] ¡Esa es la letra I!

[cheerfully] ¡Esa es la letra jota!

[cheerfully] ¡Esa es la letra ka!

[cheerfully] ¡Esa es la letra ele!

[cheerfully] ¡Esa es la letra eme!

[cheerfully] ¡Esa es la letra ene!

[cheerfully] ¡Esa es la letra eñe!

[cheerfully] ¡Esa es la letra O!

[cheerfully] ¡Esa es la letra pe!

[cheerfully] ¡Esa es la letra cu!

[cheerfully] ¡Esa es la letra erre!

[cheerfully] ¡Esa es la letra ese!

[cheerfully] ¡Esa es la letra te!

[cheerfully] ¡Esa es la letra U!

[cheerfully] ¡Esa es la letra ve corta!

[cheerfully] ¡Esa es la letra doble ve!

[cheerfully] ¡Esa es la letra equis!

[cheerfully] ¡Esa es la letra i griega!

[cheerfully] ¡Esa es la letra zeta!

[cheerfully] ¡Ese es el número cero!

[cheerfully] ¡Ese es el número uno!

[cheerfully] ¡Ese es el número dos!

[cheerfully] ¡Ese es el número tres!

[cheerfully] ¡Ese es el número cuatro!

[cheerfully] ¡Ese es el número cinco!

[cheerfully] ¡Ese es el número seis!

[cheerfully] ¡Ese es el número siete!

[cheerfully] ¡Ese es el número ocho!

[cheerfully] ¡Ese es el número nueve!
```

## Characters

```text
[con claridad] A.
[pausa]
[con claridad] Ve larga.
[pausa]
[con claridad] Sé.
[pausa]
[con claridad] De.
[pausa]
[con claridad] E.
[pausa]
[con claridad] Efe.
[pausa]
[con claridad] Ge.
[pausa]
[con claridad] Hache.
[pausa]
[con claridad] I.
[pausa]
[con claridad] Jota.
[pausa]
[con claridad] Ka.
[pausa]
[con claridad] Ele.
[pausa]
[con claridad] Eme.
[pausa]
[con claridad] Ene.
[pausa]
[con claridad] Eñe.
[pausa]
[con claridad] O.
[pausa]
[con claridad] Pe.
[pausa]
[con claridad] Cu.
[pausa]
[con claridad] Erre.
[pausa]
[con claridad] Ese.
[pausa]
[con claridad] Te.
[pausa]
[con claridad] U.
[pausa]
[con claridad] Ve corta.
[pausa]
[con claridad] Doble ve.
[pausa]
[con claridad] Equis.
[pausa]
[con claridad] I griega.
[pausa]
[con claridad] Zeta.
[pausa]
[con claridad] Sero.
[pausa]
[con claridad] Uno.
[pausa]
[con claridad] Dos.
[pausa]
[con claridad] Tres.
[pausa]
[con claridad] Cuatro.
[pausa]
[con claridad] Sinco.
[pausa]
[con claridad] Seis.
[pausa]
[con claridad] Siete.
[pausa]
[con claridad] Ocho.
[pausa]
[con claridad] Nueve.
```
