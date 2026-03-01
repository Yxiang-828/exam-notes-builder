@echo off
setlocal enabledelayedexpansion

set ROOT_DIR=%~dp0
set INPUT_DIR=%ROOT_DIR%input
set STAGING_DIR=%ROOT_DIR%staging
set OUTPUT_DIR=%ROOT_DIR%docs
set TEMPLATE_DIR=%ROOT_DIR%src\html_template

echo =========================================
echo   Checking Dependencies... Don't think I'm doing this for you!
echo =========================================
python -c "import fitz, easyocr, PIL" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Ugh, you don't even have the right packages installed. Installing dependencies now...
    pip install PyMuPDF Pillow easyocr
    if !ERRORLEVEL! NEQ 0 (
        echo I completely failed. You'll have to install them yourself! Hmph!
        pause
        exit /b 1
    )
) else (
    echo Hmph, looks like your dependencies are actually satisfied. Good for you.
)
echo.

:CHOOSE_MODE
set "mode="
echo So, what do you want? (Enter 'P' or 'E')
echo [P] - Publish: Bundle your formatted .md files from staging\ into the website.
echo [E] - Extract: Read raw text/images from PDFs/images in input\ to staging\.
set /p "mode=Speak up already (P/E): "
if /i "%mode%"=="P" goto PUBLISH
if /i "%mode%"=="E" goto EXTRACT
echo Are you illiterate? I said 'P' or 'E'! Try again.
goto CHOOSE_MODE

:EXTRACT
echo.
set "placed="
set /p "placed=Are your to-be-extracted files in the input folder? Answer (Y/N): "
if /i "%placed%"=="N" (
    echo Obviously! Go do it then, I'm not waiting around!
    pause
    exit /b 0
) else if /i "%placed%"=="Y" (
    echo Fine. Let's get this over with...
) else (
    echo 'Y' or 'N' dummy! It's not hard!
    goto EXTRACT
)

echo.
echo =========================================
echo   Stage 1: PDF Extraction Started
echo =========================================
if not exist "%STAGING_DIR%" mkdir "%STAGING_DIR%"

set count=0
for %%e in (pdf png jpg jpeg) do (
    for %%f in ("%INPUT_DIR%\*.%%e") do (
        echo Processing: %%~nxf
        python "%ROOT_DIR%src\extract_pdf.py" "%%f" "%STAGING_DIR%"
        if !ERRORLEVEL! NEQ 0 (
            echo Extraction failed on %%~nxf!
            pause
            exit /b 1
        )
        set /a count+=1
    )
)

if %count%==0 (
    echo Are you kidding me?! There's absolutely nothing in the input folder! 
    echo Put your stupid PDFs or Images inside: %INPUT_DIR%
    pause
    exit /b 1
)

echo.
:POST_EXTRACT
echo I-it's not like I wanted to help you or anything, but extraction is complete. Check staging\ now.
echo Note: those raw files are messy! You MUST format them yourself before publishing! Use an AI LLM to format it if you have to!
echo Are you ready to publish now? (Enter 'Y' to publish, 'N' to quit so you can edit the files)
set "ready="
set /p "ready=Well? (Y/N): "
if /i "%ready%"=="N" (
    echo Then go format them properly already! Don't come crying to me if it looks ugly!
    pause
    exit /b 0
) else if /i "%ready%"=="Y" (
    goto PUBLISH
) else (
    echo Ugh! Just press 'Y' or 'N'!
    goto POST_EXTRACT
)

:PUBLISH
echo.
echo =========================================
echo   Stage 2: Website Builder Started
echo =========================================

if not exist "%STAGING_DIR%" (
    echo Idiot! The staging directory doesn't even exist! 
    echo Run Extract mode first so I actually have something to build!
    pause
    exit /b 1
)

python "%ROOT_DIR%src\bundle_html.py" "%STAGING_DIR%" "%TEMPLATE_DIR%" "%OUTPUT_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo Ugh, the build completely failed! Check what you broke!
    pause
    exit /b 1
)

echo.
echo =========================================
echo   Success, I guess...
echo   I built your stupid website right here:
echo   %CD%\docs\index.html
echo   Opening it now, you'd better be grateful!
echo =========================================
start "" "%OUTPUT_DIR%\index.html"
pause
