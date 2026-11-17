$src = "C:\Users\dell\Downloads\krishna-tracer-website-builder\public\favicon.png"
$destDir = "C:\Users\dell\Downloads\krishna-tracer-website-builder\public"

if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }

Add-Type -AssemblyName System.Drawing

function SaveResize($size, $outFile) {
    $img = [System.Drawing.Image]::FromFile($src)
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $size, $size)
    $g.Dispose()
    $img.Dispose()
    $bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

# Generate PNG favicons
SaveResize 16 (Join-Path $destDir "favicon-16x16.png")
SaveResize 32 (Join-Path $destDir "favicon-32x32.png")
SaveResize 180 (Join-Path $destDir "apple-touch-icon.png")
SaveResize 192 (Join-Path $destDir "android-chrome-192x192.png")
SaveResize 512 (Join-Path $destDir "android-chrome-512x512.png")

# Also copy original as favicon.png for fallback
Copy-Item -Path $src -Destination (Join-Path $destDir "favicon.png") -Force
