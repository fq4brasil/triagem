// ======================================================
// CONFIGURAÇÕES
// ======================================================

const URL_PLANILHA =
    "COLE_AQUI_A_URL_CSV_DA_PLANILHA";

const WHATSAPP_FABRICA =
    "5519994712833";


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

        option.value = sigla;

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

    try {

        const resposta = await fetch(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
        );

        const dados =
            await resposta.json();

        cidades[uf] =
            dados
                .map(item => item.nome)
                .sort((a, b) =>
                    a.localeCompare(b, "pt-BR")
                );

        cidadeSelect.innerHTML =
            '<option value="">Selecione sua cidade</option>';

        cidades[uf].forEach(cidade => {

            const option =
                document.createElement("option");

            option.value = cidade;

            option.textContent = cidade;

            cidadeSelect.appendChild(option);

        });

        cidadeSelect.disabled = false;

    } catch (erro) {

        console.error(erro);

        cidadeSelect.innerHTML =
            '<option value="">Não foi possível carregar as cidades</option>';

    }

}


// ======================================================
// SELEÇÃO DO ESTADO
// ======================================================

estadoSelect.addEventListener("change", async function() {

    const uf =
        this.value;

    resultado.innerHTML = "";

    if (!uf) {

        cidadeSelect.innerHTML =
            '<option value="">Primeiro selecione o estado</option>';

        cidadeSelect.disabled = true;

        return;

    }

    await carregarCidades(uf);

});


// ======================================================
// CSV
// ======================================================

function parseCSV(texto) {

    const linhas = [];

    let linha = [];

    let campo = "";

    let dentroAspas = false;

    for (let i = 0; i < texto.length; i++) {

        const caractere =
            texto[i];

        const proximo =
            texto[i + 1];

        if (caractere === '"' && dentroAspas && proximo === '"') {

            campo += '"';

            i++;

        } else if (caractere === '"') {

            dentroAspas = !dentroAspas;

        } else if (caractere === "," && !dentroAspas) {

            linha.push(campo);

            campo = "";

        } else if (
            (caractere === "\n" || caractere === "\r")
            && !dentroAspas
        ) {

            if (caractere === "\r" && proximo === "\n") {
                i++;
            }

            linha.push(campo);

            campo = "";

            if (linha.some(valor => valor.trim() !== "")) {
                linhas.push(linha);
            }

            linha = [];

        } else {

            campo += caractere;

        }

    }

    if (campo !== "" || linha.length > 0) {

        linha.push(campo);

        if (linha.some(valor => valor.trim() !== "")) {
            linhas.push(linha);
        }

    }

    return linhas;

}


// ======================================================
// CARREGA REVENDA
// ======================================================

async function carregarRevendas() {

    try {

        const resposta =
            await fetch(URL_PLANILHA);

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

        const cabecalho =
            linhas[0].map(
                item => normalizar(item)
            );

        return linhas
            .slice(1)
            .map(linha => {

                const registro = {};

                cabecalho.forEach(
                    (coluna, indice) => {

                        registro[coluna] =
                            linha[indice] || "";

                    }
                );

                return registro;

            });

    } catch (erro) {

        console.error(
            "Erro ao carregar planilha:",
            erro
        );

        return [];

    }

}


// ======================================================
// BOTÕES DE CONSUMO
// ======================================================

document
    .querySelectorAll(".consumo button")
    .forEach(botao => {

        botao.addEventListener("click", async function() {

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
                    <h2>Consultando...</h2>
                    <p>Estamos verificando as opções para você.</p>
                </div>
            `;


            // ==================================================
            // MAIS DE 2.000 LITROS
            // ==================================================

            if (consumo === "mais") {

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

                        <h2>Seu consumo tem potencial para atendimento direto pela FQ4.</h2>

                        <p>
                            Para consumos acima de 2.000 litros de combustível por mês,
                            podemos avaliar uma solução de atendimento direto pela fábrica.
                        </p>

                        <p>
                            <strong>
                            Potencial superior a 2 litros de FQ4 por mês.
                            </strong>
                        </p>

                        <a
                            class="botao botao-whatsapp"
                            href="${whatsapp}"
                            target="_blank"
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


            const resultados =
                revendas.filter(revenda => {

                    const status =
                        normalizar(revenda["STATUS"]);

                    const uf =
                        normalizar(revenda["ESTADO"]);

                    const cidadePlanilha =
                        normalizar(revenda["CIDADE"]);

                    return (

                        status === "ATIVO" &&

                        uf === normalizar(estado) &&

                        cidadePlanilha === normalizar(cidade)

                    );

                });


            // ==================================================
            // ENCONTROU REVENDA
            // ==================================================

            if (resultados.length > 0) {

                let html = `

                    <div class="resultado-card">

                        <h2>Encontramos uma revenda FQ4!</h2>

                        <p>
                            Confira as opções disponíveis na sua cidade:
                        </p>

                `;


                resultados.forEach(revenda => {

                    const telefone =
                        String(
                            revenda["TELEFONE"] || ""
                        )
                        .replace(/\D/g, "");


                    let whatsapp = "";

                    if (telefone) {

                        whatsapp =
                            `https://wa.me/55${telefone}`;

                    }


                    html += `

                        <div style="
                            margin-top:20px;
                            padding:20px;
                            border:1px solid #e4e7ec;
                            border-radius:12px;
                        ">

                            <h3>
                                ${revenda["REVENDA"] || "Revenda FQ4"}
                            </h3>

                            ${
                                revenda["ENDEREÇO"]
                                ?
                                `<p>${revenda["ENDEREÇO"]}</p>`
                                :
                                ""
                            }

                            ${
                                revenda["TELEFONE"]
                                ?
                                `<p>Telefone: ${revenda["TELEFONE"]}</p>`
                                :
                                ""
                            }

                            ${
                                whatsapp
                                ?
                                `
                                <a
                                    class="botao botao-whatsapp"
                                    href="${whatsapp}"
                                    target="_blank"
                                >
                                    FALAR COM A REVENDA
                                </a>
                                `
                                :
                                ""
                            }

                        </div>

                    `;

                });


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
                        Ainda não temos uma revenda cadastrada
                        nesta cidade.
                    </h2>

                    <p>
                        Você pode pesquisar no Mercado Livre
                        por produtos FQ4 disponíveis para sua região.
                    </p>

                    <p>
                        No Mercado Livre, pesquise:
                    </p>

                    <h3>
                        "FQ4 FLEX/DIESEL"
                    </h3>

                    <a
                        class="botao botao-mercado"
                        href="https://www.mercadolivre.com.br/"
                        target="_blank"
                    >
                        IR PARA O MERCADO LIVRE
                    </a>

                </div>

            `;

        });

    });


// ======================================================
// INICIALIZAÇÃO
// ======================================================

carregarEstados();
