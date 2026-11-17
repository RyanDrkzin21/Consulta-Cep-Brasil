// Guia do Brasil
// Consulta CEP (ViaCEP), estados e cidades (IBGE) e feriados nacionais (BrasilAPI)

const URL_CEP = 'https://viacep.com.br/ws';
const URL_IBGE = 'https://servicodados.ibge.gov.br/api/v1/localidades';
const URL_FERIADOS = 'https://brasilapi.com.br/api/feriados/v1';

const DIAS_DA_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// elementos da pagina
const areaAvisos = document.getElementById('avisos');

const formCep = document.getElementById('form-cep');
const campoCep = document.getElementById('campo-cep');
const resultadoCep = document.getElementById('resultado-cep');

const campoEstado = document.getElementById('campo-estado');
const campoFiltro = document.getElementById('campo-filtro');
const listaCidades = document.getElementById('lista-cidades');
const contagemCidades = document.getElementById('contagem-cidades');

const formFeriados = document.getElementById('form-feriados');
const campoAno = document.getElementById('campo-ano');
const listaFeriados = document.getElementById('lista-feriados');

// guarda as cidades do estado escolhido para o filtro nao precisar chamar a API de novo
let cidadesDoEstado = [];


// ---------- avisos e carregamento ----------

function mostrarAviso(tipo, texto, tentarDeNovo) {
  const aviso = document.createElement('div');
  aviso.className = 'alert alert-' + tipo + ' d-flex flex-wrap align-items-center justify-content-between gap-2';
  aviso.setAttribute('role', 'alert');

  const mensagem = document.createElement('span');
  mensagem.textContent = texto;
  aviso.appendChild(mensagem);

  // so mostra o botao quando faz sentido repetir a chamada (erro de rede ou da API)
  if (tentarDeNovo) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'btn btn-sm btn-outline-dark';
    botao.textContent = 'Tentar novamente';
    botao.addEventListener('click', function () {
      aviso.remove();
      tentarDeNovo();
    });
    aviso.appendChild(botao);
  }

  // uso appendChild porque ao abrir a pagina dois avisos podem aparecer juntos
  areaAvisos.appendChild(aviso);
  areaAvisos.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function limparAvisos() {
  areaAvisos.replaceChildren();
}

function mostrarCarregando(id, ligado) {
  const spinner = document.getElementById(id);
  spinner.classList.toggle('d-none', !ligado);

  // se o spinner esta dentro de um botao, desativa o botao para evitar cliques repetidos
  const botao = spinner.closest('button');
  if (botao) {
    botao.disabled = ligado;
  }
}

// transforma o erro do fetch numa mensagem que o usuario entende
function mensagemDeErro(erro) {
  if (erro.status) {
    return 'A API respondeu com um erro (código ' + erro.status + '). Tente novamente em instantes.';
  }
  return 'Não foi possível conectar. Verifique sua internet ou tente de novo mais tarde.';
}


// ---------- chamada generica a API ----------

async function buscarJson(url) {
  let resposta;
  try {
    resposta = await fetch(url);
  } catch (e) {
    // fetch so da erro aqui quando a rede cai ou a API nao responde
    throw new Error('rede');
  }

  if (!resposta.ok) {
    const erro = new Error('http');
    erro.status = resposta.status;
    throw erro;
  }
  return resposta.json();
}


// ---------- 1) CEP: GET viacep.com.br/ws/{cep}/json/ ----------

async function consultarCep(cep) {
  mostrarCarregando('carregando-cep', true);
  resultadoCep.replaceChildren();
  try {
    const dados = await buscarJson(URL_CEP + '/' + cep + '/json/');

    // o ViaCEP devolve 200 com { erro: true } quando o CEP tem formato certo mas nao existe
    if (dados.erro) {
      mostrarAviso('warning', 'CEP não encontrado. Confira os números e tente de novo.');
      return;
    }
    mostrarEndereco(dados);
  } catch (erro) {
    mostrarAviso('danger', mensagemDeErro(erro), function () { consultarCep(cep); });
  } finally {
    mostrarCarregando('carregando-cep', false);
  }
}

function mostrarEndereco(dados) {
  const campos = [
    ['CEP', dados.cep],
    ['Rua', dados.logradouro],
    ['Bairro', dados.bairro],
    ['Cidade', dados.localidade],
    ['Estado', dados.uf],
    ['DDD', dados.ddd]
  ];

  resultadoCep.replaceChildren();
  campos.forEach(function (campo) {
    const titulo = document.createElement('dt');
    titulo.className = 'col-4 col-sm-3';
    titulo.textContent = campo[0];

    const valor = document.createElement('dd');
    valor.className = 'col-8 col-sm-9';
    // CEP de cidade pequena nao tem rua nem bairro
    valor.textContent = campo[1] || '-';

    resultadoCep.append(titulo, valor);
  });
}


// ---------- 2) Estados: GET /localidades/estados ----------

async function carregarEstados() {
  try {
    const estados = await buscarJson(URL_IBGE + '/estados?orderBy=nome');

    campoEstado.replaceChildren(new Option('Escolha um estado', ''));
    estados.forEach(function (estado) {
      campoEstado.add(new Option(estado.nome + ' (' + estado.sigla + ')', estado.sigla));
    });
    campoEstado.disabled = false;
  } catch (erro) {
    campoEstado.replaceChildren(new Option('Não foi possível carregar', ''));
    mostrarAviso('danger', mensagemDeErro(erro), carregarEstados);
  }
}


// ---------- 3) Cidades: GET /localidades/estados/{uf}/municipios ----------

async function carregarCidades(uf) {
  mostrarCarregando('carregando-cidades', true);
  listaCidades.replaceChildren();
  contagemCidades.textContent = '';
  campoFiltro.value = '';
  campoFiltro.disabled = true;
  campoEstado.disabled = true; // evita trocar de estado no meio da consulta
  try {
    cidadesDoEstado = await buscarJson(URL_IBGE + '/estados/' + uf + '/municipios');
    campoFiltro.disabled = false;
    mostrarCidades(cidadesDoEstado);
  } catch (erro) {
    cidadesDoEstado = [];
    mostrarAviso('danger', mensagemDeErro(erro), function () { carregarCidades(uf); });
  } finally {
    campoEstado.disabled = false;
    mostrarCarregando('carregando-cidades', false);
  }
}

function mostrarCidades(cidades) {
  listaCidades.replaceChildren();

  if (cidades.length === 0) {
    contagemCidades.textContent = 'Nenhuma cidade encontrada com esse nome.';
    return;
  }

  contagemCidades.textContent = cidades.length + (cidades.length === 1 ? ' cidade' : ' cidades');
  cidades.forEach(function (cidade) {
    const item = document.createElement('li');
    item.className = 'list-group-item';
    item.textContent = cidade.nome;
    listaCidades.appendChild(item);
  });
}

// ignora acento e maiuscula para "brasilia" achar "Brasília"
function semAcento(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function filtrarCidades() {
  const busca = semAcento(campoFiltro.value.trim());
  const encontradas = cidadesDoEstado.filter(function (cidade) {
    return semAcento(cidade.nome).includes(busca);
  });
  mostrarCidades(encontradas);
}


// ---------- 4) Feriados: GET brasilapi.com.br/api/feriados/v1/{ano} ----------

async function carregarFeriados(ano) {
  mostrarCarregando('carregando-feriados', true);
  listaFeriados.replaceChildren();
  try {
    const feriados = await buscarJson(URL_FERIADOS + '/' + ano);

    if (feriados.length === 0) {
      mostrarAviso('info', 'Nenhum feriado encontrado para ' + ano + '.');
      return;
    }
    mostrarFeriados(feriados);
  } catch (erro) {
    mostrarAviso('danger', mensagemDeErro(erro), function () { carregarFeriados(ano); });
  } finally {
    mostrarCarregando('carregando-feriados', false);
  }
}

function mostrarFeriados(feriados) {
  feriados.forEach(function (feriado) {
    // a data vem como "2026-11-15"; separo na mao para o fuso horario nao mudar o dia
    const partes = feriado.date.split('-');
    const data = new Date(partes[0], partes[1] - 1, partes[2]);

    const item = document.createElement('li');
    item.className = 'list-group-item d-flex flex-wrap gap-2 align-items-baseline';

    const dataTexto = document.createElement('strong');
    dataTexto.className = 'data-feriado';
    dataTexto.textContent = partes[2] + '/' + partes[1] + '/' + partes[0];

    const nome = document.createElement('span');
    nome.textContent = feriado.name;

    const dia = document.createElement('small');
    dia.className = 'text-muted ms-auto';
    dia.textContent = DIAS_DA_SEMANA[data.getDay()];

    item.append(dataTexto, nome, dia);
    listaFeriados.appendChild(item);
  });
}


// ---------- eventos ----------

formCep.addEventListener('submit', function (evento) {
  evento.preventDefault();
  limparAvisos();

  // aceita "70040-010" ou "70040010"
  const cep = campoCep.value.replace(/\D/g, '');

  if (cep === '') {
    mostrarAviso('warning', 'Digite um CEP para buscar.');
    return;
  }
  if (cep.length !== 8) {
    mostrarAviso('warning', 'O CEP precisa ter 8 números.');
    return;
  }
  consultarCep(cep);
});

campoEstado.addEventListener('change', function () {
  limparAvisos();
  if (campoEstado.value === '') {
    cidadesDoEstado = [];
    listaCidades.replaceChildren();
    contagemCidades.textContent = '';
    campoFiltro.disabled = true;
    return;
  }
  carregarCidades(campoEstado.value);
});

campoFiltro.addEventListener('input', filtrarCidades);

formFeriados.addEventListener('submit', function (evento) {
  evento.preventDefault();
  limparAvisos();

  const ano = campoAno.value.trim();

  if (ano === '') {
    mostrarAviso('warning', 'Digite um ano para ver os feriados.');
    return;
  }
  // a BrasilAPI so aceita anos entre 1900 e 2199
  if (!/^\d{4}$/.test(ano) || ano < 1900 || ano > 2199) {
    mostrarAviso('warning', 'Digite um ano válido, entre 1900 e 2199.');
    return;
  }
  carregarFeriados(ano);
});


// ---------- ao abrir a pagina ----------

campoAno.value = new Date().getFullYear();
carregarEstados();
carregarFeriados(campoAno.value);
