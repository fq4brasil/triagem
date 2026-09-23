const URL_PLANILHA =
"https://docs.google.com/spreadsheets/d/e/https://docs.google.com/spreadsheets/d/1tm9cf0-Q8Yy0YeGO2UMlOnRLGO8wA1zhFRStP1-7gJs/edit?usp=sharing/pub?output=csv";


let revendas = [];


const estadoSelect = document.getElementById("estado");
const cidadeSelect = document.getElementById("cidade");
const resultado = document.getElementById("resultado");


// ===============================
// CARREGAR PLANILHA
// ===============================

async function carregarRevendas() {

    try {

        const resposta = await fetch(URL_PLANILHA);

        const texto = await resposta.text();

        revendas = csvParaArray(texto);

        carregarEstados();

    } catch (erro) {

        console.error("Erro ao carregar planilha:", erro);

        resultado.innerHTML = `
            <div class="resultado-card">
                <h2>Não foi possível carregar a base.</h2>
                <p>Tente novamente em alguns instantes.</p>
            </div>
        `;
    }
}


// ===============================
// CONVERTER CSV
// ===============================

function csvParaArray(texto) {

    const linhas = texto
        .trim()
        .split(/\r?\n/);

    const cabecalho = linhas[0]
        .split(",")
        .map(c => c.trim().toLowerCase());

    return linhas.slice(1).map(linha => {

        const valores = linha.split(",");

        const objeto = {};

        cabecalho.forEach((campo, indice) => {

            objeto[campo] =
                valores[indice]
                ? valores[indice].trim()
                : "";

        });

        return objeto;

    });

}


// ===============================
// CARREGAR ESTADOS
// ===============================

function carregarEstados() {

    const estados = [
        ...new Set(
            revendas
            .filter(r => r.ativa !== "NAO")
            .map(r => r.estado)
        )
    ].sort();

    estados.forEach(estado => {

        const option = document.createElement("option");

        option.value = estado;

        option.textContent = estado;

        estadoSelect.appendChild(option);

    });

}


// ===============================
// ESTADO SELECIONADO
// ===============================

estadoSelect.addEventListener("change", function() {

    const estado = this.value;

    cidadeSelect.innerHTML = "";

    if (!estado) {

        cidadeSelect.disabled = true;

        cidadeSelect.innerHTML =
            `<option>Primeiro selecione o estado</option>`;

        return;
    }


    const cidades = [
        ...new Set(

            revendas
            .filter(r =>
                r.estado.toUpperCase() === estado.toUpperCase()
            )
            .map(r => r.cidade)

        )
    ].sort();


    cidadeSelect.disabled = false;

    cidadeSelect.innerHTML =
        `<option value="">Selecione a cidade</option>`;


    cidades.forEach(cidade => {

        const option = document.createElement("option");

        option.value = cidade;

        option.textContent = cidade;

        cidadeSelect.appendChild(option);

    });

});


// ===============================
// CONSUMO
// ===============================

document.querySelectorAll(".consumo button")
.forEach(botao => {

    botao.addEventListener("click", function() {

        const consumo = this.dataset.consumo;

        const estado = estadoSelect.value;

        const cidade = cidadeSelect.value;


        if (!estado || !cidade) {

            resultado.innerHTML = `
                <div class="resultado-card">
                    <h2>Selecione seu estado e sua cidade.</h2>
                    <p>
                        Depois escolha seu consumo mensal.
                    </p>
                </div>
            `;

            return;
        }


        if (consumo === "mais") {

            mostrarFabrica();

        } else {

            procurarRevenda(
                estado,
                cidade
            );

        }

    });

});


// ===============================
// MAIS DE 2.000 LITROS
// ===============================

function mostrarFabrica() {

    resultado.innerHTML = `

        <div class="resultado-card">

            <h2>
                Seu consumo tem potencial
                para atendimento direto pela FQ4
            </h2>

            <p>
                Com um consumo superior a
                <strong>2.000 litros de combustível por mês</strong>,
                seu potencial de utilização é superior a
                <strong>2 litros de FQ4 por mês</strong>.
            </p>

            <p>
                Vamos avaliar a possibilidade de
                atendimento direto pela fábrica.
            </p>

            <a
                class="botao"
                href="https://wa.me/SEUNUMERO"
                target="_blank"
            >
                QUERO FALAR COM A FQ4
            </a>

        </div>

    `;
}


// ===============================
// PROCURAR REVENDA
// ===============================

function procurarRevenda(
    estado,
    cidade
) {

    const revenda = revendas.find(r =>

        r.ativa.toUpperCase() !== "NAO" &&

        r.estado.toUpperCase() === estado.toUpperCase() &&

        normalizar(r.cidade) === normalizar(cidade)

    );


    if (revenda) {

        mostrarRevenda(revenda);

    } else {

        mostrarMercadoLivre();

    }

}


// ===============================
// MOSTRAR REVENDA
// ===============================

function mostrarRevenda(revenda) {

    let linkWhatsApp = revenda.link;

    if (!linkWhatsApp && revenda.whatsapp) {

        linkWhatsApp =
            "https://wa.me/" +
            revenda.whatsapp.replace(/\D/g, "");

    }


    resultado.innerHTML = `

        <div class="resultado-card">

            <h2>
                Encontramos uma revenda FQ4 para você!
            </h2>

            <p>
                <strong>${revenda.revenda}</strong>
            </p>

            <p>
                ${revenda.cidade} - ${revenda.estado}
            </p>

            ${
                linkWhatsApp
                ?
                `
                <a
                    class="botao"
                    href="${linkWhatsApp}"
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
}


// ===============================
// MERCADO LIVRE
// ===============================

function mostrarMercadoLivre() {

    resultado.innerHTML = `

        <div class="resultado-card">

            <h2>
                Ainda não temos uma revenda
                cadastrada na sua cidade.
            </h2>

            <p>
                Você pode adquirir o FQ4
                pelo Mercado Livre.
            </p>

            <a
                class="botao"
                href="COLOQUE_AQUI_O_LINK_DO_MERCADO_LIVRE"
                target="_blank"
            >
                COMPRAR NO MERCADO LIVRE
            </a>

        </div>

    `;
}


// ===============================
// NORMALIZAR TEXTO
// ===============================

function normalizar(texto) {

    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();

}


// ===============================
// INICIAR
// ===============================

carregarRevendas();
