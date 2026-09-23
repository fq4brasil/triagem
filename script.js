// ======================================================
// CONFIGURAÇÕES
// ======================================================

// URL DA ABA DE REVENDAS
const URL_REVENDA =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnU51Kz93Aij3mNKNvOmzEI_z50xQSWvuf-09_J-UDucrpOwpfLEkdNkegnyO8vJ5VeSmXYRx_JyxL/pub?output=csv";

// URL DA ABA REPRESENTANTES_CONSUMO
const URL_REPRESENTANTES =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnU51Kz93Aij3mNKNvOmzEI_z50xQSWvuf-09_J-UDucrpOwpfLEkdNkegnyO8vJ5VeSmXYRx_JyxL/pub?gid=620527169&single=true&output=csv";

// ======================================================
// URL DO GOOGLE APPS SCRIPT - CAPTURA DE LEADS
// ======================================================

const URL_LEADS =
    "https://script.google.com/macros/s/AKfycby1ETMZOdPfmGSTYtm0uCtz0rHx2chmsNYxl7y9fDcg5DeKbRGpxTUfJVro87Mv2FfG/exec";

// ======================================================
// WHATSAPP DA FQ4
// ======================================================

const WHATSAPP_FABRICA =
    "5519994712833";

// ======================================================
// MERCADO LIVRE
// ======================================================

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

let cidades = {};

// ======================================================
// NORMALIZAÇÃO
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
// CARREGAR ESTADOS
// ======================================================

function carregarEstados() {

    estados.forEach(([sigla, nome]) => {

        const option =
            document.createElement("option");

        option.value = sigla;

        option.textContent =
            `${nome} (${sigla})`;

        estadoSelect.appendChild(option);

    });

}

// ======================================================
// CARREGAR CIDADES
// ======================================================

async function carregarCidades(uf) {

    cidadeSelect.innerHTML =
        '<option value="">Carregando cidades...</option>';

    cidadeSelect.disabled = true;

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
                "Erro ao consultar cidades."
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
            "Erro ao carregar cidades:",
            erro
        );

        cidadeSelect.innerHTML =
            '<option value="">Erro ao carregar cidades</option>';

        cidadeSelect.disabled = true;

    }

}

// ======================================================
// PREENCHER CIDADES
// ======================================================

function preencherCidades(lista) {

    cidadeSelect.innerHTML =
        '<option value="">Selecione sua cidade</option>';

    lista.forEach(cidade => {

        const option =
            document.createElement("option");

        option.value = cidade;

        option.textContent = cidade;

        cidadeSelect.appendChild(
            option
        );

    });

    cidadeSelect.disabled = false;

}

// ======================================================
// EVENTO ESTADO
// ======================================================

estadoSelect.addEventListener(
    "change",
    async function() {

        resultado.innerHTML = "";

        cidadeSelect.innerHTML =
            '<option value="">Selecione sua cidade</option>';

        cidadeSelect.disabled = true;

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
// LEITURA DE CSV
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

        }

        else if (
            caractere === '"'
        ) {

            dentroAspas =
                !dentroAspas;

        }

        else if (
            caractere === "," &&
            !dentroAspas
        ) {

            linha.push(
                campo
            );

            campo = "";

        }

        else if (
            (
                caractere === "\n" ||
                caractere === "\r"
            ) &&
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

        }

        else {

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
// CONVERTER CSV
// ======================================================

function converterCSV(texto) {

    const linhas =
        parseCSV(texto);

    if (!linhas.length) {

        return [];

    }

    const cabecalho =
        linhas[0].map(
            coluna =>
                normalizar(coluna)
        );

    console.log(
        "CABEÇALHO ENCONTRADO:",
        cabecalho
    );

    return linhas
        .slice(1)
        .map(linha => {

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

        });

}

// ======================================================
// CARREGAR CSV
// ======================================================

async function carregarCSV(url) {

    try {

        const resposta =
            await fetch(
                `${url}&_=${Date.now()}`
            );

        if (!resposta.ok) {

            throw new Error(
                "Não foi possível acessar a planilha."
            );

        }

        const texto =
            await resposta.text();

        console.log(
            "CSV CARREGADO:",
            texto.substring(
                0,
                500
            )
        );

        return converterCSV(
            texto
        );

    }

    catch (erro) {

        console.error(
            "ERRO AO CARREGAR CSV:",
            erro
        );

        return [];

    }

}

// ======================================================
// LOCALIZAR CAMPO
// ======================================================

function campo(
    registro,
    nomes
) {

    for (
        const nome of nomes
    ) {

        const chave =
            normalizar(nome);

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
// VERIFICAR ESTADO
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

    const sigla =
        normalizar(
            estado[0]
        );

    const nome =
        normalizar(
            estado[1]
        );

    return (
        valorNormalizado === sigla ||
        valorNormalizado === nome
    );

}

// ======================================================
// BUSCAR REVENDA
// ======================================================

async function buscarRevenda(
    estado,
    cidade
) {

    console.log(
        "BUSCANDO REVENDA..."
    );

    const registros =
        await carregarCSV(
            URL_REVENDA
        );

    const encontrados =
        registros.filter(
            registro => {

                const status =
                    campo(
                        registro,
                        ["STATUS"]
                    );

                const estadoPlanilha =
                    campo(
                        registro,
                        [
                            "ESTADO",
                            "UF"
                        ]
                    );

                const cidadePlanilha =
                    campo(
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

    console.log(
        "REVENDAS ENCONTRADAS:",
        encontrados
    );

    return encontrados;

}

// ======================================================
// MOSTRAR REVENDAS
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
                campo(
                    revenda,
                    [
                        "REVENDA",
                        "NOME DA REVENDA"
                    ]
                ) ||
                "Revenda FQ4";

            const endereco =
                campo(
                    revenda,
                    [
                        "ENDEREÇO",
                        "ENDERECO",
                        "ENDEREÇO DA REVENDA"
                    ]
                ) ||
                "Endereço não informado";

            const telefone =
                campo(
                    revenda,
                    [
                        "TELEFONE",
                        "TELEFONE/WHATSAPP",
                        "WHATSAPP",
                        "CELULAR"
                    ]
                ) ||
                "Telefone não informado";

            let numero =
                String(
                    telefone
                ).replace(
                    /\D/g,
                    ""
                );

            let whatsapp = "";

            if (numero) {

                if (
                    numero.startsWith("55")
                ) {

                    whatsapp =
                        `https://wa.me/${numero}`;

                }

                else {

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
                        ? `

                            <a
                                class="botao botao-whatsapp"
                                href="${whatsapp}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                FALAR COM A REVENDA NO WHATSAPP
                            </a>

                        `
                        : ""
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
// BUSCAR REPRESENTANTE
// ======================================================

async function buscarRepresentante(
    estado
) {

    console.log(
        "================================="
    );

    console.log(
        "BUSCANDO REPRESENTANTE"
    );

    console.log(
        "ESTADO SELECIONADO:",
        estado
    );

    console.log(
        "URL REPRESENTANTES:",
        URL_REPRESENTANTES
    );

    console.log(
        "================================="
    );

    try {

        const resposta =
            await fetch(
                URL_REPRESENTANTES +
                "&_=" +
                Date.now()
            );

        console.log(
            "STATUS DA RESPOSTA:",
            resposta.status
        );

        console.log(
            "RESPOSTA OK?:",
            resposta.ok
        );

        const texto =
            await resposta.text();

        console.log(
            "CSV RECEBIDO:"
        );

        console.log(
            texto
        );

        const registros =
            converterCSV(
                texto
            );

        console.log(
            "REGISTROS CONVERTIDOS:",
            registros
        );

        console.log(
            "TOTAL DE REPRESENTANTES:",
            registros.length
        );

        const encontrados =
            registros.filter(
                registro => {

                    const status =
                        campo(
                            registro,
                            ["STATUS"]
                        );

                    const estadoPlanilha =
                        campo(
                            registro,
                            [
                                "ESTADO",
                                "UF"
                            ]
                        );

                    console.log(
                        "ANALISANDO:",
                        registro,
                        "STATUS:",
                        status,
                        "ESTADO:",
                        estadoPlanilha
                    );

                    return (

                        normalizar(
                            status
                        ) === "ATIVO"

                        &&

                        estadoCorresponde(
                            estadoPlanilha,
                            estado
                        )

                    );

                }
            );

        console.log(
            "================================="
        );

        console.log(
            "REPRESENTANTES ENCONTRADOS:",
            encontrados
        );

        console.log(
            "TOTAL ENCONTRADO:",
            encontrados.length
        );

        console.log(
            "================================="
        );

        return encontrados;

    }

    catch (erro) {

        console.error(
            "ERRO AO BUSCAR REPRESENTANTE:",
            erro
        );

        return [];

    }

}

// ======================================================
// REGISTRAR LEAD
// ======================================================

async function registrarLead(
    dados
) {

    try {

        const formulario =
            new URLSearchParams();

        formulario.append(
            "estado",
            dados.estado || ""
        );

        formulario.append(
            "cidade",
            dados.cidade || ""
        );

        formulario.append(
            "consumo",
            dados.consumo || ""
        );

        formulario.append(
            "faixa",
            dados.faixa || ""
        );

        formulario.append(
            "destino",
            dados.destino || ""
        );

        formulario.append(
            "atendimento",
            dados.atendimento || ""
        );

        await fetch(
            URL_LEADS,
            {

                method: "POST",

                mode: "no-cors",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body:
                    formulario.toString()

            }
        );

        console.log(
            "================================="
        );

        console.log(
            "LEAD REGISTRADO:",
            dados
        );

        console.log(
            "================================="
        );

    }

    catch (erro) {

        console.error(
            "ERRO AO REGISTRAR LEAD:",
            erro
        );

    }

}

// ======================================================
// MOSTRAR REPRESENTANTE
// ======================================================

function mostrarRepresentante(
    representante,
    estado,
    cidade
) {

    const nome =
        campo(
            representante,
            [
                "REPRESENTANTE"
            ]
        );

    const telefone =
        campo(
            representante,
            [
                "WHATSAPP",
                "TELEFONE"
            ]
        );

    let numero =
        String(
            telefone
        ).replace(
            /\D/g,
            ""
        );

    if (!numero) {

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
            "55" +
            numero;

    }

    const mensagem =
        `Olá! Vim pelo site da FQ4.

Tenho consumo superior a 2.000 litros de combustível por mês.

Estado: ${estado}
Cidade: ${cidade}

Gostaria de falar sobre a compra de FQ4 para minha operação.`;

    const whatsapp =
        `https://wa.me/${numero}?text=${encodeURIComponent(
            mensagem
        )}`;

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
                Para continuar seu atendimento,
                fale diretamente com o representante.
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
// MOSTRAR FÁBRICA
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
        `https://wa.me/${WHATSAPP_FABRICA}?text=${encodeURIComponent(
            mensagem
        )}`;

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
// MOSTRAR MERCADO LIVRE
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

                    // ==========================================
                    // MAIS DE 2.000 LITROS
                    // ==========================================

                    if (
                        consumo === "mais"
                    ) {

                        const representantes =
                            await buscarRepresentante(
                                estado
                            );

                        if (
                            representantes.length > 0
                        ) {

                            const representante =
                                representantes[0];

                            const nomeRepresentante =
                                campo(
                                    representante,
                                    [
                                        "REPRESENTANTE"
                                    ]
                                );

                            await registrarLead({

                                estado:
                                    estado,

                                cidade:
                                    cidade,

                                consumo:
                                    "Mais de 2.000 litros/mês",

                                faixa:
                                    "> 2.000 L/mês",

                                destino:
                                    "REPRESENTANTE",

                                atendimento:
                                    nomeRepresentante ||
                                    "Representante FQ4"

                            });

                            mostrarRepresentante(
                                representante,
                                estado,
                                cidade
                            );

                        }

                        else {

                            await registrarLead({

                                estado:
                                    estado,

                                cidade:
                                    cidade,

                                consumo:
                                    "Mais de 2.000 litros/mês",

                                faixa:
                                    "> 2.000 L/mês",

                                destino:
                                    "FQ4",

                                atendimento:
                                    "Fábrica / Comercial FQ4"

                            });

                            mostrarFabrica(
                                estado,
                                cidade
                            );

                        }

                        return;

                    }

                    // ==========================================
                    // ATÉ 2.000 LITROS
                    // ==========================================

                    const revendas =
                        await buscarRevenda(
                            estado,
                            cidade
                        );

                    if (
                        revendas.length > 0
                    ) {

                        const primeiraRevenda =
                            revendas[0];

                        const nomeRevenda =
                            campo(
                                primeiraRevenda,
                                [
                                    "REVENDA",
                                    "NOME DA REVENDA"
                                ]
                            );

                        await registrarLead({

                            estado:
                                estado,

                            cidade:
                                cidade,

                            consumo:
                                consumo,

                            faixa:
                                "Até 2.000 L/mês",

                            destino:
                                "REVENDA",

                            atendimento:
                                nomeRevenda ||
                                "Revenda FQ4"

                        });

                        mostrarRevendas(
                            revendas
                        );

                    }

                    else {

                        await registrarLead({

                            estado:
                                estado,

                            cidade:
                                cidade,

                            consumo:
                                consumo,

                            faixa:
                                "Até 2.000 L/mês",

                            destino:
                                "MERCADO LIVRE",

                            atendimento:
                                "Sem revenda cadastrada"

                        });

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
