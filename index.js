require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    // 1. Inicia o navegador invisível
    const browser = await puppeteer.launch({ 
        headless: "new", // Roda em segundo plano
        args: [
            '--no-sandbox', 
            '--ignore-certificate-errors' 
        ] 
    });
    
    const page = await browser.newPage();

    // 1.5 - Disfarça o robô injetando a "identidade" de um Google Chrome real do Windows
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Configura o tamanho da tela (ajuda na formatação do PDF)
    await page.setViewport({ width: 1280, height: 1024 });

    try {
        console.log('Injetando credenciais de rede...');

        // 1.5 - Injeta as credenciais para a Autenticação HTTP Básica do servidor de Staging
        await page.authenticate({ 
            username: process.env.USER_PROXY,
            password: process.env.SENHA_PROXY 
        });

        console.log('Acessando a página de login...');
        await page.goto('https://staging.workers.pontonaweb.com/', { waitUntil: 'networkidle2' });

        // await page.screenshot({ path: 'tela-atual.png' })

        await page.waitForSelector('#usuario');

        // 2. Preenche as credenciais com base nos IDs do HTML fornecido
        console.log('Preenchendo credenciais...');
        await page.type('#usuario', process.env.PONTO_LOGIN);
        await page.type('#senha', process.env.PONTO_SENHA);

       // 3. Clica no botão e aguarda o redirecionamento completo da página
        console.log('Realizando login e aguardando o sistema...');
        
        // O Promise.all garante que o robô clique E espere a página recarregar ao mesmo tempo
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('button[type="submit"]')
        ]);

        // 4. Navega direto para a página de histórico
        console.log('Navegando para o histórico...');
        await page.goto('https://staging.workers.pontonaweb.com/historico.php', { waitUntil: 'networkidle2' });

        // PAUSA DE SEGURANÇA: Aguarda 2 segundos para garantir que tabelas e CSS terminaram de renderizar
        await new Promise(resolve => setTimeout(resolve, 10000));

       // 5. Gera o PDF em pastas organizadas
        console.log('Organizando pastas e gerando PDF do histórico...');
        
        // Pega a data atual completa (ex: 2026-08-07T15:30:00.000Z)
        const dataCompleta = new Date();
        
        // Extrai apenas a parte "YYYY-MM" para nomear a pasta (ex: "2026-08")
        const anoMes = dataCompleta.toISOString().slice(0, 7); 
        
        // Extrai o "YYYY-MM-DD" para nomear o arquivo
        const dataArquivo = dataCompleta.toISOString().split('T')[0];
        const nomeArquivo = `historico_ponto_${dataArquivo}.pdf`;

        // Define o caminho completo da pasta: arquivos-gerados/YYYY-MM
        const diretorioDestino = path.join(__dirname, 'arquivos-gerados', anoMes);

        // Verifica se a pasta existe. Se não existir, o { recursive: true } cria todas as pastas necessárias de uma vez
        if (!fs.existsSync(diretorioDestino)) {
            fs.mkdirSync(diretorioDestino, { recursive: true });
        }

        // Define o caminho final onde o arquivo será salvo (pasta + nome do arquivo)
        const caminhoCompletoArquivo = path.join(diretorioDestino, nomeArquivo);

        // Salva o PDF no caminho configurado
        await page.pdf({
            path: caminhoCompletoArquivo,
            format: 'A4',
            printBackground: true, 
            margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
        });

        console.log(`✅ Sucesso! Arquivo salvo em: ${caminhoCompletoArquivo}`);

    } catch (erro) {
        console.error('❌ Ocorreu um erro durante a automação:', erro);
    } finally {
        // Fecha o navegador para liberar memória
        await browser.close();
    }
})();