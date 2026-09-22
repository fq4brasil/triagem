const estado = document.getElementById("estado");
const cidade = document.getElementById("cidade");


estado.addEventListener("change", async function () {

    const uf = estado.value;

    // Limpa a cidade
    cidade.innerHTML = "";

    // Se nenhum estado foi escolhido
    if (!uf) {

        cidade.disabled = true;

        const option = document.createElement("option");

        option.textContent = "Primeiro selecione o estado";

        option.value = "";

        cidade.appendChild(option);

        return;
    }


    // Enquanto carrega
    cidade.disabled = true;

    const carregando = document.createElement("option");

    carregando.textContent = "Carregando cidades...";

    carregando.value = "";

    cidade.appendChild(carregando);


    try {

        /*
        API oficial de municípios do IBGE
        */

        const resposta = await fetch(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`
        );


        const cidades = await resposta.json();


        // Limpa novamente
        cidade.innerHTML = "";


        // Opção inicial
        const primeiraOpcao = document.createElement("option");

        primeiraOpcao.textContent = "Selecione sua cidade";

        primeiraOpcao.value = "";

        cidade.appendChild(primeiraOpcao);


        // Adiciona as cidades
        cidades.forEach(function (item) {

            const option = document.createElement("option");

            option.value = item.nome;

            option.textContent = item.nome;

            cidade.appendChild(option);

        });


        // Libera o campo
        cidade.disabled = false;


    } catch (erro) {

        cidade.innerHTML = "";

        const option = document.createElement("option");

        option.textContent = "Não foi possível carregar as cidades";

        option.value = "";

        cidade.appendChild(option);

        console.error(erro);

    }

});
