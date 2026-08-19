# Impressão — destinos e roteamento

O restaurante tem **4 impressoras MP-4200 TH**. O sistema precisa identificar o destino de cada via.

| Estação | Papel | Destino |
|---------|--------|---------|
| Caixa (terminal do PDV) | Conta de conferência do cliente | Sempre a impressora do caixa |
| Pizza | Comanda de pizza | Itens `tipo = PIZZA` |
| Japonesa | Comanda japonesa | Produtos do setor japonês |
| Chinesa | Comanda chinesa | Produtos do setor chinês |

## Envio na MP-4200 TH (Windows)

Por padrao o PDV envia pelo **spooler RAW** da impressora `MP-4200 TH` — o mesmo caminho que a pagina de teste do Windows usa quando o status esta **Ocioso**. COM direto fica como fallback (ou forcado com variavel de ambiente).

Ordem de tentativa:

1. Spooler RAW na `MP-4200 TH` (padrao)
2. Se falhar: COM10 direto (sem controle RTS — evita "OK" sem papel)
3. Se a porta COM nao abrir: retoma a impressora, remove jobs presos e tenta de novo

**Importante:** versoes antigas do PDV pausavam a impressora via WMI antes de cada envio. Se o script falhava ou estourava timeout, o Windows ficava em **"Pausado"** — e nem a pagina de teste do Windows imprimia. O PDV atual **nunca pausa** a fila; retoma automaticamente antes de cada impressao.

### Reenvio nunca duplica cupom

Uma falha so gera nova tentativa quando ela acontece **antes de qualquer byte sair** (prefixo `ABERTURA:` na saida do script). Se a escrita ja comecou, o erro sobe para a tela sem reenviar: reenviar depois de uma escrita parcial imprimia o cabecalho duas vezes.

Para medir o tempo do envio serial no caixa:

`powershell -ExecutionPolicy Bypass -File apps/desktop/scripts/medir-envio-com.ps1 -PortName COM10`

Variaveis opcionais:

| Variavel | Efeito |
|----------|--------|
| `PDV_IMPRESSORA_PORTA=COM10` | Porta serial no fallback/forcado COM (padrao COM10) |
| `PDV_IMPRESSORA_NOME=MP-4200 TH` | Nome da impressora no Windows |
| `PDV_IMPRESSORA_COM=1` | Forca usar so COM direto (nao recomendado se spooler funciona) |

Script de configuracao (PowerShell **como Administrador**):

`apps/desktop/scripts/configurar-impressora-mp4200.ps1`

Troca o driver da MP-4200 TH para **Generic / Text Only** na porta COM10, recomendado pela Bematech para ESC/POS.

## Fase atual

Layouts de **conta** e **comanda por setor** saem na impressora **local** (COM10). A conta **nunca** deve ir para a cozinha.

## Fase seguinte (não implementada)

- `setor_impressao` em categoria/produto: `PIZZA` | `JAPONESA` | `CHINESA`
- Config do terminal: `setor → porta/impressora Windows`
- Um clique em comanda gera uma via por setor com item pendente
- `enviado_cozinha_em` no item; falha de impressão não marca envio e não altera a venda

## Impressora para de responder após um tempo

Sintoma comum na MP-4200 TH: depois de ficar ociosa, a próxima impressão não sai e só volta após desligar e ligar.

### O que o PDV já faz

- Inicializa a impressora (`ESC @`) no início de cada cupom
- Avança papel com linhas em branco e corta com `ESC i` (comando Bematech)
- Envia um job por vez (lock em memoria no processo) para não disputar a fila do Windows
- Remove automaticamente o lock legado em `%TEMP%\\pdv-impressora.lock` (versoes antigas deixavam esse arquivo orfao apos reiniciar o app no dev)
- Espera a porta serial drenar antes de fechar, para o cupom não sair cortado
- **Retoma a impressora se o Windows a deixou em Pausado** (versoes antigas do PDV podiam causar isso)
- **Remove jobs presos** somente quando a porta nao abre — sem pausar a fila
- **Tenta de novo uma vez** apenas se nenhum byte tiver saído

### Impressora travada (Error no Windows)

Se aparecer **"Imprimindo, Erro"**, o Windows perdeu comunicação com a MP-4200. Limpar a fila no painel **não resolve** se a impressora estiver travada no hardware.

1. **Desligue a impressora** (botão atrás), aguarde **5 segundos**, ligue de novo
2. Confira **papel** e **tampa**
3. Reinicie o app e tente imprimir de novo (o PDV limpa a fila automaticamente)

Confirme o **conjunto de comandos** da impressora com o **Bema User** (pasta `Downloads\driver-bematech-mp-4200\Software Gerenciamente e Configuracao`): **Tipo de comando = ESC/POS** → Aplicar. Ou ligue segurando o botão de avanço e veja no auto-teste se está ESC/POS (não BEMATECH nativo).

Se mesmo após desligar/ligar continuar em erro, teste imprimir um arquivo pelo Bloco de Notas na MP-4200 TH. Se o Notepad também falhar, reinstale o driver Bematech Spooler ou troque o driver avançado para **Generic / Text Only** (orientação Bematech para ESC/POS).

### Ajustes no Windows (recomendado no caixa)

1. **Gerenciador de Dispositivos** → **Controladores de USB** → **Dispositivo composto USB** (ou hub da impressora) → **Gerenciamento de energia** → desmarque **Permitir que o computador desligue este dispositivo para economizar energia**
2. **Opções de energia** → **Alterar configurações do plano** → **USB** → **Configuração seletiva suspensa do USB** → **Desabilitado**
3. **Impressoras** → **MP-4200 TH** → **Propriedades da impressora** → **Avançado** → marque **Imprimir diretamente na impressora** (evita jobs presos na fila)
4. Se a fila travar: **Serviços** → **Spooler de Impressão** → **Reiniciar**

Se mesmo assim voltar a travar com o PC ocioso por horas, o reset físico (desligar/ligar) continua sendo o fallback da firmware Bematech; os passos acima reduzem a frequência.
