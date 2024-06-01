document.addEventListener("DOMContentLoaded", main);

const baseUrl = `http://servicodados.ibge.gov.br/api/v3/noticias`;
const baseUrlImage = `https://agenciadenoticias.ibge.gov.br/`;

function main() {
    updateValuesForms();
    showNoticias();
}

function openModal() {
    const dialog = document.querySelector("dialog");
    dialog.showModal();
}

function closeModal() {
    const dialog = document.querySelector("dialog");
    dialog.close();
}

function sendFilter(event) {
    event.preventDefault();
    showNoticias(1);
    closeModal();
}

function showNoticias(page, search) {
    constructQueryString(page, search);
    fetchNoticias();
    countFilters();
}

function constructQueryString(page, search) {

    const formFilter = document.querySelector("#form-filter");
    const formData = new FormData(formFilter);
    const urlParams = new URLSearchParams(location.search);

    urlParams.set('qtd', formData.get('qtd'));
    
    applyFilterOrDelete('tipo', formData, urlParams, false);
    applyFilterOrDelete('de', formData, urlParams, true);
    applyFilterOrDelete('ate', formData, urlParams, true);

    if (page) urlParams.set('page', page);
    if (search) urlParams.set('busca', search);
    if (search === '') urlParams.delete('busca');
    
    history.pushState({}, '', `${location.pathname}?${urlParams.toString()}`);
    updateValuesForms();
}

function applyFilterOrDelete(field, form, url, isDate) {

    let formField = form.get(field);

    if (!formField) {
        url.delete(field);
        return;
    }
    
    if (isDate) {
        formField = formatData(formField);
    }

    url.set(field, formField);
}

function updateValuesForms() {
    
    const urlParams = new URLSearchParams(location.search);

    urlParams.forEach((value, key) => {
        const element = document.getElementById(key);

        if (!element) return;

        if (element?.id === 'de' || element?.id === 'ate') {
            element.value = formatDataForValue(value);
            return;
        }

        element.value = value;
    })

}

function formatData(data) {
    const [year, month, day] = data.split('-');
    return `${month}-${day}-${year}`;
}

function formatDataForValue(data) {

    if (!data) return;

    const [month, day, year] = data.split('-');
    return `${year}-${month}-${day}`;
}

async function fetchNoticias() {

    const response = await fetch(`${baseUrl}${location.search}`);
    const json = await response.json();

    const ul = document.querySelector('#noticias');
    ul.innerHTML = '';
    json.items.forEach(noticia => createNoticia(ul, noticia));
    createPaginator(json.page, json.totalPages);

}

async function createNoticia(ul, noticia) {

    const li = document.createElement('li');

    li.innerHTML = 
    `
        <section>
            <div class="image-cover" style="background-image: url('${filterImage(noticia.imagens)}')"></div>
            <div>
                <h2>${noticia.titulo}</h2>
                <p>${noticia.introducao}</p>
                <span>
                    <p>${appendEditorias(noticia.editorias)}</p>
                    <p>${filterDataPublicacao(noticia.data_publicacao)}</p>
                </span>
                <a href="${noticia.link}" target="_blank"><button>Leia mais</button></a>
            </div>
        </section>
    `

    ul.appendChild(li);
}

function filterImage(image) {
    const imageJson = JSON.parse(image);
    return baseUrlImage + imageJson.image_intro;
}

function filterDataPublicacao(dataPublicacao) {

    const [day, month, year] = dataPublicacao.split(" ")[0].split('/');

    const date = Date.now();
    const dataPublicacaoDate = new Date(year, month - 1, day);

    const milliseconds = date - dataPublicacaoDate.getTime();
    const dias = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

    if (dias === 0) {
        return 'Publicado hoje';
    }

    if (dias === 1) {
        return 'Publicado ontem';
    }

    return `Publicado há ${dias} dias`

}

function appendEditorias(editorias) {

    console.log(editorias);

    editorias = editorias.split(";")
    let finalEditoria = '';

    editorias.forEach(editoria => {
        finalEditoria += `#${editoria} `
    })

    return finalEditoria;
}

function createPaginator(page, totalPages) {

    const paginator = document.querySelector("#paginator");
    paginator.innerHTML = '';
    let initialPage = 1;
    let lastPage = 10;

    if (page > 6) {
        initialPage = page - 5;
        lastPage = initialPage + 9;
    }

    if (totalPages < 10) {
        lastPage = totalPages;
    }

    for(i = initialPage; i <= lastPage; i++) {
        paginator.appendChild(createButtonPaginator(i, page));
    }
}

function createButtonPaginator(page, selected) {
    const li = document.createElement("li");

    if (page === selected) {
        li.innerHTML = `<button onClick="selectPage(event)" class="selected">${page}</button>`
        return li;
    }

    li.innerHTML = `<button onClick="selectPage(event)">${page}</button>`
    return li;
}

function selectPage(event) {
    event.preventDefault();
    showNoticias(event.target.textContent)
}

function onSearch(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const search = formData.get("search");

    if (search) {
        search.valueOf = search 
    }

    showNoticias(1, search);
}

function countFilters() {

    const countFilters = document.querySelector("#count-filters");

    const quantityFilters = location.search.split("&")
        .filter(filter => !filter.includes("page=") && !filter.includes("busca="))
        .length

    countFilters.textContent = quantityFilters;
}