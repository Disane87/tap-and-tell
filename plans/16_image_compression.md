# Image Compression

Client-side image compression before upload.

## Features

- Resize large images to max dimensions (e.g., 1920px)
- Compress JPEG quality (80%)
- Convert non-JPEG formats to JPEG
- Show compression progress/preview
- Maintain aspect ratio

## Implementation

- `useImageCompression` composable
- Canvas-based resizing
- Update `PhotoUpload` component
- Target file size under 500KB
