import { ElevenLabsClient } from "elevenlabs"
import { createWriteStream, mkdirSync, readFileSync } from "fs"
import { pipeline } from "stream/promises"

const scenario = JSON.parse(readFileSync('./scenarios/walking-home.json', 'utf8'))
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

for (const section of ['opening', 'loop', 'closing']) {
  const turns = scenario.sections[section]
  const dir = `./assets/audio/${scenario.id}/${section}`
  mkdirSync(dir, { recursive: true })
  console.log(`\n🎙️  Generating ${section} (${turns.length} lines)...`)

  for (const turn of turns) {
    try {
      const stream = await client.textToSpeech.convert(scenario.voice_id, {
        text: turn.ai_line,
        model_id: "eleven_turbo_v2",
        voice_settings: { stability: 0.55, similarity_boost: 0.80, style: 0.2 }
      })
      const outPath = `${dir}/${turn.audio_file}`
      await pipeline(stream, createWriteStream(outPath))
      console.log(`  ✅ ${turn.id} — ${turn.audio_file}`)
      await new Promise(r => setTimeout(r, 300))
    } catch (err) {
      console.error(`  ❌ ${turn.audio_file}: ${err.message}`)
    }
  }
}

console.log('\n✨ Done. All audio files ready.')