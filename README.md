Relatório de Aprendizagem da Disciplina de DW1

Aluna: Deborah Ferraz Pontes                                                                                          01/12/2025

 No meu projeto de DW1 do ano letivo de 2025, desenvolvi uma loja de donuts online utilizando no frontend JavaScript, CSS e HTML, e no backend Node.js com Express. O sistema possui integração com banco de dados PostgreSQL e autenticação via express-session. A loja conta com duas interfaces principais: a tela do cliente e o painel do gerente, além de gerenciamento de login e compras. A tela do cliente permite que usuários logados visualizem todos os produtos disponíveis na loja e realizem compras. Cada usuário possui um carrinho de compras que direciona para o pagamento, com opções de cartão de crédito, cartão de débito, vale alimentação, PIX e dinheiro. A tela do gerente mantém as mesmas funcionalidades da tela do cliente, mas com o diferencial de incluir um painel administrativo contendo CRUDs para cada tabela do banco de dados. Isso possibilita ao gerente criar, ler, atualizar e excluir registros em todas as tabelas. O gerente também tem acesso a uma seção de relatórios dentro do painel, onde pode visualizar os produtos mais vendidos em determinado período e as vendas da loja por mês. Meu projeto possui 8 tabelas no banco de dados: categorias, endereços, formas de pagamento, pedidos, usuários, produtos, itens do pedido e pagamento, sendo que itens do pedido e pagamento estão integrados dentro do CRUD de pedidos.


 Com esse projeto descobri uma paixão particular pelo CSS, gostei muito de mexer com cores, efeitos visuais, posições de tela e etc... me interessei bastante por essa parte da loja. Também pude aprender na prática como funciona a ligação do projeto com o banco de dados, os controllers, rotas e também os comandos no terminal. Aprendi muitos comandos novos, principalmente de instalação e visualização de problemas, também pude aprimorar o envio dos arquivos até o github através do terminal, algo que antes tinha muita dificuldade. Em relação ao JavaScript, percebi que as funções assíncronas eram muito recorrentes, uma coisa nova que nunca tinha visto, pude aprender como elas funcionam e qual sua importância. Tive muitas dificuldades para a realização desse projeto, dentre elas posso destacar a criação dos CRUDs integrados ao banco de dados.


 O CRUD produtos foi o primeiro que criei e enfrentei problemas como: adição de imagens, busca por id, salvamento no id solicitado, estilização CSS, botões de adicionar, atualizar e excluir e na maneira como os dados eram salvos no banco. Para resolver esses problemas utilizei o código do professor, comparando com o meu e ajustando gradualmente.


 No CRUD usuários, o maior desafio foi com as senhas, que ao serem salvas no banco causavam interferência. Precisei criar um JS específico para migrar as senhas para formato hash. 
 O CRUD pedidos e endereços também foram complicados. Os endereços no meu sistema podem ser cadastrados de duas formas: ao criar conta ou na realização do pagamento. Inicialmente, ao enviar os endereços para os pedidos, ocorriam erros e os campos retornavam vazios. Precisei reconfigurar o banco de dados e ajustar o código até resolver completamente. 


 A parte do pagamento da loja também foi bem complicada, principalmente por possibilitar o usuário de adicionar um novo endereço ou resgatar automaticamente o endereço cadastrado no criar conta. Havia erros no envio ao banco de dados e assim o usuário não realizava a compra corretamente. A forma de pagamento PIX também deu erro, o código não compactava com o meu PIX. Precisei usar o código antigo para assim o PIX funcionar corretamente. 


Os relatórios foram tecnicamente mais simples, mas enfrentei um problema onde datas específicas nos "produtos mais vendidos" retornavam informações de outro período.


 Todas as funções que imaginei estão no meu projeto. A única coisa que gostaria de melhorar é o CSS da loja. Queria que ficasse mais bonito e dinâmico, mas encontrei muitos problemas na execução. Um aspecto novo que me deixou muito satisfeita com o resultado foram as categorias: cada donut possui sua categoria correspondente, e elas são apresentadas com animações dentro da loja.


Sobre a experiencia com IA, notei que cada IA reage diferente para os mesmos comandos e que uma única palavra incorreta pode mexer com todo o seu projeto. Em geral me estressei bastante e muitas vezes decidi encontrar o problema sozinha quando a IA, mesmo depois de 10 tentativas, não resolvia o problema. Percebi que usando o Ctrl + H eu posso encontrar qualquer elemento no meu código, o que me ajudou a resolver problemas de posicionamento, alertas desnecessários, botões inúteis e funções repetidas, totalmente sozinha. Utilizei diversas ferramentas de IA no projeto: ChatGPT (não consegue fazer muito comandos ao mesmo tempo), Manus (não entende os comandos e cria um problema tentando arrumar outro), o Claude (muito pesado para o meu computador) e o DeepSeek que, para mim, foi perfeito de mexer. Ele me possibilitou enviar muitos arquivos de uma vez e sempre retornava o problema corrigido, mesmo que demorasse um pouco. 


Minha preferência, sem dúvidas, é o frontend. Adoro trabalhar com a parte visual e integrar tudo até ficar perfeito, para mim é muito satisfatório ver como cada pequena coisa se encaixa na tela, ver aqueles pequenos detalhes visuais que fazem total diferença e deixam o projeto bem mais animado.
 
 
Em geral, pude aprender muito com esse projeto, por mais cansativo que foi desenvolver, é muito bom ver o projeto pronto no final. O uso de IA também é muito impactante quando percebemos que esse é nosso futuro e que é essencial compreender como essas ferramentas funcionam.
