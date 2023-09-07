# ⏱️ perfwatch

App for watching performance changes during local development.

```sh
npm install
npm start
```

```html
<!-- ⏱️ perfwatch - ONLY FOR LOCAL DEVELOPMENT -->
<script async src="http://localhost:1873/perfwatch.js"></script>
```

_TODO: Update screenshot..._

![Screenshot of perfwatch prototype](./images/2023-09-04-perfwatch-prototype-v0.1.0.jpg)

## Notes

- Built with Electron. https://www.electronjs.org/docs/latest/tutorial/quick-start

## TODOs

- [ ] Document adblockers blocking cross-origin beacons to localhost.
- [ ] Troubleshoot custom service worker throwing `The FetchEvent for "http://localhost:1873/perfwatch.js" resulted in a network error response: an object that was not a Response was passed to respondWith().`
