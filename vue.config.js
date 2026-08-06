const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 3000,
    host: '0.0.0.0',  // 모든 네트워크 인터페이스에서 접근 허용
    client: {
      overlay: {
        runtimeErrors: (error) => {
          const ignoreErrors = [
            "ResizeObserver loop limit exceeded",
            "ResizeObserver loop completed with undelivered notifications"
          ]
          if (ignoreErrors.some(e => error.message.includes(e))) {
            return false
          }
          return true
        }
      }
    }
  }
})
