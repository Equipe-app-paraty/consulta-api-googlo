Resolução de Problemas
Hã, algo deu errado? Use este guia para resolver problemas com Jest.

Testes estão falhando e você não sabe por que
Try using the debugging support built into Node. Coloque uma instrução debugger; em qualquer um dos seus testes e em seguida, no diretório do seu projeto, execute:

node --inspect-brk node_modules/.bin/jest --runInBand [any other arguments here]
or on Windows
node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand [any other arguments here]

Isso executará o Jest em um processo Node ao qual um depurador externo pode se conectar. Observe que o processo pausará até que o depurador tenha se conectado a ele.

Para depurar no Google Chrome (ou qualquer navegador baseado em Chromium), abra seu navegador e vá para chrome://inspecte clique em "Open Dedicated DevTools for Node", que lhe dará uma lista de instâncias de node disponíveis às quais você pode se conectar. Clique no endereço exibido no terminal (geralmente algo como localhost:9229) após executar o comando acima, e você poderá depurar o Jest usando o DevTools do Chrome.

The Chrome Developer Tools will be displayed, and a breakpoint will be set at the first line of the Jest CLI script (this is done to give you time to open the developer tools and to prevent Jest from executing before you have time to do so). Clique no botão que se parece com um botão "play" no lado superior direito da tela para continuar a execução. Quando Jest executa o teste que contém a instrução debugger, a execução fará uma pausa e você pode examinar o escopo atual e a pilha de chamada.

observação
A --runInBandopção cli faz com que Jest execute o teste no mesmo processo mais próximo que os processos de spawning para testes individuais. Normalmente Jest paraleliza execução de testes através de processos, mas é difícil de depurar vários processos ao mesmo tempo.

Depuração no VS Code
Há várias maneiras de depurar testes Jest com o depurador integrado do Visual Studio Code .

Para anexar o depurador embutido, execute os testes, como foi mencionado anteriormente:

node --inspect-brk node_modules/.bin/jest --runInBand [any other arguments here]
or on Windows
node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand [any other arguments here]

Em seguida, anexe depurador do VS Code usando a configuração launch.json a seguir:

{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach",
      "port": 9229
    }
  ]
}

Para iniciar automaticamente e anexar a um processo executando os seus testes, use a seguinte configuração:

{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeArgs": [
        "--inspect-brk",
        "${workspaceRoot}/node_modules/.bin/jest",
        "--runInBand"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}

ou o seguinte para Windows:

{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeArgs": [
        "--inspect-brk",
        "${workspaceRoot}/node_modules/jest/bin/jest.js",
        "--runInBand"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}

Se você estiver usando o create-react-app do Facebook, você pode depurar seus testes Jesta com a seguinte configuração:

{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug CRA Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/react-scripts",
      "args": [
        "test",
        "--runInBand",
        "--no-cache",
        "--env=jsdom",
        "--watchAll=false"
      ],
      "cwd": "${workspaceRoot}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}

Mais informações sobre depuração do Node podem ser encontradas aqui.

Depuração no WebStorm
O WebStorm tem suporte integrado para Jest. Leia Testando com Jest no WebStorm para saber mais.

Problemas de cache
O script de transformação foi alterado ou o Babel foi atualizado e as alterações não estão sendo reconhecidas pelo Jest?

Tente novamente com --no-cache. Jest armazena em cache os arquivos de módulo transformados para acelerar a execução de testes. If you are using your own custom transformer, consider adding a getCacheKey function to it: getCacheKey in Relay.

Promessas não resolvidas
Se uma promessa não é resolvida de forma alguma, esse erro pode ser lançado:

- Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.

Mais comumente, isso é causado por implementações conflitantes de Promessa. Consider replacing the global promise implementation with your own, for example globalThis.Promise = jest.requireActual('promise'); and/or consolidate the used Promise libraries to a single one.

Se o seu teste for demorado, você pode considerar aumentar o tempo limite chamandojest.setTimeout

jest.setTimeout(10_000); // 10 second timeout

Problemas com Watchman
Tente executar o Jest com --no-watchmanou defina a watchmanopção de configuração como false.

Também consulte solucionando problemas do watchman.

Testes são extremamente lentos no Docker e/ou servidor de Integração Contínua (CI, Continuous Integration).
Embora o Jest seja extremamente rápido na maioria das vezes em computadores modernos com vários núcleos e SSDs rápidos, ele pode ser lento em certas configurações, como nossos usuários descobriram .

Com base nas descobertas , uma maneira de atenuar esse problema e melhorar a velocidade em até 50% é executar testes sequencialmente.

Para isso, você pode executar testes na mesma "thread" usando --runInBand:

npm
Fio
pnpm
# Using Jest CLI
jest --runInBand

# Using your package manager's `test` script (e.g. with create-react-app)
npm test -- --runInBand

Another alternative to expediting test execution time on Continuous Integration Servers such as Travis-CI is to set the max worker pool to ~4. Especificamente no Travis-CI, isto pode reduzir o tempo de execução de teste pela metade. Nota: O plano gratuito de Travis CI disponível para projetos de código aberto inclui apenas 2 núcleos de CPU.

npm
Fio
pnpm
# Using Jest CLI
jest --maxWorkers=4

# Using your package manager's `test` script (e.g. with create-react-app)
npm test -- --maxWorkers=4

Se você usar o GitHub Actions, poderá usá-lo github-actions-cpu-corespara detectar o número de CPUs e passá-lo para o Jest.

- name: Get number of CPU cores
  id: cpu-cores
  uses: SimenB/github-actions-cpu-cores@v2
- name: run tests
  run: yarn jest --max-workers ${{ steps.cpu-cores.outputs.count }}

Outra coisa que você pode fazer é usar o shardsinalizador para paralelizar a execução do teste em várias máquinas.

coveragePathIgnorePatterns parece não ter nenhum efeito.
Certifique-se de que você não esteja usando o plugin de babel-plugin-Istambul. O Jest envolve o Istanbul e, portanto, também informa ao Istanbul quais arquivos instrumentar com a coleção de cobertura. Ao usar babel-plugin-istanbul, cada arquivo que é processado pelo Babel terá um código de coleção de cobertura, portanto, ele não está sendo ignorado pelo coveragePathIgnorePatterns.

Definindo Testes
Os testes devem ser definidos de forma síncrona para que o Jest possa coletar seus testes.

Como exemplo para mostrar por que isso acontece, imagine que escrevemos um teste como este:

// Don't do this it will not work
setTimeout(() => {
  it('passes', () => expect(1).toBe(1));
}, 0);

Quando o Jest executa seu teste para coletar os tests, ele não encontrará nenhum porque definimos a definição para acontecer assincronamente no próximo tick do loop de eventos. Isso significa que quando você está usando, test.eachnão é possível definir a tabela assincronamente dentro de um beforeEach/ beforeAll.  


Quero verificar uma função que pode ser atualizada após um minuto e defini um tempo de espera no meu código, mas meu valor de tempo limite padrão é 15.000 ms. Meu código tem um tempo de espera de 60.000 ms, então ele retorna este erro:

thrown: "Exceeded timeout of 15000 ms for a test.
    Use jest.setTimeout(newTimeout) to increase the timeout value,
    if this is a long-running test."
meu código está aqui:

it('shows that timeline can get updated after one minute', async () => {
    await selectTimeForTimeLine.selectTime('Last 5 minutes');
    await page.waitForTimeout(3000);
    const defaultTime = await alarmTimeLine.xAxisValues();
    await page.evaluate(() => {
      return new Promise((resolve) => setTimeout(resolve, 60000));
    });
    const correntTime = await alarmTimeLine.xAxisValues();
    expect(defaultTime).not.toEqual(correntTime);
  });
Onde devo colocar jest.setTimeOut()? Quero aumentar o valor de tempo limite excedido para 70000ms para garantir que meu código rode bem.

Javascript-escritor
brincadeiras
Compartilhar
Melhore esta pergunta
Seguir
editado em 21 de junho de 2024 às 19:11
Avatar do usuário ggorlen
Gorlen-Gorlen
57,5 mil88 emblemas de ouro111111 emblemas de prata154154 emblemas de bronze
perguntado em 17 de agosto de 2021 às 3:59
Avatar do usuário Ryan
Ryan
1.95022 emblemas de ouro77 emblemas de prata1616 emblemas de bronze
2
Nenhum teste deve levar 70 segundos: teste a funcionalidade que você realmente precisa testar, não um minuto inteiro de tempo de espera artificial. 
– 
Mike 'Pomax' Kamermans
 Comentado17 de agosto de 2021 às 4:07
neste caso de teste eu deveria esperar um minuto, 70 segundos é o valor de tempo limite do jest, o problema é onde devo colocar jest.settimeout, 
– 
Ryan
 Comentado17 de agosto de 2021 às 4:33
1
Mas você realmente não deveria: o que você está testando não requer 70 segundos para passar, requer que seu código pense que 70 segundos se passaram. Zombe disso em vez de realmente fazer seu teste gastar mais de um minuto sem fazer nada: isso é um teste absolutamente terrível. 
– 
Mike 'Pomax' Kamermans
 Comentado17 de agosto de 2021 às 4:35 
ahh homem comum, sim, eu passo minutos sem fazer nada, mas meus dados de atualização de página, o ponto de verificação é a linha do tempo, pode ser atualizado a cada minuto ou não, 
– 
Ryan
 Comentado17 de agosto de 2021 às 5:14
70 segundos é o valor de tempo limite excedido, na verdade meu teste termina após 60 segundos de atualização da página, 
– 
Ryan
 Comentado17 de agosto de 2021 às 5:21
Mostrar mais 3 comentários
4 Respostas
Ordenado por:

Maior pontuação (padrão)
123

Para definir um tempo limite em um único teste, passe uma terceira opção parait/test , por exemplo:

 const SECONDS = 1000;

 it('does expected thing', async () => {
   ...
 }, 70 * SECONDS);
O valor está em milissegundos. Neste exemplo, 70 segundos.

Compartilhar
Melhore esta resposta
Seguir
editado em 21 de março de 2024 às 21:31
Avatar do usuário mikemaccana
mikemaccana
124 mil110110 emblemas de ouro430430 emblemas de prata533533 emblemas de bronze
respondido em 17 de agosto de 2021 às 5:58
Avatar do usuário Ryan
Ryan
1.95022 emblemas de ouro77 emblemas de prata1616 emblemas de bronze
Adicionar um comentário

Report this ad
28

A documentação do Jest costumava ser um pouco confusa, então eu a atualizei.

Definir tempos limite de teste para todo o arquivo
Da documentação jest.setTimeout() :

Defina o intervalo de tempo limite padrão para testes e ganchos antes/depois em milissegundos. Isso afeta apenas o arquivo de teste do qual essa função é chamada.

Ou seja, jest.setTimeout() é manipulado em um nível de arquivo . O exemplo deles não deixa claro, mas você deveria ter executado jest.setTimeout()no topo do seu arquivo de teste:

const SECONDS = 1000;
jest.setTimeout(70 * SECONDS)

describe(`something`, () => {
  it('works', async () => {
    asset(true).isTruthy()
  });
})
Atualização: enviei um PR para a equipe do Jest, que foi aceito, para esclarecer os documentos. Eles agora dizem:

Para definir intervalos de tempo limite em diferentes testes no mesmo arquivo, use a opção de tempo limite em cada teste individual.

Isso faz parte do Jest 29.5 e versões mais recentes.

Definir um tempo limite de teste para um teste lento específico
Provavelmente é isso que você quer. Para usar a opção timeout em cada teste individual:

// Just to increase readability
const SECONDS = 1000;

describe(`something`, () => {
  it('works', async () => {
    asset(true).isTruthy()
  }, 3 * SECONDS);
})
Compartilhar
Melhore esta resposta
Seguir
editado em 22 de março de 2024 às 18:42
respondido em 27 de abril de 2022 às 15:33
Avatar do usuário mikemaccana
mikemaccana
124 mil110110 emblemas de ouro430430 emblemas de prata533533 emblemas de bronze
Adicionar um comentário
15

Após atualizar para v28+, isso jest.setTimeout()não funciona mais para mim. Tenho que definir o timeout explicitamente em ./jest.config.js:

// jest.config.js
module.exports = {
    // ...
    testTimeout: 70000
}
Compartilhar
Melhore esta resposta
Seguir
respondido em 9 de junho de 2022 às 16:12
LeOn - Avatar do usuário de Han Li
LeOn - Han Li
10,2 mil22 emblemas de ouro6969 emblemas de prata6363 emblemas de bronze
Isso não funciona no Jest 29.7.0. github.com/jestjs/jest/issues/14513 
– 
Papooch
 Comentado11 de março às 14:49
Adicionar um comentário

Report this ad
2

O jest também tem um arquivo de configuração.

// jest.config.js
module.exports = {
    // ...
    testTimeout: 20000
}
Compartilhar
Melhore esta resposta
Seguir
respondido em 30 de 