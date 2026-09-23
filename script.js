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
// CARREGA CIDADES DO IBGE
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
                .map(
                    item => item.nome
                )
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
            "Erro ao carregar cidades:",
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
// CONVERTE CSV EM OBJETOS
// ======================================================

function converterCSVParaObjetos(texto) {

    const linhas =
        parseCSV(texto);


    if (
        !linhas.length
    ) {

        return [];

    }


    const cabecalho =
        linhas[0].map(
            coluna =>
                normalizar(coluna)
        );


    return linhas
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


                return registro;

            }
        );

}


// ======================================================
// LOCALIZA COLUNA
// ======================================================

function pegarCampo(
    registro,
    possibilidades
) {

    for (
        const campo of possibilidades
    ) {

        const chave =
            normalizar(campo);


        if (
            Object.prototype.hasOwnProperty.call(
                registro,
                chave
            )
        ) {

            return registro[chave];

        }

    }


    return "";

}


// ======================================================
// CARREGA PLANILHA
// ======================================================

async function carregarPlanilha() {

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
            "PLANILHA RECEBIDA:",
            texto.substring(
                0,
                500
            )
        );


        return converterCSVParaObjetos(
            texto
        );


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
// PROCURA REVENDA
// ======================================================

async function procurarRevenda(
    estado,
    cidade
) {

    const registros =
        await carregarPlanilha();


    return registros.filter(
        registro => {

            const status =
                pegarCampo(
                    registro,
                    [
                        "STATUS"
                    ]
                );


            const estadoPlanilha =
                pegarCampo(
                    registro,
                    [
                        "ESTADO",
                        "UF"
                    ]
                );


            const cidadePlanilha =
                pegarCampo(
                    registro,
                    [
                        "CIDADE",
                        "MUNICIPIO",
                        "MUNICÍPIO"
                    ]
                );


            return (

                normalizar(status) ===
                "ATIVO"

                &&

                estadoCorresponde(
                    estadoPlanilha,
                    estado
                )

                &&

                normalizar(
                    cidadePlanilha
                ) ===
                normalizar(
                    cidade
                )

            );

        }
    );

}


// ======================================================
// EXIBE REVENDAS
// ======================================================

function mostrarRevendas(
    revendas
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


    revendas.forEach(
        revenda => {

            const nome =
                pegarCampo(
                    revenda,
                    [
                        "REVENDA",
                        "NOME DA REVENDA",
                        "NOME REVENDA"
                    ]
                )
                ||
                "Revenda FQ4";


            const endereco =
                pegarCampo(
                    revenda,
                    [
                        "ENDEREÇO",
                        "ENDERECO",
                        "ENDEREÇO DA REVENDA",
                        "ENDERECO DA REVENDA"
                    ]
                )
                ||
                "Endereço não informado";


            const telefone =
                pegarCampo(
                    revenda,
                    [
                        "TELEFONE",
                        "TELEFONE/WHATSAPP",
                        "WHATSAPP",
                        "CELULAR"
                    ]
                )
                ||
                "Telefone não informado";


            let numero =
                String(
                    telefone
                )
                .replace(
                    /\D/g,
                    ""
                );


            let whatsapp =
                "";


            if (numero) {

                if (
                    numero.startsWith("55")
                ) {

                    whatsapp =
                        `https://wa.me/${numero}`;

                } else {

                    whatsapp =
                        `https://wa.me/55${numero}`;

                }

            }


            html += `

                <div class="revenda-card">

                    <h3>
                        ${nome}
                    </h3>


                    <div class="info-revenda">

                        <strong>
                            📍 Endereço
                        </strong>

                        <p>
                            ${endereco}
                        </p>

                    </div>


                    <div class="info-revenda">

                        <strong>
                            📞 Telefone
                        </strong>

                        <p>
                            ${telefone}
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

}


// ======================================================
// REPRESENTANTES
// ======================================================
//
// IMPORTANTE:
//
// A aba REPRESENTANTES precisa ter:
//
// STATUS | ESTADO | REPRESENTANTE | WHATSAPP
//
// ======================================================

async function procurarRepresentante(
    estado
) {

    const registros =
        await carregarPlanilha();


    const representantes =
        registros.filter(
            registro => {

                const status =
                    pegarCampo(
                        registro,
                        [
                            "STATUS"
                        ]
                    );


                const estadoPlanilha =
                    pegarCampo(
                        registro,
                        [
                            "ESTADO",
                            "UF"
                        ]
                    );


                const representante =
                    pegarCampo(
                        registro,
                        [
                            "REPRESENTANTE"
                        ]
                    );


                const whatsapp =
                    pegarCampo(
                        registro,
                        [
                            "WHATSAPP",
                            "TELEFONE"
                        ]
                    );


                return (

                    normalizar(status) ===
                    "ATIVO"

                    &&

                    estadoCorresponde(
                        estadoPlanilha,
                        estado
                    )

                    &&

                    representante !== ""

                    &&

                    whatsapp !== ""

                );

            }
        );


    return representantes;

}


// ======================================================
// MOSTRA REPRESENTANTE
// ======================================================

function mostrarRepresentante(
    representante,
    estado,
    cidade
) {

    const nome =
        pegarCampo(
            representante,
            [
                "REPRESENTANTE"
            ]
        );


    const telefone =
        pegarCampo(
            representante,
            [
                "WHATSAPP",
                "TELEFONE"
            ]
        );


    let numero =
        String(
            telefone
        )
        .replace(
            /\D/g,
            ""
        );


    if (
        !numero
    ) {

        mostrarFabrica(
            estado,
            cidade
        );

        return;

    }


    if (
        !numero.startsWith("55")
    ) {

        numero =
            "55" + numero;

    }


    const mensagem =
        `Olá! Vim pelo site da FQ4.

Tenho consumo superior a 2.000 litros de combustível por mês.

Estado: ${estado}
Cidade: ${cidade}

Gostaria de falar sobre a compra de FQ4 para minha operação.`;


    const whatsapp =
        `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;


    resultado.innerHTML = `

        <div class="resultado-card">

            <h2>
                Atendimento FQ4 para grandes consumidores
            </h2>


            <p>
                Identificamos um representante
                que atende o seu estado.
            </p>


            <h3>
                ${nome}
            </h3>


            <p>
                Seu consumo pode ser atendido
                diretamente pelo representante.
            </p>


            <a
                class="botao botao-whatsapp"
                href="${whatsapp}"
                target="_blank"
                rel="noopener noreferrer"
            >
                FALAR COM O REPRESENTANTE
            </a>

        </div>

    `;

}


// ======================================================
// MOSTRA FÁBRICA
// ======================================================

function mostrarFabrica(
    estado,
    cidade
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
                Atendimento direto FQ4
            </h2>


            <p>
                Seu consumo tem potencial para
                atendimento comercial direto.
            </p>


            <p>
                No momento, não identificamos
                um representante cadastrado
                para o seu estado.
            </p>


            <a
                class="botao botao-whatsapp"
                href="${whatsapp}"
                target="_blank"
                rel="noopener noreferrer"
            >
                FALAR COM A FQ4
            </a>

        </div>

    `;

}


// ======================================================
// MOSTRA MERCADO LIVRE
// ======================================================

function mostrarMercadoLivre() {

    resultado.innerHTML = `

        <div class="resultado-card">

            <h2>
                Ainda não temos uma revenda
                cadastrada nesta cidade.
            </h2>


            <p>
                Você pode pesquisar produtos FQ4
                disponíveis para sua região
                no Mercado Livre.
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
                    // VALIDA ESTADO
                    // ------------------------------------------

                    if (!estado) {

                        alert(
                            "Selecione seu estado primeiro."
                        );

                        return;

                    }


                    // ------------------------------------------
                    // VALIDA CIDADE
                    // ------------------------------------------

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
                                a melhor opção para você.
                            </p>

                        </div>

                    `;


                    // ==================================================
                    // MAIS DE 2.000 LITROS
                    // ==================================================

                    if (
                        consumo === "mais"
                    ) {

                        /*
                         * ATENÇÃO:
                         *
                         * Aqui consultamos os representantes.
                         *
                         * Porém, para funcionar corretamente,
                         * a aba REPRESENTANTES precisa estar
                         * publicada como uma fonte CSV própria.
                         */


                        const representantes =
                            await procurarRepresentante(
                                estado
                            );


                        if (
                            representantes.length > 0
                        ) {

                            mostrarRepresentante(
                                representantes[0],
                                estado,
                                cidade
                            );

                        } else {

                            mostrarFabrica(
                                estado,
                                cidade
                            );

                        }


                        return;

                    }


                    // ==================================================
                    // ATÉ 2.000 LITROS
                    // ==================================================

                    const revendas =
                        await procurarRevenda(
                            estado,
                            cidade
                        );


                    if (
                        revendas.length > 0
                    ) {

                        mostrarRevendas(
                            revendas
                        );

                    } else {

                        mostrarMercadoLivre();

                    }

                }

            );

        }
    );


// ======================================================
// INICIALIZAÇÃO
// ======================================================

carregarEstados();
