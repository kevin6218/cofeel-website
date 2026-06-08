@echo off
chcp 65001 > nul
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8

if not exist bean_results mkdir bean_results

echo [%date% %time%] START bean weekly report >> bean_results\run.log

python bean_finder.py --no-open >> bean_results\run.log 2>&1

echo [%date% %time%] DONE >> bean_results\run.log
