import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '..', 'dist');
const androidAssetsDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');
const wrapperJarPath = path.join(__dirname, '..', 'android', 'gradle', 'wrapper', 'gradle-wrapper.jar');
const gradlewPath = path.join(__dirname, '..', 'android', 'gradlew');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed with status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function main() {
  console.log('--- [1/2] Copiando Web Assets para Android ---');
  if (fs.existsSync(distDir)) {
    if (fs.existsSync(androidAssetsDir)) {
      fs.rmSync(androidAssetsDir, { recursive: true, force: true });
    }
    fs.mkdirSync(androidAssetsDir, { recursive: true });
    copyRecursiveSync(distDir, androidAssetsDir);
    console.log('✅ Web assets copiados com sucesso para:', androidAssetsDir);
  } else {
    console.log('⚠️ Pasta dist não encontrada, pulando cópia de assets.');
  }

  console.log('--- [2/2] Verificando Gradle Wrapper JAR ---');
  const wrapperDir = path.dirname(wrapperJarPath);
  if (!fs.existsSync(wrapperDir)) {
    fs.mkdirSync(wrapperDir, { recursive: true });
  }

  const needsDownload = !fs.existsSync(wrapperJarPath) || fs.statSync(wrapperJarPath).size < 10000;
  if (needsDownload) {
    console.log('Baixando gradle-wrapper.jar oficial...');
    const url = 'https://raw.githubusercontent.com/gradle/gradle/v8.5.0/gradle/wrapper/gradle-wrapper.jar';
    try {
      await downloadFile(url, wrapperJarPath);
      console.log('✅ gradle-wrapper.jar baixado com sucesso!');
    } catch (err) {
      console.error('⚠️ Falha ao baixar gradle-wrapper.jar:', err.message);
    }
  } else {
    console.log('✅ gradle-wrapper.jar já existe e está pronto.');
  }

  // Ensure gradlew has execution permissions on Linux/Unix
  if (fs.existsSync(gradlewPath)) {
    try {
      fs.chmodSync(gradlewPath, 0o755);
    } catch (e) {}
  }
}

main().catch(console.error);

