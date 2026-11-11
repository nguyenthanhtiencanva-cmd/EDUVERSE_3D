Add-Type -AssemblyName System.Drawing

$texDir = "d:\ANTIGRAVITY\EDUVERSE_3D\assets\school\textures"
if (!(Test-Path $texDir)) {
    New-Item -ItemType Directory -Path $texDir | Out-Null
}

function New-SolidBrush($r, $g, $b, $a = 255) {
    return New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($a, $r, $g, $b))
}

function New-PenColor($r, $g, $b, $w = 2.0, $a = 255) {
    return New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($a, $r, $g, $b), $w)
}

function Draw-LotusEmblem([System.Drawing.Graphics]$g, [float]$cx, [float]$cy, [float]$r) {
    $goldBrush = New-SolidBrush 255 218 45
    $orangePen = New-PenColor 210 110 15 2.0
    # Draw 5 lotus petals
    foreach ($angDeg in @(-50, -25, 0, 25, 50)) {
        $state = $g.Save()
        $g.TranslateTransform($cx, $cy + $r * 0.35)
        $g.RotateTransform($angDeg)
        $rect = New-Object System.Drawing.RectangleF((-$r * 0.24), (-$r * 0.95), ($r * 0.48), ($r * 0.95))
        $g.FillEllipse($goldBrush, $rect)
        $g.DrawEllipse($orangePen, $rect)
        $g.Restore($state)
    }
    # Base Calyx
    $baseRect = New-Object System.Drawing.RectangleF(($cx - $r * 0.65), ($cy + $r * 0.15), ($r * 1.3), ($r * 0.32))
    $g.FillEllipse($goldBrush, $baseRect)
    $goldBrush.Dispose()
    $orangePen.Dispose()
}

function New-RedSloganBanner([string]$fileName, [string]$text, [int]$width = 1536, [int]$height = 180, [float]$fontSize = 50) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Deep crimson gradient background
    $rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 205, 18, 22),
        [System.Drawing.Color]::FromArgb(255, 168, 10, 14),
        90.0
    )
    $g.FillRectangle($grad, $rect)

    # Outer & inner gold border
    $goldPen1 = New-PenColor 255 220 55 5.0
    $goldPen2 = New-PenColor 255 235 120 2.0
    $g.DrawRectangle($goldPen1, 8, 8, $width - 16, $height - 16)
    $g.DrawRectangle($goldPen2, 16, 16, $width - 32, $height - 32)

    # Lotus emblems on left and right
    Draw-LotusEmblem $g 82 ($height * 0.50) ($height * 0.30)
    Draw-LotusEmblem $g ($width - 82) ($height * 0.50) ($height * 0.30)

    # Centered text with subtle drop shadow
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $shadowBrush = New-SolidBrush 75 0 0 210
    $goldBrush = New-SolidBrush 255 232 50 255
    $textRectShadow = New-Object System.Drawing.RectangleF(3, 4, $width, $height)
    $textRect = New-Object System.Drawing.RectangleF(0, 0, $width, $height)
    $g.DrawString($text, $font, $shadowBrush, $textRectShadow, $sf)
    $g.DrawString($text, $font, $goldBrush, $textRect, $sf)

    $outPath = Join-Path $texDir $fileName
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "[OK] Generated $fileName"
}

function New-BlueSloganBanner([string]$fileName, [string]$text, [int]$width = 1536, [int]$height = 160, [float]$fontSize = 44) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 42, 138, 228),
        [System.Drawing.Color]::FromArgb(255, 22, 98, 195),
        90.0
    )
    $g.FillRectangle($grad, $rect)

    $whitePen = New-PenColor 245 250 255 4.0
    $g.DrawRectangle($whitePen, 7, 7, $width - 14, $height - 14)

    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    # White halo outline + bold red text (exact match to Photo 2!)
    $whiteBrush = New-SolidBrush 255 255 255 255
    $redBrush = New-SolidBrush 220 22 25 255
    foreach ($ox in @(-3, 0, 3)) {
        foreach ($oy in @(-3, 0, 3)) {
            if ($ox -ne 0 -or $oy -ne 0) {
                $rOut = New-Object System.Drawing.RectangleF($ox, $oy, $width, $height)
                $g.DrawString($text, $font, $whiteBrush, $rOut, $sf)
            }
        }
    }
    $rMain = New-Object System.Drawing.RectangleF(0, 0, $width, $height)
    $g.DrawString($text, $font, $redBrush, $rMain, $sf)

    $outPath = Join-Path $texDir $fileName
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "[OK] Generated $fileName"
}

function U([string]$s) {
    return [System.Text.RegularExpressions.Regex]::Unescape($s)
}

# 1. Generate all Vietnamese Slogan Banners (100% Encoding-Safe Unicode)
New-RedSloganBanner "tex_slogan_stage.png" (U "QU\u1EA2N L\u00DD T\u1ED0T - D\u1EA0Y T\u1ED0T - H\u1ECCC T\u1ED0T") 1536 180 54
New-BlueSloganBanner "tex_slogan_tree_left.png" (U "V\u00CC L\u1EE2I \u00CDCH M\u01AF\u1EDCI N\u0102M TH\u00CC PH\u1EA2I TR\u1ED2NG C\u00C2Y") 1536 150 44
New-BlueSloganBanner "tex_slogan_tree_right.png" (U "V\u00CC L\u1EE2I \u00CDCH TR\u0102M N\u0102M TH\u00CC PH\u1EA2I TR\u1ED2NG NG\u01AF\u1EDCI") 1536 150 42
New-RedSloganBanner "tex_slogan_bld_c2.png" (U "\u201CD\u00D9 KH\u00D3 KH\u0102N \u0110\u1EBEN \u0110\u00C2U C\u0168NG PH\u1EA2I THI \u0110UA D\u1EA0Y T\u1ED0T, H\u1ECCC T\u1ED0T\u201D") 1600 160 38
New-RedSloganBanner "tex_slogan_bld_a_main.png" (U "M\u1ED6I TH\u1EA6Y GI\u00C1O, C\u00D4 GI\u00C1O L\u00C0 M\u1ED8T T\u1EA4M G\u01AF\u01A0NG \u0110\u1EA0O \u0110\u1EE8C, T\u1EF0 H\u1ECCC V\u00C0 S\u00C1NG T\u1EA0O") 2048 160 38
New-RedSloganBanner "tex_slogan_bld_a_sub.png" (U "TI\u00CAN H\u1ECCC L\u1EC4 - H\u1EACU H\u1ECCC V\u0102N") 1280 160 52
New-RedSloganBanner "tex_gate_sign.png" (U "TR\u01AF\u1edcNG TH & THCS V\u0128NH TH\u1EF0C  -  HI\u1EC0N T\u00C0I L\u00C0 NGUY\u00CAN KH\u00CD QU\u1ED0C GIA") 1600 200 40

# 2. Generate Dual Uncle Ho Pano (Real Portrait cropped from Photo 2 + Crisp Uncle Ho Letter on Right)
$stagePhotoPath = "d:\ANTIGRAVITY\EDUVERSE_3D\docs\ref_photo_bld_b_stage.jpg"
$srcImg = [System.Drawing.Bitmap]::FromFile($stagePhotoPath)
$panoW = 1024
$panoH = 512
$panoBmp = New-Object System.Drawing.Bitmap($panoW, $panoH)
$gp = [System.Drawing.Graphics]::FromImage($panoBmp)
$gp.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gp.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gp.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Gold outer frame background
$goldFrameBrush = New-SolidBrush 218 182 72
$gp.FillRectangle($goldFrameBrush, 0, 0, $panoW, $panoH)

# Crop real Uncle Ho & Pioneer portrait from ref_photo_bld_b_stage.jpg (x=422..493, y=268..338)
$srcRect = New-Object System.Drawing.Rectangle(422, 268, 71, 70)
$dstRectLeft = New-Object System.Drawing.Rectangle(20, 20, 472, 472)
$gp.DrawImage($srcImg, $dstRectLeft, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# Right side: Golden-yellow panel with Uncle Ho's letter
$dstRectRight = New-Object System.Drawing.Rectangle(512, 20, 492, 472)
$yellowLetterBrush = New-SolidBrush 242 224 122
$gp.FillRectangle($yellowLetterBrush, $dstRectRight)

$framePen = New-PenColor 165 125 32 6.0
$gp.DrawRectangle($framePen, 18, 18, 476, 476)
$gp.DrawRectangle($framePen, 510, 18, 496, 476)

$letterFont = New-Object System.Drawing.Font("Arial", 25, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$sigFont = New-Object System.Drawing.Font("Arial", 26, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$greenTextBrush = New-SolidBrush 24 98 58
$redTextBrush = New-SolidBrush 195 25 25
$sfCenter = New-Object System.Drawing.StringFormat
$sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
$sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center

$letterText = (U "\u201CNon s\u00F4ng Vi\u1EC7t Nam c\u00F3 tr\u1EDF n\u00EAn\nt\u01B0\u01A1i \u0111\u1EB9p hay kh\u00F4ng, d\u00E2n t\u1ED9c\nVi\u1EC7t Nam c\u00F3 b\u01B0\u1EDBc t\u1EDBi \u0111\u00E0i vinh\nquang \u0111\u1EC3 s\u00E1nh vai v\u1EDBi c\u00E1c\nc\u01B0\u1EDDng qu\u1ED1c n\u0103m ch\u00E2u \u0111\u01B0\u1EE3c\nhay kh\u00F4ng, ch\u00EDnh l\u00E0 nh\u1EDD m\u1ED9t\nph\u1EA7n l\u1EDBn \u1EDF c\u00F4ng h\u1ECDc t\u1EADp c\u1EE7a\nc\u00E1c em.\u201D")
$letterBox = New-Object System.Drawing.RectangleF(522, 30, 472, 375)
$gp.DrawString($letterText, $letterFont, $greenTextBrush, $letterBox, $sfCenter)
$sigBox = New-Object System.Drawing.RectangleF(522, 410, 472, 65)
$gp.DrawString((U "H\u1ED2 CH\u00CD MINH"), $sigFont, $redTextBrush, $sigBox, $sfCenter)

$panoBmp.Save((Join-Path $texDir "tex_uncle_ho_pano.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$gp.Dispose()
$panoBmp.Dispose()
$srcImg.Dispose()
Write-Output "[OK] Generated tex_uncle_ho_pano.png"

# 3. Generate Ornate Blue & Gold Planter Texture (tex_planter_blue_ornate.png)
$pw = 512; $ph = 256
$pbmp = New-Object System.Drawing.Bitmap($pw, $ph)
$pg = [System.Drawing.Graphics]::FromImage($pbmp)
$pg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$blueGrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle(0, 0, $pw, $ph)),
    [System.Drawing.Color]::FromArgb(255, 32, 92, 168),
    [System.Drawing.Color]::FromArgb(255, 18, 58, 118),
    90.0
)
$pg.FillRectangle($blueGrad, 0, 0, $pw, $ph)
$goldRimBrush = New-SolidBrush 228 190 58
$pg.FillRectangle($goldRimBrush, 0, 0, $pw, 24)
$pg.FillRectangle($goldRimBrush, 0, $ph - 22, $pw, 22)
$goldPenOrnate = New-PenColor 238 198 62 6.0
$pg.DrawRectangle($goldPenOrnate, 28, 42, $pw - 56, $ph - 84)
$pg.DrawRectangle($goldPenOrnate, 42, 56, $pw - 84, $ph - 112)
# Center gold relief medallion & scrolls
$pg.FillEllipse($goldRimBrush, ($pw/2 - 55), ($ph/2 - 35), 110, 70)
$pg.FillEllipse($goldRimBrush, 85, ($ph/2 - 22), 65, 44)
$pg.FillEllipse($goldRimBrush, ($pw - 150), ($ph/2 - 22), 65, 44)
$pbmp.Save((Join-Path $texDir "tex_planter_blue_ornate.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$pg.Dispose()
$pbmp.Dispose()
Write-Output "[OK] Generated tex_planter_blue_ornate.png"

# 4. Generate Procedural PBR Textures (Courtyard Concrete, Corrugated Red Roof Tile, Terracotta Steps, Granite, Grass)
$rng = New-Object System.Random(2026)

# 4A. Courtyard Concrete (512x512 with expansion joint grid & natural weathered aggregate)
$cw = 512; $ch = 512
$cbmp = New-Object System.Drawing.Bitmap($cw, $ch)
$cbump = New-Object System.Drawing.Bitmap($cw, $ch)
for ($y = 0; $y -lt $ch; $y++) {
    for ($x = 0; $x -lt $cw; $x++) {
        $n1 = [Math]::Sin($x * 0.045) * [Math]::Cos($y * 0.045) * 10.0
        $n2 = [Math]::Sin(($x + $y) * 0.12) * 6.0
        $grain = $rng.Next(-9, 10)
        $isJoint = (($x % 256) -lt 3) -or (($y % 256) -lt 3)
        if ($isJoint) {
            $val = 148 + ($grain / 2)
            $bval = 60
        } else {
            $val = [Math]::Min(242, [Math]::Max(165, [int](204 + $n1 + $n2 + $grain)))
            $bval = [Math]::Min(255, [Math]::Max(80, [int](145 + $n1 * 2 + $grain * 2)))
        }
        $cbmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $val, [int]($val * 0.99), [int]($val * 0.96)))
        $cbump.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $bval, $bval, $bval))
    }
}
$cbmp.Save((Join-Path $texDir "pbr_courtyard_concrete.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$cbump.Save((Join-Path $texDir "pbr_courtyard_concrete_bump.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$cbmp.Dispose(); $cbump.Dispose()
Write-Output "[OK] Generated pbr_courtyard_concrete.png + bump"

# 4B. Corrugated Red Roof Tiles (256x256)
$rw = 256; $rh = 256
$rbmp = New-Object System.Drawing.Bitmap($rw, $rh)
$rbump = New-Object System.Drawing.Bitmap($rw, $rh)
for ($y = 0; $y -lt $rh; $y++) {
    $courseShadow = if (($y % 32) -lt 4) { -28 } else { 0 }
    for ($x = 0; $x -lt $rw; $x++) {
        $wave = [Math]::Sin(($x % 16) / 16.0 * [Math]::PI * 2.0)
        $r = [Math]::Min(235, [Math]::Max(110, [int](194 + $wave * 22 + $courseShadow + $rng.Next(-4, 5))))
        $g = [Math]::Min(120, [Math]::Max(28, [int](58 + $wave * 9 + ($courseShadow / 2) + $rng.Next(-3, 4))))
        $b = [Math]::Min(85, [Math]::Max(18, [int](32 + $wave * 5 + ($courseShadow / 3))))
        $bval = [Math]::Min(255, [Math]::Max(20, [int](140 + $wave * 75 + $courseShadow * 2)))
        $rbmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $g, $b))
        $rbump.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $bval, $bval, $bval))
    }
}
$rbmp.Save((Join-Path $texDir "pbr_roof_red_tile.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$rbump.Save((Join-Path $texDir "pbr_roof_red_tile_bump.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$rbmp.Dispose(); $rbump.Dispose()
Write-Output "[OK] Generated pbr_roof_red_tile.png + bump"

# 4C. Pink-Red Granite & Beige Granite & Terracotta Tile & Lush Grass (256x256)
$gw = 256; $gh = 256
$granRed = New-Object System.Drawing.Bitmap($gw, $gh)
$granBeige = New-Object System.Drawing.Bitmap($gw, $gh)
$terraBmp = New-Object System.Drawing.Bitmap($gw, $gh)
$grassBmp = New-Object System.Drawing.Bitmap($gw, $gh)

for ($y = 0; $y -lt $gh; $y++) {
    for ($x = 0; $x -lt $gw; $x++) {
        # Speckled granite noise
        $speck = $rng.Next(-28, 29)
        $gr = [Math]::Min(220, [Math]::Max(95, 168 + $speck))
        $gg = [Math]::Min(140, [Math]::Max(40, 74 + [int]($speck * 0.7)))
        $gb = [Math]::Min(140, [Math]::Max(40, 70 + [int]($speck * 0.7)))
        $granRed.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $gr, $gg, $gb))

        $br = [Math]::Min(230, [Math]::Max(115, 182 + [int]($speck * 0.75)))
        $bg = [Math]::Min(205, [Math]::Max(95, 156 + [int]($speck * 0.65)))
        $bb = [Math]::Min(175, [Math]::Max(70, 120 + [int]($speck * 0.60)))
        $granBeige.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $br, $bg, $bb))

        # Terracotta tile with mortar joints every 64px
        $isMortar = (($x % 64) -lt 2) -or (($y % 64) -lt 2)
        if ($isMortar) {
            $terraBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 205, 188, 175))
        } else {
            $tn = $rng.Next(-6, 7)
            $terraBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, (182 + $tn), (48 + [int]($tn/2)), (42 + [int]($tn/2))))
        }

        # Lush green grass
        $gn = $rng.Next(-14, 15) + [int]([Math]::Sin($x * 0.08) * [Math]::Cos($y * 0.08) * 8)
        $grassBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, [Math]::Max(35, 68 + $gn), [Math]::Min(195, [Math]::Max(95, 142 + $gn)), [Math]::Max(25, 52 + [int]($gn * 0.6))))
    }
}
$granRed.Save((Join-Path $texDir "pbr_granite_pinkred.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$granBeige.Save((Join-Path $texDir "pbr_granite_beige.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$terraBmp.Save((Join-Path $texDir "pbr_terracotta_steps.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$grassBmp.Save((Join-Path $texDir "pbr_grass_lawn.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$granRed.Dispose(); $granBeige.Dispose(); $terraBmp.Dispose(); $grassBmp.Dispose()
Write-Output "[OK] Generated granite, terracotta & grass PBR textures"
