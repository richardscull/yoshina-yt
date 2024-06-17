pushd %~dp0
call npm install --no-audit
npm run package
pause
popd