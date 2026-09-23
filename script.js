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
// ELEMENTOS DA PÁGINA
// ======================================================

const estadoSelect =
    document.getElementById("estado");

const cidadeSelect =
    document.getElementById("cidade");

const resultado =
    document.getElementById("resultado");


// ======================================================
// ESTADOS BRASILEIROS
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
// BANCO DE CIDADES
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
        .trim()
        .toUpperCase();

}


// ======================================================
// CARREGA ESTADOS
// ======================================================

function carregarEstados() {

    estados.forEach(([sigla, nome]) => {

        const option =
            document.createElement("option");

        option.value =
            sigla;

        option.textContent =
            `${nome} (${sigla})`;

        estadoSelect.appendChild(option);

    });

}


// ======================================================
// CARREGA CIDADES DO IBGE
// ======================================================

async function carregarCidades(uf) {

    cidadeSelect.innerHTML =
        '<option value="">Carregando cidades...</option>';

    cidadeSelect.disabled = true;


    // Se já carregamos anteriormente,
    // utiliza o resultado salvo.

    if (cidades[uf]) {

        preencherCidades(cidades[uf]);

        return;

    }


    try {

        const resposta =
            await fetch(
                `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
            );


        if (!resposta.ok) {

            throw new Error(
                "Não foi possível carregar as cidades."
            );

        }


        const dados =
            await resposta.json();


        cidades[uf] =
            dados
                .map(item => item.nome)
                .sort((a, b) =>
                    a.localeCompare(b, "pt-BR")
                );


        preencherCidades(cidades[uf]);


    } catch (erro) {

        console.error(
            "Erro ao carregar cidades:",
            erro
        );


        cidadeSelect.innerHTML =
            '<option value="">Não foi possível carregar as cidades</option>';

        cidadeSelect.disabled =
            true;

    }

}


// ======================================================
// PREENCHE SELECT DE CIDADES
// ======================================================

function preencherCidades(lista) {

    cidadeSelect.innerHTML =
        '<option value="">Selecione sua cidade</option>';


    lista.forEach(cidade => {

        const option =
            document.createElement("option");

        option.value =
            cidade;

        option.textContent =
            cidade;

        cidadeSelect.appendChild(option);

    });


    cidadeSelect.disabled =
        false;

}


// ======================================================
// SELEÇÃO DO ESTADO
// ======================================================

estadoSelect.addEventListener(
    "change",
    async function() {

        const uf =
            this.value;


        resultado.innerHTML =
            "";


        cidadeSelect.innerHTML =
            '<option value="">Selecione sua cidade</option>';

        cidadeSelect.disabled =
            true;


        if (!uf) {

            cidadeSelect.innerHTML =
                '<option value="">Primeiro selecione o estado</option>';

            return;

        }


        await carregarCidades(uf);

    }
);


// ======================================================
// PARSER CSV
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


        // Aspas duplicadas dentro de campo

        if (
            caractere === '"' &&
            dentroAspas &&
            proximo === '"'
        ) {

            campo += '"';

            i++;


        // Abre ou fecha aspas

        } else if (
            caractere === '"'
        ) {

            dentroAspas =
                !dentroAspas;


        // Separador de coluna

        } else if (
            caractere === "," &&
            !dentroAspas
        ) {

            linha.push(campo);

            campo = "";


        // Final da linha

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


            linha.push(campo);

            campo = "";


            if (
                linha.some(
                    valor =>
                        valor.trim() !== ""
                )
            ) {

                linhas.push(linha);

            }


            linha = [];


        } else {

            campo += caractere;

        }

    }


    // Última linha

    if (
        campo !== "" ||
        linha.length > 0
    ) {

        linha.push(campo);


        if (
            linha.some(
                valor =>
                    valor.trim() !== ""
            )
        ) {

            linhas.push(linha);

        }

    }


    return linhas;

}


// ======================================================
// CARREGA DADOS DA PLANILHA
// ======================================================

async function carregarRevendas() {

    try {

        // Adiciona um parâmetro para evitar
        // que o navegador use uma versão antiga
        // da planilha em cache.

        const urlAtualizada =
            `${URL_PLANILHA}&_=${Date.now()}`;


        const resposta =
            await fetch(urlAtualizada);


        if (!resposta.ok) {

            throw new Error(
                "Não foi possível acessar a planilha."
            );

        }


        const texto =
            await resposta.text();


        const linhas =
            parseCSV(texto);


        if (!linhas.length) {

            throw new Error(
                "A planilha está vazia."
            );

        }


        // Primeira linha = cabeçalho

        const cabecalho =
            linhas[0].map(
                item =>
                    normalizar(item)
            );


        console.log(
            "Colunas encontradas:",
            cabecalho
        );


        // Converte cada linha em objeto

        const registros =
            linhas
                .slice(1)
                .map(linha => {

                    const registro = {};


                    cabecalho.forEach(
                        (coluna, indice) => {

                            registro[coluna] =
                                (
                                    linha[indice] ||
                                    ""
                                ).trim();

                        }
                    );


                    return registro;

                });


        console.log(
            "Revendas carregadas:",
            registros
        );


        return registros;


    } catch (erro) {

        console.error(
            "Erro ao carregar planilha:",
            erro
        );


        return [];

    }

}


// ======================================================
// VERIFICA ESTADO
// Aceita tanto SP quanto São Paulo na planilha
// ======================================================

function estadoCorresponde(
    valorPlanilha,
    ufSelecionada
) {

    const valor =
        normalizar(valorPlanilha);


    const estado =
        estados.find(
            item =>
                item[0] === ufSelecionada
        );


    if (!estado) {

        return false;

    }


    const sigla =
        normalizar(estado[0]);

    const nome =
        normalizar(estado[1]);


    return (
        valor === sigla ||
        valor === nome
    );

}


// ======================================================
// BOTÕES DE CONSUMO
// ======================================================

document
    .querySelectorAll(".consumo button")
    .forEach(botao => {


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
                // VERIFICA ESTADO
                // ------------------------------------------

                if (!estado) {

                    alert(
                        "Selecione seu estado primeiro."
                    );

                    return;

                }


                // ------------------------------------------
                // VERIFICA CIDADE
                // ------------------------------------------

                if (!cidade) {

                    alert(
                        "Selecione sua cidade primeiro."
                    );

                    return;

                }


                // ------------------------------------------
                // MOSTRA CARREGANDO
                // ------------------------------------------

                resultado.innerHTML = `

                    <div class="resultado-card">

                        <h2>Consultando...</h2>

                        <p>
                            Estamos verificando as opções
                            disponíveis para você.
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
                // ATÉ 2.000 LITROS
                // ==================================================

                const revendas =
                    await carregarRevendas();


                // ==================================================
                // PROCURA REVENDA
                // ==================================================

                const resultados =
                    revendas.filter(
                        revenda => {


                            const status =
                                normalizar(
                                    revenda["STATUS"]
                                );


                            const cidadePlanilha =
                                normalizar(
                                    revenda["CIDADE"]
                                );


                            const cidadeSelecionada =
                                normalizar(
                                    cidade
                                );


                            const estadoValido =
                                estadoCorresponde(
                                    revenda["ESTADO"],
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
                    "Revendas encontradas:",
                    resultados
                );


                // ==================================================
                // ENCONTROU REVENDA
                // ==================================================

                if (
                    resultados.length > 0
                ) {


                    let html = `

                        <div class="resultado-card">

                            <h2>
                                Encontramos uma revenda FQ4!
                            </h2>


                            <p>
                                Confira as opções disponíveis
                                na sua cidade:
                            </p>

                    `;


                    // ----------------------------------------------
                    // MOSTRA TODAS AS REVENDAS DA CIDADE
                    // ----------------------------------------------

                    resultados.forEach(
                        revenda => {


                            const nomeRevenda =
                                revenda["REVENDA"] ||
                                "Revenda FQ4";


                            const endereco =
                                revenda["ENDEREÇO"] ||
                                "";


                            const telefoneOriginal =
                                revenda["TELEFONE"] ||
                                "";


                            // --------------------------------------
                            // PREPARA TELEFONE PARA WHATSAPP
                            // --------------------------------------

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


                            // --------------------------------------
                            // CARD DA REVENDA
                            // --------------------------------------

                            html += `

                                <div
                                    class="revenda-card"
                                >

                                    <h3>
                                        ${nomeRevenda}
                                    </h3>


                                    ${
                                        endereco
                                        ?
                                        `

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

                                        `
                                        :
                                        `
                                        <div
                                            class="info-revenda"
                                        >

                                            <strong>
                                                📍 Endereço
                                            </strong>

                                            <p>
                                                Não informado
                                            </p>

                                        </div>
                                        `
                                    }


                                    ${
                                        telefoneOriginal
                                        ?
                                        `

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

                                        `
                                        :
                                        `
                                        <div
                                            class="info-revenda"
                                        >

                                            <strong>
                                                📞 Telefone
                                            </strong>

                                            <p>
                                                Não informado
                                            </p>

                                        </div>
                                        `
                                    }


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
                // NÃO ENCONTROU REVENDA
                // ==================================================

                resultado.innerHTML = `

                    <div class="resultado-card">

                        <h2>
                            Ainda não temos uma revenda
                            cadastrada nesta cidade.
                        </h2>


                        <p>
                            Mas você pode encontrar produtos
                            FQ4 disponíveis para sua região
                            no Mercado Livre.
                        </p>


                        <p>
                            Clique abaixo para pesquisar:
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

    });


// ======================================================
// INICIALIZAÇÃO
// ======================================================

carregarEstados();
