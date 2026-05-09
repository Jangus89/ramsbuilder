export const metadata = {
  title: 'SafeFlow RAMS Builder',
  description: 'Generate RAMS documents from job details, documents, and site photos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <script
          id="safeflow-service-worker"
          dangerouslySetInnerHTML={{
            __html: `
            if ('serviceWorker' in navigator) {
              var isLocalHost = /^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/.test(window.location.hostname);
              if (${JSON.stringify(process.env.NODE_ENV)} === 'production' && !isLocalHost) {
                navigator.serviceWorker.register('/sw.js').catch(function () {});
              } else {
                navigator.serviceWorker.getRegistrations()
                  .then(function (registrations) {
                    registrations.forEach(function (registration) { registration.unregister(); });
                  })
                  .catch(function () {});
                if (window.caches) {
                  caches.keys()
                    .then(function (keys) {
                      keys.filter(function (key) { return key.indexOf('safeflow-') === 0; })
                        .forEach(function (key) { caches.delete(key); });
                    })
                    .catch(function () {});
                }
              }
            }
          `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
