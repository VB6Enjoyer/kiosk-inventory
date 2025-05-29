<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { PanelLeftClose, PanelRightClose } from 'lucide-vue-next';
import { useCurrentlyOpenModalStore } from '../stores/openModal';

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
const apiUnavailable = ref<boolean>(false);

let intervalId: number | undefined;
let keydownListener: ((event: KeyboardEvent) => void) | undefined;

const currentlyOpenModalStore = useCurrentlyOpenModalStore();

async function checkApiStatus() {
    try {
        const response = await axios.get("https://dolarapi.com/v1/estado");
        if (response.data.estado == "Disponible") {
            getValues("dolar");
            return;
        }
    } catch (error) {
        console.error(error);
    }

    try {
        const response = await axios.get("https://maxcomperatore.online/");
        if (response.data.status == "OK") {
            getValues("argento");
            return;
        }
    } catch (error) {
        console.error(error);
    }

    getValues("none");
    apiUnavailable.value = true;
    return;
}

function getValues(apiUsed: string) {
    if (apiUsed == "dolar") {
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

        apiUnavailable.value = false;
        if (isHidden.value) slideRight();
    } else if (apiUsed == "argento") {
        axios.get("https://maxcomperatore.online/cotizaciones")
            .then(response => {
                oficial.value = response.data.usd.oficial.venta.split("ARS")[0].trim();
                blue.value = response.data.usd.blue.venta.split("ARS")[0].trim();
                bolsa.value = response.data.usd.MEP.venta.split("ARS")[0].trim();
                contadoConLiqui.value = response.data.usd.CCL.venta.split("ARS")[0].trim();
                mayorista.value = response.data.usd.Mayorista.venta.split("ARS")[0].trim();
                cripto.value = response.data.usd.Cripto.venta.split("ARS")[0].trim();
                tarjeta.value = response.data.usd.Tarjeta.venta.split("ARS")[0].trim();

                euro.value = response.data.euro.venta.split("ARS")[0].trim();
                real.value = response.data.real.venta.split("ARS")[0].trim();
                uruguayo.value = response.data.uru.venta.split("ARS")[0].trim();
            })
            .catch(error => {
                console.error(error);
            });

        apiUnavailable.value = false;
        if (isHidden.value) slideRight();
    } else {
        slideLeft();
    }
}

function formatCurrency(value: number): string {
    return value > 0
        ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false })
        : '';
}

function slideLeft() {
    if (dollarContainer.value) {
        dollarContainer.value.style.transform = 'translateX(-96.33%)';
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

onMounted(() => {
    keydownListener = (event: KeyboardEvent) => {
        if (currentlyOpenModalStore.isModalOpen) return;

        if (event.key === "ArrowRight") {
            slideRight();
        } else if (event.key === "ArrowLeft") {
            slideLeft();
        }
    };
    window.addEventListener("keydown", keydownListener);

    checkApiStatus();
    intervalId = window.setInterval(() => {
        checkApiStatus();
    }, 3600000); // Update every hour.
    // Could possibly implement this interval only on weekdays between 10:00 and 16:00 since all values but crypto remain static outside of this timeframe
});

onUnmounted(() => {
    if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
    }

    if (keydownListener) {
        window.removeEventListener("keydown", keydownListener);
        keydownListener = undefined;
    }
});
</script>

<template>
    <div id="dollar-container" ref="dollarContainer">
        <span id="hidable-container">
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
            <button id="hide-button" :disabled="apiUnavailable"
                :title="apiUnavailable ? 'No disponible actualmente' : isHidden ? 'Mostrar panel (→)' : 'Ocultar panel (←)'"
                @click="isHidden ? slideRight() : slideLeft()">
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
    background-color: var(--exchange-background-color);
    border-left: none;
    border-right: none;
    height: clamp(60px, 12vw, 75px);
    /* Responsive height */
    font-family: 'Nunito', Arial, Helvetica, sans-serif;
    overflow: hidden;
}

#hidable-container {
    display: flex;
    flex-direction: row;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s;
    border: 1px solid var(--exchange-border-color);
    border-left: none;
    border-right: none;
    overflow-x: auto;
    /* Allow horizontal scrolling on small screens */
    overflow-y: hidden;
    scrollbar-width: none;
}

#hidable-container::-webkit-scrollbar {
    display: none;
    /* Hide scrollbar for webkit browsers */
}

#dollar-container,
#hide-button {
    border-top-right-radius: clamp(20px, 8vw, 40px);
    border-bottom-right-radius: clamp(20px, 8vw, 40px);
    border-start-start-radius: 0px;
}

#hide-button {
    width: clamp(40px, 8vw, 50px);
    /* Responsive width */
    height: clamp(60px, 12vw, 75px);
    /* Responsive height */
    background-color: var(--exchange-hide-button-color);
    padding: 0;
    padding-bottom: 1px;
    border: none;
    user-select: none;
    box-shadow: none;
    transition: background-color 0.2s;
    flex-shrink: 0;
    /* Prevent shrinking */
}

#hide-button:hover {
    background-color: var(--exchange-hide-button-hover-color);
}

#hide-button:hover>.hide-icon {
    color: var(--exchange-hide-icon--hover-color);
}

#hide-button:focus {
    border: none;
}

#hide-button:disabled {
    background-color: var(--exchange-hide-button-disabled-color);
}

#hide-button:disabled:hover {
    background-color: var(--exchange-hide-button-disabled-color);
}

#hide-button:disabled:hover>.hide-icon {
    color: var(--exchange-hide-icon-color);
}

.hide-icon {
    color: var(--exchange-hide-icon-color);
    width: clamp(25px, 6vw, 35px);
    height: clamp(25px, 6vw, 35px);
    transition: color 0.2s;
}

.exchange-container {
    padding: 0px clamp(8px, 2vw, 10px);
    height: clamp(60px, 12vw, 77px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex-shrink: 0;
    box-sizing: border-box;
}

.exchange-title {
    font-size: clamp(1rem, 3vw, 1.875rem);
    /* Responsive font size */
    font-weight: 400;
    user-select: none;
}

.exchange-value {
    font-size: clamp(0.8rem, 2vw, 1.4375rem);
    font-weight: 500;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

#oficial-container {
    color: var(--official-exchange-color);
}

#blue-container {
    color: #2196f3
}

#bolsa-container {
    color: #9c27b0;
}

#ccl-container {
    color: #ff9800;
}

#mayorista-container {
    color: var(--mayorista-exchange-color);
}

#cripto-container {
    color: #00bcd4;
}

#tarjeta-container {
    color: #f44336;
}

#real-container {
    color: #009440;
}

#euro-container {
    color: #4164cc;
}

#uruguayo-container {
    color: var(--uruguayo-exchange-color);
}


@media (max-width: 1380px) {
    #dollar-container {
        max-width: 90vw;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: thin;
    }
}

@media (max-width: 768px) {
    #dollar-container {
        height: 60px;
    }

    #hide-button {
        width: 40px;
        height: 60px;
    }

    .hide-icon {
        width: 25px;
        height: 25px;
    }

    .exchange-container {
        padding: 0px 6px;
        height: 62px;
    }

    .exchange-title {
        font-size: 1rem;
    }

    .exchange-value {
        font-size: 0.8rem;
    }
}

@media (max-height: 600px) {
    #dollar-container {
        height: 50px;
    }

    #hide-button {
        height: 50px;
        width: 35px;
    }

    .hide-icon {
        width: 20px;
        height: 20px;
    }

    .exchange-container {
        height: 53px;
        min-width: 70px;
        padding: 0px;
    }

    .exchange-title {
        font-size: 0.85rem;
    }

    .exchange-value {
        font-size: 0.7rem;
    }
}

@media (max-width: 480px) {
    .exchange-container {
        min-width: 65px;
        padding: 0px 2px;
    }

    .exchange-title {
        font-size: 0.8rem;
    }

    .exchange-value {
        font-size: 0.65rem;
    }
}

@media (max-height: 500px) and (orientation: landscape) {
    #dollar-container {
        height: 45px;
    }

    #hide-button {
        height: 45px;
        width: 32px;
    }

    .hide-icon {
        width: 18px;
        height: 18px;
    }

    .exchange-container {
        height: 48px;
        min-width: 60px;
        padding: 0px 2px;
    }

    .exchange-title {
        font-size: 0.75rem;
    }

    .exchange-value {
        font-size: 0.6rem;
    }
}
</style>