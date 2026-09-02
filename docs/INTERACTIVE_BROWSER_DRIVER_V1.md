# Interactive Browser Driver V1

El driver interactivo usa Chrome headless real mediante CDP nativo. La configuración de viewport se aplica en el boundary reutilizable `setViewport`, y la geometría se valida con `Page.getLayoutMetrics`, `DOM.getBoxModel`, `getBoundingClientRect` y `elementFromPoint` antes de enviar `Input.dispatchMouseEvent`.

El driver soporta interacción CDP de teclado, typing UTF-8, foco, captura de consola/excepciones JavaScript, red, overflow y nuevos targets. `jefe-browser-quality.cjs` construye un `BrowserQualityReport` ligado a `candidateHash` y ejecuta los checks sobre URLs loopback (`127.0.0.1`, `localhost` o `::1`) servidas desde una raíz acotada; rechaza protocolos y hosts externos.

Los smokes usan perfiles y servidores temporales propios, sin sesión Chrome del usuario. El cleanup sólo cierra el WebSocket, el Chrome creado por el smoke, el servidor y el perfil temporal. Los artifacts comerciales permanecen independientes de Electron.

Limitaciones V1: el driver interactivo no ejecuta Human Gate, no llama proveedores externos y la integración de BrowserQuality al coordinador de calidad se realiza a través del gate de promoción existente; las acciones específicas de producto deben declarar sus selectores/configuración de forma explícita.
