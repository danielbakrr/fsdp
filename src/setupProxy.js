const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://githubbiesbackend.onrender.com',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    })
  );
};
