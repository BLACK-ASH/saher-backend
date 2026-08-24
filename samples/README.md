# Upload samples — manual verification kit

One real file per accepted format. Images are genuine rasters (backend runs Sharp →
WebP conversion on them); documents are valid Office/PDF containers.

| File | Endpoint field | mimetype sent by curl |
|---|---|---|
| sample-image.png / .jpg / .webp / .avif | `image` | image/png, image/jpeg, image/webp, image/avif |
| sample-document.pdf | `document` | application/pdf |
| sample-document.docx | `document` | ...wordprocessingml.document |
| sample-document.pptx | `document` | ...presentationml.presentation |
| sample-document.xlsx | `document` | ...spreadsheetml.sheet |

## Quick tests (backend on :4000, logged-in cookie jar)

```bash
# 0. login once (adjust email/password)
curl -c cookies.txt -X POST localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@saher.com","password":"password123456"}'

# 1. single image → 201, data.url ends with .webp (Sharp conversion proof)
curl -s -b cookies.txt -X POST localhost:4000/api/upload/image \
  -F 'image=@samples/sample-image.png' -F 'name=Sample PNG'

# 2. bulk images → 201, data array length 2
curl -s -b cookies.txt -X POST localhost:4000/api/upload/images \
  -F 'images=@samples/sample-image.jpg' -F 'images=@samples/sample-image.webp'

# 3. single document → 201
curl -s -b cookies.txt -X POST localhost:4000/api/upload/document \
  -F 'document=@samples/sample-document.pdf' -F 'name=Sample PDF'
# repeat with .docx / .pptx / .xlsx

# 4. bulk documents → 201
curl -s -b cookies.txt -X POST localhost:4000/api/upload/documents \
  -F 'documents=@samples/sample-document.docx' -F 'documents=@samples/sample-document.xlsx'

# negative cases
# wrong type (text file)        → 400 File Validation Failed.
echo hello > /tmp/x.txt && curl -s -b cookies.txt -X POST localhost:4000/api/upload/image \
  -F 'image=@/tmp/x.txt' -F 'name=bad'
# oversize (>5 MB image)        → 413 File Too Large.
dd if=/dev/zero of=/tmp/big.png bs=1M count=6 2>/dev/null && curl -s -b cookies.txt -o /dev/null -w '%{http_code}\n' \
  -X POST localhost:4000/api/upload/image -F 'image=@/tmp/big.png' -F 'name=big'
```

## What to eyeball in responses
- `data.url` is **relative** (`/uploads/images/<uuid>.webp`) — served by the backend static handler.
- Single image includes `width`/`height` (≤1024 wide after resize); bulk items do not.
- Each success creates a row in the `mediauploads` collection (`alt` = name/original filename).

Regenerate anytime: `node scripts/make-upload-samples.mjs`
