<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { PanelLeftClose, PanelRightClose } from 'lucide-vue-next';

// TODO Use alternative API as fallback
// TODO Perhaps implement a better font

const oficial = ref(0);
const blue = ref(0);
const bolsa = ref(0);
const contadoConLiqui = ref(0);
const mayorista = ref(0);
const cripto = ref(0);
const tarjeta = ref(0);
const euro = ref(0);
const real = ref(0);
const uruguayo = ref(0);
const isHidden = ref<boolean>(false);
const dollarContainer = ref<HTMLElement | null>(null);

// New state for hiding the container


function getValues() {
    axios.get("https://dolarapi.com/v1/dolares")
        .then(response => {
            oficial.value = response.data[0].venta;
            blue.value = response.data[1].venta;
            bolsa.value = response.data[2].venta;
            contadoConLiqui.value = response.data[3].venta;
            mayorista.value = response.data[4].venta;
            cripto.value = response.data[5].venta;
            tarjeta.value = response.data[6].venta;
        })
        .catch(error => {
            console.error(error);
        });

    axios.get("https://dolarapi.com/v1/cotizaciones")
        .then(response => {
            euro.value = response.data[1].venta;
            real.value = response.data[2].venta;
            uruguayo.value = response.data[4].venta;
        });
}

function formatCurrency(value: number): string {
    return value > 0
        ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false })
        : '';
}

// Handler for hiding the container
function hideContainer() {
    isHidden.value = true;
}

onMounted(() => {
    getValues();
});

function slideLeft() {
    if (dollarContainer.value) {
        dollarContainer.value.style.transform = 'translateX(-96%)';
        dollarContainer.value.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        isHidden.value = true;
    }
}

function slideRight() {
    if (dollarContainer.value) {
        dollarContainer.value.style.transform = 'translateX(0)';
        dollarContainer.value.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        isHidden.value = false;
    }
}
</script>

<template>
    <div id="dollar-container" ref="dollarContainer">
        <span id="hideable-container">
            <div id="oficial-container" class="exchange-container" title="Dólar oficial">
                <h2 id="oficial-header" class="exchange-title">Oficial</h2>
                <h4 v-if="oficial > 0" class="exchange-value">${{ formatCurrency(oficial) }} </h4>
            </div>

            <div id="blue-container" class="exchange-container" title="Dolar blue/informal">
                <h2 id="blue-header" class="exchange-title">Blue</h2>
                <h4 v-if="blue > 0" class="exchange-value">${{ formatCurrency(blue) }}</h4>
            </div>

            <div id="bolsa-container" class="exchange-container" title="Dolar Mercado Electrónico de Pagos">
                <h2 id="bolsa-header" class="exchange-title">MEP</h2>
                <h4 v-if="bolsa > 0" class="exchange-value">${{ formatCurrency(bolsa) }}</h4>
            </div>

            <div id="ccl-container" class="exchange-container" title="Dólar Contado con Liqui">
                <h2 id="contadoConLiqui-header" class="exchange-title">CCL</h2>
                <h4 v-if="contadoConLiqui > 0" class="exchange-value">${{ formatCurrency(contadoConLiqui) }}</h4>
            </div>

            <div id="mayorista-container" class="exchange-container" title="Dólar mayorista">
                <h2 id="mayorista-header" class="exchange-title">Mayorista</h2>
                <h4 v-if="mayorista > 0" class="exchange-value">${{ formatCurrency(mayorista) }}</h4>
            </div>

            <div id="cripto-container" class="exchange-container" title="Dólar cripto (Stablecoin)">
                <h2 id="cripto-header" class="exchange-title">Cripto</h2>
                <h4 v-if="mayorista > 0" class="exchange-value">${{ formatCurrency(cripto) }}</h4>
            </div>

            <div id="tarjeta-container" class="exchange-container" title="Dólar tarjeta">
                <h2 id="tarjeta-header" class="exchange-title">Tarjeta</h2>
                <h4 v-if="mayorista > 0" class="exchange-value">${{ formatCurrency(tarjeta) }}</h4>
            </div>

            <div id="euro-container" class="exchange-container" title="Euro oficial">
                <h2 id="euro-header" class="exchange-title">Euro</h2>
                <h4 v-if="euro > 0" class="exchange-value">${{ formatCurrency(euro) }}</h4>
            </div>

            <div id="real-container" class="exchange-container" title="Real brasileño oficial">
                <h2 id="real-header" class="exchange-title">Real</h2>
                <h4 v-if="real > 0" class="exchange-value">${{ formatCurrency(real) }}</h4>
            </div>

            <div id="uruguayo-container" class="exchange-container" title="Peso uruguayo oficial">
                <h2 id="uruguayo-header" class="exchange-title">Uruguayo</h2>
                <h4 v-if="uruguayo > 0" class="exchange-value">${{ formatCurrency(uruguayo) }}</h4>
            </div>
        </span>

        <div id="hide-button-container">
            <button id="hide-button" @click="isHidden ? slideRight() : slideLeft()">
                <component :is="isHidden ? PanelRightClose : PanelLeftClose" class="hide-icon" />
            </button>
        </div>
    </div>
</template>

<style scoped>
#dollar-container {
    display: flex;
    flex-direction: row;
    text-align: center;
    position: absolute;
    left: 0;
    top: 0;
    background-color: #333;
    border-left: none;
    border-right: none;
    height: 75px;
}

#hideable-container {
    display: flex;
    flex-direction: row;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s;
    border: 1px solid #f2f2f2;
    border-left: none;
    border-right: none;
}

#dollar-container,
#hide-button {
    border-top-right-radius: 40px;
    border-bottom-right-radius: 40px;
    border-start-start-radius: 0px;
}

#hide-button {
    width: 50px;
    height: 75px;
    background-color: #f2f2f2;
    color: #333;
    padding: 0;
    padding-bottom: 1px;
    border: none;
}

.hide-icon {
    width: 35px;
    height: 35px;

}

#hide-button:hover {
    background-color: #dddddd;
}

#hide-button:focus {
    border: none;
}

.exchange-container {
    padding: 0px 10px;
    height: 77px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.exchange-title {
    font-size: 30px;
    user-select: none;
}

.exchange-value {
    font-size: 22px;
}

#oficial-container {
    color: #85BB65;
}

#blue-container {
    color: #2196F3
}

#bolsa-container {
    color: #9C27B0;
}

#ccl-container {
    color: #FF9800;
}

#mayorista-container {
    color: #607D8B;
}

#cripto-container {
    color: #00BCD4;
}

#tarjeta-container {
    color: #F44336;
}

#real-container {
    color: #009440;
}

#euro-container {
    color: #4164cc;
}

#uruguayo-container {
    color: #77acdc;
}
</style>