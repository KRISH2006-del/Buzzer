import { build } from 'vite';

async function runBuild() {
  console.log('🚀 Starting Vercel Vite Build via Node API...');
  await build();
  console.log('✅ Vercel Vite Build completed successfully!');
}

runBuild().catch((err) => {
  console.error('❌ Build error:', err);
  process.exit(1);
});
