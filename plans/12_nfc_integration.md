# NFC Integration ⚠️

URL-based NFC handling.

## Completed

- [x] `useNfc` composable for NFC context detection
- [x] Query parameter handling: `?source=nfc&event=eventName`
- [x] Welcome message generation based on NFC context
- [x] Reactive computed properties for NFC state

## Not Implemented

- [ ] Web NFC API reading/writing (requires HTTPS + Chrome on Android)
- [ ] NFC tag programming utility

Note: URL-based NFC flow is functional — NFC tags can be programmed to open a URL with query params. The Web NFC API for in-app reading/writing is deferred since it has limited browser support (Chrome Android only).
