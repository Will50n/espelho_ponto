@echo off
title Automação do Espelho de Ponto
color 0A

echo ===================================================
echo     Iniciando o extrator do espelho de ponto...
echo ===================================================
echo.

:: Executa o script Node.js
node index.js

echo.
echo ===================================================
echo     Fim da execucao. Leia as mensagens acima.
echo ===================================================
echo.

:: Pausa o terminal para que a janela não feche sozinha
pause