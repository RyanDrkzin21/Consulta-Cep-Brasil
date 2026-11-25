# Guia do Brasil

Aplicação web com três consultas sobre o Brasil: endereço por CEP, cidades de cada estado (com filtro por nome) e feriados nacionais de qualquer ano.

## Integrantes

| Nome completo | Matrícula |
|---|---|
| Paulo Victor do Nascimento Lopes | 202521158 |
| Ryan Aguiar Neves | 202520932 |
| Thales Kauê Santos Soares  | 202511586 |

## Links

- Aplicação publicada (GitHub Pages): https://ryandrkzin21.github.io/Consulta-Cep-Brasil/
- Repositório: https://github.com/RyanDrkzin21/Consulta-Cep-Brasil

## Framework CSS

Bootstrap 5.3 (grid, navbar com menu recolhível no celular, cards, formulários, list-group, alertas e spinners).

## APIs e endpoints usados

| Método | URL | Para que serve no sistema |
|---|---|---|
| GET | `https://viacep.com.br/ws/{cep}/json/` | Mostra rua, bairro, cidade, estado e DDD do CEP digitado |
| GET | `https://servicodados.ibge.gov.br/api/v1/localidades/estados` | Preenche a lista de estados |
| GET | `https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios` | Mostra as cidades do estado escolhido |
| GET | `https://brasilapi.com.br/api/feriados/v1/{ano}` | Mostra os feriados nacionais do ano informado |

## Como usar

1. Abra o link do GitHub Pages.
2. **Consultar CEP:** digite um CEP (com ou sem hífen) e clique em Buscar.
3. **Cidades por estado:** escolha um estado na lista; depois digite no campo ao lado para filtrar as cidades pelo nome.
4. **Feriados:** o ano atual já vem preenchido; troque o ano e clique em Ver feriados.

## Tratamento de falhas

- Sem internet ou API fora do ar: aviso na tela com botão "Tentar novamente".
- Erro HTTP da API: aviso com o código do erro.
- CEP inexistente: aviso "CEP não encontrado".
- Campo vazio, CEP com menos de 8 números ou ano fora de 1900–2199: aviso antes de chamar a API.
- Filtro sem resultado: mensagem "Nenhuma cidade encontrada com esse nome."
- Spinner de carregamento em cada consulta.

## Estrutura

```
index.html
css/estilo.css
js/app.js
README.md
```
