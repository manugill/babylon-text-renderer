import raqm from './raqm.wasm'

export interface Shaping {
  symbol: string
  glyphId: number
  xAdvance: number
  yAdvance: number
  xOffset: number
  yOffset: number
  cluster: number
  fontIndex: number
}

enum HB_MEMORY_MODE {
  HB_MEMORY_MODE_DUPLICATE,
  HB_MEMORY_MODE_READONLY,
  HB_MEMORY_MODE_WRITABLE,
  HB_MEMORY_MODE_READONLY_MAY_MAKE_WRITABLE
}

// enum RAQM_DIRECTION {
//   RAQM_DIRECTION_DEFAULT,
//   RAQM_DIRECTION_RTL,
//   RAQM_DIRECTION_LTR,
//   RAQM_DIRECTION_TTB
// }

raqm.memory.grow(400) // each page is 64kb in size

const heapu8 = new Uint8Array(raqm.memory.buffer)
const heapu32 = new Uint32Array(raqm.memory.buffer)
const heapi32 = new Int32Array(raqm.memory.buffer)

const utf8Encoder = new TextEncoder()

const getTextShaping = (
  text: string,
  fontBlob: ArrayBuffer,
  lang: string,
  direction: number
): Shaping[] => {
  const fontBuffer = raqm.malloc(fontBlob.byteLength)
  heapu8.set(new Uint8Array(fontBlob), fontBuffer)

  const blob = raqm.hb_blob_create(
    fontBuffer,
    fontBlob.byteLength,
    HB_MEMORY_MODE.HB_MEMORY_MODE_WRITABLE,
    0,
    0
  )

  const encodedLang = utf8Encoder.encode(lang)
  const encodedLang_ptr = raqm.malloc(encodedLang.byteLength)
  heapu8.set(encodedLang, encodedLang_ptr)

  const face = raqm.hb_face_create(blob, 0) // second parameter is ttc index
  raqm.hb_blob_destroy(blob)

  const font = raqm.hb_font_create(face)
  raqm.hb_face_destroy(face)
  //raqm.hb_font_set_scale(font, 20 * 72, 20 * 72) // remove this line if you want to have unscaled

  // const font2 = raqm.hb_font_create(face)
  // raqm.hb_font_set_scale(font, 40 * 64, 40 * 64)

  // const font3 = raqm.hb_font_create(face)
  // raqm.hb_font_set_scale(font, 20 * 64, 20 * 64)

  const fonts = [font /*, font2, font3*/]
  const rq = raqm.raqm_create()
  const encodedText = utf8Encoder.encode(text)
  const encodedText_ptr = raqm.malloc(encodedText.byteLength)
  heapu8.set(encodedText, encodedText_ptr)
  raqm.raqm_set_text_utf8(rq, encodedText_ptr, encodedText.byteLength)
  raqm.free(encodedText_ptr)

  raqm.raqm_set_harfbuzz_font_range(rq, font, 0, encodedText.byteLength)
  //raqm.raqm_set_harfbuzz_font_range(rq, font2, 1, 5)
  //raqm.raqm_set_harfbuzz_font_range(rq, font3, 6, 1)
  raqm.hb_font_destroy(font) // rq will hold a reference to font
  //raqm.hb_font_destroy(font2) // rq will hold a reference to font2
  //raqm.hb_font_destroy(font3) // rq will hold a reference to font3
  raqm.raqm_set_par_direction(rq, direction)
  raqm.raqm_set_language(rq, encodedLang_ptr, 0, encodedText.byteLength)
  raqm.free(encodedLang_ptr)
  raqm.raqm_layout(rq)

  const count_ptr = raqm.malloc(4)
  const glyphs = raqm.raqm_get_glyphs(rq, count_ptr) / 4
  const count = heapu32[count_ptr / 4]
  raqm.free(count_ptr)

  const result: Shaping[] = []
  for (let i = 0; i < count; ++i) {
    const ptrOffset = glyphs + i * 7
    const cluster = heapu32[ptrOffset + 5]

    result.push({
      symbol: text[cluster],
      glyphId: heapu32[ptrOffset + 0],
      xAdvance: heapu32[ptrOffset + 1],
      yAdvance: heapu32[ptrOffset + 2],
      xOffset: heapi32[ptrOffset + 3],
      yOffset: heapi32[ptrOffset + 4],
      cluster,
      fontIndex: fonts.indexOf(heapu32[ptrOffset + 6])
    })
  }

  // Cleanup
  raqm.raqm_destroy(rq)
  raqm.free(fontBuffer)

  return result
}

export { getTextShaping }
