@echo off
setlocal enabledelayedexpansion

set ROOT_DIR=%~dp0
set STAGING_DIR=%ROOT_DIR%staging
set OUTPUT_DIR=%ROOT_DIR%docs
set TEMPLATE_DIR=%ROOT_DIR%src\html_template

echo =========================================
echo    Stage 2: Website Builder Started
echo =========================================

if not exist "%STAGING_DIR%" (
    echo Error: Staging directory not found. 
    echo Please run 1_extract.bat first to generate content.
    goto end
)

echo.
echo Compiling Markdown from \staging\ into the HTML website...
python "%ROOT_DIR%src\bundle_html.py" "%STAGING_DIR%" "%TEMPLATE_DIR%" "%OUTPUT_DIR%"

echo.
echo =========================================
echo    Success! Your custom website is ready:
echo    %OUTPUT_DIR%\index.html
echo    Opening your new website...
echo =========================================

start "" "%OUTPUT_DIR%\index.html"

:end
pause
