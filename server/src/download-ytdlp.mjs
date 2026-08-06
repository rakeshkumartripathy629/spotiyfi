import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const moduleDir = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', 'node_modules', 'youtube-dl-exec')
const binDir = join(moduleDir, 'bin')
const target = join(binDir, 'yt-dlp')

if (existsSync(target)) {
  console.log('yt-dlp binary already present, skipping download')
  process.exit(0)
}

const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'
console.log('Downloading yt-dlp binary for build-time caching...')
try {
  execSync(`mkdir -p ${binDir} && curl -fL --retry 3 -o ${target} ${url} && chmod +x ${target}`, { stdio: 'inherit', timeout: 180000 })
  console.log('yt-dlp downloaded successfully')
} catch (err) {
  console.error('yt-dlp download failed:', err.message)
  process.exit(1)
}
