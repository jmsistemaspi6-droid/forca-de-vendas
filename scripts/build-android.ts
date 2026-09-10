import { spawnSync, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🚀 JM Sistemas - Automação de Build Android (AAB)');
console.log('====================================================\n');

const rootDir = process.cwd();
const androidDir = path.join(rootDir, 'android');
const distDir = path.join(rootDir, 'dist');
const androidAssetsDir = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public');

// 1. Verificar Keystore
const keystoreLocations = [
  path.join(rootDir, 'vendapro.jks'),
  path.join(androidDir, 'vendapro.jks'),
  path.join(androidDir, 'app', 'vendapro.jks'),
];

const foundKeystore = keystoreLocations.find((loc) => fs.existsSync(loc));
if (foundKeystore) {
  console.log(`🔑 Keystore de produção encontrada em: ${foundKeystore}`);
} else {
  console.log('⚠️ AVISO: Arquivo "vendapro.jks" não encontrado na raiz.');
  console.log('👉 Lembre-se de colocar "vendapro.jks" na raiz do projeto para assinar o release.\n');
}

// 2. Compilar Web Assets (Vite)
console.log('📦 Passo 1/3: Compilando frontend web com Vite...');
try {
  execSync('npx vite build', { stdio: 'inherit', cwd: rootDir });
  console.log('✅ Build do frontend web concluído com sucesso.\n');
} catch (error) {
  console.error('❌ Erro durante o build web com Vite.');
  process.exit(1);
}

// 3. Sincronizar assets para pasta do Android
console.log('📂 Passo 2/3: Sincronizando arquivos estáticos para o Android...');
try {
  if (fs.existsSync(distDir)) {
    fs.mkdirSync(androidAssetsDir, { recursive: true });
    fs.cpSync(distDir, androidAssetsDir, { recursive: true });
    console.log(`✅ Assets sincronizados em ${androidAssetsDir}\n`);
  }
} catch (err) {
  console.warn('⚠️ Nota sobre cópia de assets:', err);
}

// 4. Executar Gradle bundleRelease
console.log('🤖 Passo 3/3: Executando compilação do pacote Android (.AAB)...');
const isWindows = process.platform === 'win32';
let gradlewCmd = isWindows ? path.join(androidDir, 'gradlew.bat') : path.join(androidDir, 'gradlew');

// Se gradlew não existir ou não for executável, tenta chamar 'gradle' do sistema
let cmdToRun = gradlewCmd;
let args = ['bundleRelease'];

if (!fs.existsSync(gradlewCmd)) {
  cmdToRun = 'gradle';
} else if (!isWindows) {
  try {
    fs.chmodSync(gradlewCmd, '755');
  } catch (e) {
    // ignore
  }
}

console.log(`Executando: ${cmdToRun} bundleRelease dentro de /android ...\n`);

const buildResult = spawnSync(cmdToRun, args, {
  cwd: androidDir,
  stdio: 'inherit',
  shell: true,
});

if (buildResult.status === 0) {
  console.log('\n====================================================');
  console.log('🎉 SUCESSO! Pacote Android (.AAB) gerado com sucesso!');
  console.log('====================================================');
  console.log('📁 Localização do arquivo:');
  console.log('   android/app/build/outputs/bundle/release/app-release.aab');
  console.log('====================================================\n');
} else {
  console.log('\n💡 DICA DE AMBIENTE:');
  console.log('Se o Gradle solicitou o Java SDK ou Android SDK:');
  console.log('1. Certifique-se de que o JDK 17 e o Android Studio / SDK estão instalados.');
  console.log('2. Você também pode abrir a pasta "android" diretamente no Android Studio e clicar em:');
  console.log('   Build -> Generate Signed Bundle / APK -> Android App Bundle.');
}
