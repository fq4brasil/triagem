// ======================================================
// CONFIGURAÇÕES
// ======================================================

const URL_PLANILHA =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnU51Kz93Aij3mNKNvOmzEI_z50xQSWvuf-09_J-UDucrpOwpfLEkdNkegnyO8vJ5VeSmXYRx_JyxL/pub?output=csv";

const WHATSAPP_FABRICA =
    "5519994712833";

const URL_MERCADO_LIVRE =
    "https://lista.mercadolivre.com.br/fq4-flex-diesel";


// ======================================================
// ELEMENTOS
// ======================================================

const estadoSelect =
    document.getElementById("estado");

const cidadeSelect =
    document.getElementById("cidade");

const resultado =
    document.getElementById("resultado");


// ======================================================
// ESTADOS
// ======================================================

const estados = [

    ["AC", "Acre"],
    ["AL", "Alagoas"],
    ["AP", "Amapá"],
    ["AM", "Amazonas"],
    ["BA", "Bahia"],
    ["CE", "Ceará"],
    ["DF", "Distrito Federal"],
    ["ES", "Espírito Santo"],
    ["GO", "Goiás"],
    ["MA", "Maranhão"],
    ["MT", "Mato Grosso"],
    ["MS", "Mato Grosso do Sul"],
    ["MG", "Minas Gerais"],
    ["PA", "Pará"],
    ["PB", "Paraíba"],
    ["PR", "Paraná"],
    ["PE", "Pernambuco"],
    ["PI", "Piauí"],
    ["RJ", "Rio de Janeiro"],
    ["RN", "Rio Grande do Norte"],
    ["RS", "Rio Grande do Sul"],
    ["RO", "Rondônia"],
    ["RR", "Roraima"],
    ["SC", "Santa Catarina"],
    ["SP", "São Paulo"],
    ["SE", "Sergipe"],
    ["TO", "Tocantins"]

];


// ======================================================
// CIDADES
// ======================================================

let cidades = {};


// ======================================================
// NORMALIZA TEXTO
// ======================================================

function normalizar(texto) {

    return String(texto || "")
        .replace(/^\uFEFF/, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

}


// ======================================================
// LOCALIZA COLUNA
// Aceita variações de nomes
// ======================================================

function encontrarColuna(cabecalho, nomesPossiveis) {

    for (const nome of nomesPossiveis) {

        const procurado =
            normalizar(nome);

        const encontrada =
            cabecalho.find(
                coluna =>
                    normalizar(coluna) === procurado
            );

        if (encontrada) {

            return encontrada;

        }

    }

    return null;

}


// ======================================================
// CARREGA ESTADOS
// ======================================================

function carregarEstados() {

    estados.forEach(
        ([sigla, nome]) => {

            const option =
                document.createElement("option");

            option.value =
                sigla;

            option.textContent =
                `${nome} (${sigla})`;

            estadoSelect.appendChild(option);

        }
    );

}


// ======================================================
// CARREGA CIDADES
// ======================================================

async function carregarCidades(uf) {

    cidadeSelect.innerHTML =
        '<option value="">Carregando cidades...</option>';

    cidadeSelect.disabled =
        true;


    if (cidades[uf]) {

        preencherCidades(
            cidades[uf]
        );

        return;

    }


    try {

        const resposta =
            await fetch(
                `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao consultar IBGE."
            );

        }


        const dados =
            await resposta.json();


        cidades[uf] =
            dados
                .map(item => item.nome)
                .sort(
                    (a, b) =>
                        a.localeCompare(
                            b,
                            "pt-BR"
                        )
                );


        preencherCidades(
            cidades[uf]
        );


    } catch (erro) {

        console.error(
            erro
        );


        cidadeSelect.innerHTML =
            '<option value="">Erro ao carregar cidades</option>';

        cidadeSelect.disabled =
            true;

    }

}


// ======================================================
// PREENCHE CIDADES
// ======================================================

function preencherCidades(lista) {

    cidadeSelect.innerHTML =
        '<option value="">Selecione sua cidade</option>';


    lista.forEach(
        cidade => {

            const option =
                document.createElement("option");

            option.value =
                cidade;

            option.textContent =
                cidade;

            cidadeSelect.appendChild(
                option
            );

        }
    );


    cidadeSelect.disabled =
        false;

}


// ======================================================
// ALTERAÇÃO DO ESTADO
// ======================================================

estadoSelect.addEventListener(
    "change",
    async function() {

        resultado.innerHTML =
            "";

        cidadeSelect.innerHTML =
            '<option value="">Selecione sua cidade</option>';

        cidadeSelect.disabled =
            true;


        if (!this.value) {

            cidadeSelect.innerHTML =
                '<option value="">Primeiro selecione o estado</option>';

            return;

        }


        await carregarCidades(
            this.value
        );

    }
);


// ======================================================
// LEITOR CSV
// ======================================================

function parseCSV(texto) {

    const linhas = [];

    let linha = [];

    let campo = "";

    let dentroAspas = false;


    for (
        let i = 0;
        i < texto.length;
        i++
    ) {

        const caractere =
            texto[i];

        const proximo =
            texto[i + 1];


        if (
            caractere === '"' &&
            dentroAspas &&
            proximo === '"'
        ) {

            campo += '"';

            i++;


        } else if (
            caractere === '"'
        ) {

            dentroAspas =
                !dentroAspas;


        } else if (
            caractere === "," &&
            !dentroAspas
        ) {

            linha.push(
                campo
            );

            campo = "";


        } else if (
            (
                caractere === "\n" ||
                caractere === "\r"
            )
            &&
            !dentroAspas
        ) {

            if (
                caractere === "\r" &&
                proximo === "\n"
            ) {

                i++;

            }


            linha.push(
                campo
            );

            campo = "";


            if (
                linha.some(
                    valor =>
                        valor.trim() !== ""
                )
            ) {

                linhas.push(
                    linha
                );

            }


            linha = [];


        } else {

            campo += caractere;

        }

    }


    if (
        campo !== "" ||
        linha.length > 0
    ) {

        linha.push(
            campo
        );


        if (
            linha.some(
                valor =>
                    valor.trim() !== ""
            )
        ) {

            linhas.push(
                linha
            );

        }

    }


    return linhas;

}


// ======================================================
// CARREGA PLANILHA
// ======================================================

async function carregarRevendas() {

    try {

        const resposta =
            await fetch(
                `${URL_PLANILHA}&_=${Date.now()}`
            );


        if (!resposta.ok) {

            throw new Error(
                "Não foi possível acessar a planilha."
            );

        }


        const texto =
            await resposta.text();


        console.log(
            "CSV recebido:",
            texto.substring(
                0,
                1000
            )
        );


        const linhas =
            parseCSV(texto);


        if (
            !linhas.length
        ) {

            throw new Error(
                "Planilha vazia."
            );

        }


        // ==================================================
        // CABEÇALHO
        // ==================================================

        const cabecalhoOriginal =
            linhas[0];


        const cabecalho =
            cabecalhoOriginal.map(
                coluna =>
                    normalizar(coluna)
            );


        console.log(
            "CABEÇALHO DA PLANILHA:",
            cabecalho
        );


        // ==================================================
        // IDENTIFICA AS COLUNAS
        // ==================================================

        const colunaStatus =
            encontrarColuna(
                cabecalho,
                [
                    "STATUS"
                ]
            );


        const colunaEstado =
            encontrarColuna(
                cabecalho,
                [
                    "ESTADO",
                    "UF"
                ]
            );


        const colunaCidade =
            encontrarColuna(
                cabecalho,
                [
                    "CIDADE",
                    "MUNICIPIO",
                    "MUNICÍPIO"
                ]
            );


        const colunaRevenda =
            encontrarColuna(
                cabecalho,
                [
                    "REVENDA",
                    "NOME DA REVENDA",
                    "NOME REVENDA"
                ]
            );


        const colunaEndereco =
            encontrarColuna(
                cabecalho,
                [
                    "ENDEREÇO",
                    "ENDERECO",
                    "ENDEREÇO DA REVENDA",
                    "ENDERECO DA REVENDA"
                ]
            );


        const colunaTelefone =
            encontrarColuna(
                cabecalho,
                [
                    "TELEFONE",
                    "TELEFONE/WHATSAPP",
                    "TELEFONE WHATSAPP",
                    "WHATSAPP",
                    "CELULAR"
                ]
            );


        console.log(
            "COLUNA STATUS:",
            colunaStatus
        );

        console.log(
            "COLUNA ESTADO:",
            colunaEstado
        );

        console.log(
            "COLUNA CIDADE:",
            colunaCidade
        );

        console.log(
            "COLUNA REVENDA:",
            colunaRevenda
        );

        console.log(
            "COLUNA ENDEREÇO:",
            colunaEndereco
        );

        console.log(
            "COLUNA TELEFONE:",
            colunaTelefone
        );


        // ==================================================
        // TRANSFORMA LINHAS EM OBJETOS
        // ==================================================

        const registros =
            linhas
                .slice(1)
                .map(
                    linha => {

                        const registro = {};


                        cabecalho.forEach(
                            (
                                coluna,
                                indice
                            ) => {

                                registro[coluna] =
                                    (
                                        linha[indice] ||
                                        ""
                                    ).trim();

                            }
                        );


                        // Guarda também as colunas
                        // encontradas de forma padronizada

                        registro._STATUS =
                            colunaStatus
                            ?
                            registro[colunaStatus]
                            :
                            "";

                        registro._ESTADO =
                            colunaEstado
                            ?
                            registro[colunaEstado]
                            :
                            "";

                        registro._CIDADE =
                            colunaCidade
                            ?
                            registro[colunaCidade]
                            :
                            "";

                        registro._REVENDA =
                            colunaRevenda
                            ?
                            registro[colunaRevenda]
                            :
                            "";

                        registro._ENDERECO =
                            colunaEndereco
                            ?
                            registro[colunaEndereco]
                            :
                            "";

                        registro._TELEFONE =
                            colunaTelefone
                            ?
                            registro[colunaTelefone]
                            :
                            "";


                        return registro;

                    }
                );


        console.log(
            "PRIMEIRO REGISTRO:",
            registros[0]
        );


        return registros;


    } catch (erro) {

        console.error(
            "ERRO AO CARREGAR PLANILHA:",
            erro
        );


        return [];

    }

}


// ======================================================
// VERIFICA ESTADO
// ======================================================

function estadoCorresponde(
    valor,
    uf
) {

    const valorNormalizado =
        normalizar(valor);


    const estado =
        estados.find(
            item =>
                item[0] === uf
        );


    if (!estado) {

        return false;

    }


    return (
        valorNormalizado ===
            normalizar(estado[0])
        ||
        valorNormalizado ===
            normalizar(estado[1])
    );

}


// ======================================================
// BOTÕES DE CONSUMO
// ======================================================

document
    .querySelectorAll(
        ".consumo button"
    )
    .forEach(
        botao => {


            botao.addEventListener(
                "click",
                async function() {


                    const consumo =
                        this.dataset.consumo;


                    const estado =
                        estadoSelect.value;


                    const cidade =
                        cidadeSelect.value;


                    // ------------------------------------------
                    // VALIDAÇÃO
                    // ------------------------------------------

                    if (!estado) {

                        alert(
                            "Selecione seu estado primeiro."
                        );

                        return;

                    }


                    if (!cidade) {

                        alert(
                            "Selecione sua cidade primeiro."
                        );

                        return;

                    }


                    // ------------------------------------------
                    // CARREGANDO
                    // ------------------------------------------

                    resultado.innerHTML = `

                        <div class="resultado-card">

                            <h2>
                                Consultando...
                            </h2>

                            <p>
                                Estamos verificando
                                as opções para você.
                            </p>

                        </div>

                    `;


                    // ==================================================
                    // MAIS DE 2.000 LITROS
                    // ==================================================

                    if (
                        consumo === "mais"
                    ) {


                        const mensagem =
                            `Olá! Vim pelo site da FQ4.

Tenho consumo superior a 2.000 litros de combustível por mês.

Estado: ${estado}
Cidade: ${cidade}

Gostaria de receber informações sobre o atendimento direto pela FQ4.`;


                        const whatsapp =
                            `https://wa.me/${WHATSAPP_FABRICA}?text=${encodeURIComponent(mensagem)}`;


                        resultado.innerHTML = `

                            <div class="resultado-card">

                                <h2>
                                    Seu consumo tem potencial
                                    para atendimento direto pela FQ4.
                                </h2>

                                <p>
                                    Para consumos acima de
                                    <strong>2.000 litros</strong>
                                    de combustível por mês,
                                    podemos avaliar uma solução
                                    de atendimento direto pela fábrica.
                                </p>

                                <p>
                                    <strong>
                                        Potencial superior a
                                        2 litros de FQ4 por mês.
                                    </strong>
                                </p>

                                <a
                                    class="botao botao-whatsapp"
                                    href="${whatsapp}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    FALAR COM A FÁBRICA
                                </a>

                            </div>

                        `;


                        return;

                    }


                    // ==================================================
                    // BUSCA REVENDA
                    // ==================================================

                    const revendas =
                        await carregarRevendas();


                    console.log(
                        "ESTADO SELECIONADO:",
                        estado
                    );


                    console.log(
                        "CIDADE SELECIONADA:",
                        cidade
                    );


                    // ==================================================
                    // FILTRA
                    // ==================================================

                    const resultados =
                        revendas.filter(
                            revenda => {


                                const status =
                                    normalizar(
                                        revenda._STATUS
                                    );


                                const cidadePlanilha =
                                    normalizar(
                                        revenda._CIDADE
                                    );


                                const cidadeSelecionada =
                                    normalizar(
                                        cidade
                                    );


                                const estadoValido =
                                    estadoCorresponde(
                                        revenda._ESTADO,
                                        estado
                                    );


                                const cidadeValida =
                                    cidadePlanilha ===
                                    cidadeSelecionada;


                                return (
                                    status === "ATIVO" &&
                                    estadoValido &&
                                    cidadeValida
                                );

                            }
                        );


                    console.log(
                        "RESULTADOS ENCONTRADOS:",
                        resultados
                    );


                    // ==================================================
                    // ENCONTROU
                    // ==================================================

                    if (
                        resultados.length > 0
                    ) {


                        let html = `

                            <div class="resultado-card">

                                <h2>
                                    Encontramos uma
                                    revenda FQ4!
                                </h2>

                                <p>
                                    Confira as opções
                                    disponíveis na sua cidade:
                                </p>

                        `;


                        resultados.forEach(
                            revenda => {


                                const nome =
                                    revenda._REVENDA ||
                                    "Revenda FQ4";


                                const endereco =
                                    revenda._ENDERECO ||
                                    "Endereço não informado";


                                const telefoneOriginal =
                                    revenda._TELEFONE ||
                                    "Telefone não informado";


                                // ----------------------------------
                                // TELEFONE
                                // ----------------------------------

                                let telefone =
                                    String(
                                        telefoneOriginal
                                    )
                                    .replace(
                                        /\D/g,
                                        ""
                                    );


                                let whatsapp =
                                    "";


                                if (
                                    telefone
                                ) {

                                    if (
                                        telefone.startsWith("55")
                                    ) {

                                        whatsapp =
                                            `https://wa.me/${telefone}`;

                                    } else {

                                        whatsapp =
                                            `https://wa.me/55${telefone}`;

                                    }

                                }


                                // ----------------------------------
                                // CARD
                                // ----------------------------------

                                html += `

                                    <div
                                        class="revenda-card"
                                    >

                                        <h3>
                                            ${nome}
                                        </h3>


                                        <div
                                            class="info-revenda"
                                        >

                                            <strong>
                                                📍 Endereço
                                            </strong>

                                            <p>
                                                ${endereco}
                                            </p>

                                        </div>


                                        <div
                                            class="info-revenda"
                                        >

                                            <strong>
                                                📞 Telefone
                                            </strong>

                                            <p>
                                                ${telefoneOriginal}
                                            </p>

                                        </div>


                                        ${
                                            whatsapp
                                            ?
                                            `
                                            <a
                                                class="botao botao-whatsapp"
                                                href="${whatsapp}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                FALAR COM A REVENDA NO WHATSAPP
                                            </a>
                                            `
                                            :
                                            ""
                                        }

                                    </div>

                                `;

                            }
                        );


                        html += `

                            </div>

                        `;


                        resultado.innerHTML =
                            html;


                        return;

                    }


                    // ==================================================
                    // NÃO ENCONTROU
                    // ==================================================

                    resultado.innerHTML = `

                        <div class="resultado-card">

                            <h2>
                                Ainda não temos uma revenda
                                cadastrada nesta cidade.
                            </h2>

                            <p>
                                Você pode pesquisar por
                                produtos FQ4 disponíveis
                                para sua região no Mercado Livre.
                            </p>

                            <p>
                                Pesquise por:
                            </p>

                            <h3>
                                FQ4 FLEX/DIESEL
                            </h3>

                            <a
                                class="botao botao-mercado"
                                href="${URL_MERCADO_LIVRE}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                PESQUISAR NO MERCADO LIVRE
                            </a>

                        </div>

                    `;

                }
            );

        }
    );


// ======================================================
// INICIALIZAÇÃO
// ======================================================

carregarEstados();
