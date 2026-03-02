# /upload-screenshots

Upload design screenshots to a ReviewBoard project. Supports single file or batch directory upload.

## Usage
```
/upload-screenshots [project-name] [image-file-or-directory]
```

## Arguments
- `project-name` (required): Name of the target project
- `image-file-or-directory` (required): Path to a single image file or directory containing images

## Steps

1. Resolve the project by name via `GET /projects?search={project-name}`
2. Determine upload mode:
   - **Single file**: Upload one screenshot. Filename (without extension) becomes the screen name.
   - **Directory**: Batch-upload all image files (PNG, JPG, JPEG). Each filename becomes a screen name.

3. For each image:
   a. Check if a screen with that name exists in the project
   b. If not, create the screen via `POST /projects/:projectId/screens`
   c. Upload the screenshot via `POST /screens/:screenId/screenshots` (multipart/form-data)
   d. Version auto-increments (v1, v2, v3...)

4. Show upload preview with confirmation before proceeding
5. Print summary of uploaded screens with version numbers

## Example — Single File
```
/upload-screenshots "E-Commerce App" ./designs/Home_V2_Final.png
```

Output:
```
Uploading to: E-Commerce App
  Home_V2_Final → v3 (updated)
Upload complete: 1 screen updated.
```

## Example — Batch Directory
```
/upload-screenshots "E-Commerce App" ./designs/
```

Output:
```
Uploading to: E-Commerce App
  Home_V2_Final.png → v3 (updated)
  Product_Detail_V1.png → v1 (new)
  Checkout_Flow_Step1.png → v2 (updated)
Upload complete: 3 screens (1 new, 2 updated).
```
