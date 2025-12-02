import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/components/forms': path.resolve(__dirname, './src/components/forms'),
      '@/assets': path.resolve(__dirname, './src/assets'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
    }
  },
  css: {
    modules: {
    // Genera nombres de clase unicos
     generateScopedName: '[name]__[local]___[hash:base64:5]',
    // En desarrollo nombres mas legibles    
     localsConvention: 'camelCaseOnly'

    }
  }
})
