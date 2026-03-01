@echo off
setlocal enabledelayedexpansion

set ROOT_DIR=%~dp0
set INPUT_DIR=%ROOT_DIR%input
set STAGING_DIR=%ROOT_DIR%staging

echo =========================================
echo    Stage 1: PDF Extractor Started
echo =========================================

if not exist "%STAGING_DIR%" mkdir "%STAGING_DIR%"

echo.
echo Step 1: Extracting text and performing OCR on PDFs in \input folder...
set count=0
for %%f in ("%INPUT_DIR%\*.pdf") do (
    echo Processing: %%~nf
    python "%ROOT_DIR%src\extract_pdf.py" "%%f" "%STAGING_DIR%"
    set /a count+=1
)

if %count%==0 (
    echo No PDF files found in the input folder! 
    echo Please add PDFs to: %INPUT_DIR%
) else (
    echo.
    echo =========================================
    echo    Extraction Complete!
    echo    Check the \staging\ folder.
    echo    You can now edit/delete the Markdown 
    echo    files before running 2_build.bat
    echo =========================================
)

pause
