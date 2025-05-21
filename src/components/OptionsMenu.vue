<script setup lang="ts">
import { defineEmits, onMounted, onUnmounted, ref } from 'vue';
import { Calculator, FileSpreadsheet, FileText, FileUp, BatteryCharging, BatteryFull, Sun, Moon, CircleHelp, LogOut } from 'lucide-vue-next';
import { X } from 'lucide-vue-next';
import { electronAPI } from '../utilities/electronAPI'
import { useFocusTrap } from '../utilities/focusTrap';
import { useEcoModeStore } from '../stores/ecoMode';
import { useToast } from 'vue-toastification';
import { useCurrentlyOpenModalStore } from '../stores/openModal';

const currentTheme = ref<string>("dark");
const modalRef = ref<HTMLElement | null>(null);
const ecoMode = ref<boolean>(false);

const toast = useToast();
const ecoModeStore = useEcoModeStore();
const currentlyOpenModalStore = useCurrentlyOpenModalStore();

useFocusTrap(modalRef);

const emit = defineEmits(['close', 'export-pdf', 'export-excel', 'import-excel']);

function openCalculator() {
    electronAPI.openCalculator();
    setTimeout(() => {
        closeMenu();
    }, 150); // Timeout for better GUI feedback
}

function exportPDF() {
    emit('export-pdf');
}

function exportExcel() {
    emit('export-excel');
}

function importExcel() {
    emit('import-excel');
}

function switchTheme() {
    currentTheme.value = localStorage.getItem('theme') || "";
    if (currentTheme.value == 'dark') {
        document.documentElement.classList.add("light-theme");
        document.documentElement.classList.remove("dark-theme");
        localStorage.setItem('theme', "light");
        currentTheme.value = "light";
        toast.info("Modo claro activado");
    } else {
        document.documentElement.classList.add("dark-theme");
        document.documentElement.classList.remove("light-theme");
        localStorage.setItem('theme', "dark");
        currentTheme.value = "dark";
        toast.info("Modo oscuro activado");
    }
}

function toggleEcoMode() {
    const storedValue = localStorage.getItem('eco');
    ecoMode.value = storedValue == "true" ? false : true;
    ecoModeStore.setEcoMode(ecoMode.value);
    localStorage.setItem('eco', ecoMode.value.toString());

    if (ecoMode.value) {
        document.documentElement.classList.add("eco-mode");
        toast.info("Modo eco activado");
    } else {
        document.documentElement.classList.remove("eco-mode");
        toast.info("Modo eco desactivado");
    }
}

function getHelp() {

}

function closeMenu() {
    emit('close');
}

function exit() {
    electronAPI.closeApp();
}

function handleKeydown(event: KeyboardEvent) {
    // Only trigger on no modifier keys (to avoid conflicts)
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    // Use lower case for comparison
    const key = event.key.toLowerCase();

    switch (key) {
        case 'c':
            event.preventDefault();
            openCalculator();
            break;
        case 'e':
            event.preventDefault();
            exportExcel();
            break;
        case 'p':
            event.preventDefault();
            exportPDF();
            break;
        case 'i':
            event.preventDefault();
            importExcel();
            break;
        case 'm':
            event.preventDefault();
            toggleEcoMode();
            break;
        case 'o':
            event.preventDefault();
            switchTheme();
            break;
        case 'a':
            event.preventDefault();
            getHelp();
            break;
        case 'escape':
            closeMenu();
            break;
    }
}

onMounted(() => {
    currentlyOpenModalStore.setModalOpen();

    window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
    currentlyOpenModalStore.setModalClosed();
});
</script>

<template>
    <div id="modal-container" class="modal-sm" ref="modalRef">
        <div id="modal-top-section">
            <div class="spacer"></div>
            <h2 id="options-header">Opciones</h2>
            <button id="close-btn" class="btn" title="Cerrar menú" @click.prevent="closeMenu">
                <X id="close-icon" />
            </button>
        </div>

        <div id="options-menu">
            <button id="calculator-btn" class="btn option-btn" title="Abrir calculadora"
                @click.prevent="openCalculator">
                <Calculator id="calculator-icon" class="icon" />
                <p class="btn-text"><u>C</u>alculadora</p>
            </button>

            <button id="excel-btn" class="btn option-btn" title="Exportar a hoja de cálculo de Excel"
                @click.prevent="exportExcel">
                <FileSpreadsheet id="excel-icon" class="icon" />
                <p class="btn-text">Exportar a <u>E</u>xcel</p>
            </button>

            <button id="pdf-btn" class="btn option-btn" title="Exportar a PDF para imprimir" @click.prevent="exportPDF">
                <FileText id="pdf-icon" class="icon" />
                <p class="btn-text">Exportar a <u>P</u>DF</p>
            </button>

            <button id="import-btn" class="btn option-btn" title="Importar hoja de cálculo de Excel"
                @click.prevent="importExcel">
                <FileUp id="import-icon" class="icon" />
                <p class="btn-text"><u>I</u>mportar Excel</p>
            </button>

            <button id="battery-btn" class="btn option-btn" title="Modo de ahorro de batería"
                @click.prevent="toggleEcoMode">
                <BatteryCharging id="battery-charging-icon" class="eco-mode-icon icon" v-if="!ecoMode" />
                <BatteryFull id="battery-full-icon" class="eco-mode-icon icon" v-if="ecoMode" />
                <p class="btn-text"><u>M</u>odo{{ ecoMode ? " Normal" : " Eco" }}</p>
            </button>

            <button id="color-mode-btn" class="btn option-btn" title="Cambiar esquema de colores"
                @click.prevent="switchTheme">
                <Sun id="sun-icon" class="color-mode-icon icon" v-if="currentTheme == 'dark'" />
                <Moon id="moon-icon" class="color-mode-icon icon" v-if="currentTheme == 'light'" />
                <p class="btn-text">Modo{{ currentTheme == 'dark' ? " Clar" : " Oscur" }}<u>o</u></p>
            </button>

            <button id="help-btn" class="btn option-btn" title="Abrir documento de ayuda">
                <CircleHelp id="help-icon" class="icon" />
                <p class="btn-text"><u>A</u>yuda</p>
            </button>

            <button id="exit-btn" class="btn option-btn" title="Cerrar el programa" @click.prevent="exit">
                <LogOut id="exit-icon" class="icon" />
                <p class="btn-text">Salir</p>
            </button>
        </div>
    </div>
</template>

<style scoped>
#modal-container {
    font-family: "Roboto", Helvetica, sans-serif;
    font-size: 18px;
    background-color: var(--modal-background-color);
    color: var(--text-color);
    text-align: center;
    padding-top: 10px;
    margin: 0 33%;
    width: 100%;
    border-radius: 5px;
}

#modal-top-section {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.spacer {
    width: 42px;
}

#options-header {
    font-size: 36px;
    flex: 1;
    text-align: center;
    margin: 0;
    user-select: none;
}

#close-btn {
    color: var(--copy-button-hover-color);
    padding: 0;
    margin-right: 7px;
    border: none;
}

#close-btn:hover {
    color: var(--close-button-hover);
}

#close-icon {
    cursor: pointer;
    vertical-align: middle;
    align-content: center;
    width: 32px;
    height: 32px;
}

#options-menu {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: 6em;
    row-gap: 3em;
    padding: 25px 50px 50px 50px;
}

button,
.icon {
    transition: color 0.233s;
}

.option-btn {
    color: var(--option-button);
    padding: 0;
    width: 120px;
    height: 80px;
    border: none;
}

.icon {
    width: 66px;
    height: 66px;
}

#calculator-btn:hover> :first-child {
    color: #3d3aff;
}

#excel-btn:hover> :first-child {
    color: #1D6F42;
}

#pdf-btn:hover> :first-child {
    color: #D32F2F;
}

#import-btn:hover> :first-child {
    color: #388E3C;
}

#battery-btn:hover> :first-child {
    color: #009688;
}

#color-mode-btn:hover>#sun-icon {
    color: #FFEB3B;
}

#color-mode-btn:hover>#moon-icon {
    color: #7C3AED;
}

#help-btn:hover> :first-child {
    color: #1976D2;
}

#exit-btn:hover> :first-child {
    color: #F44336;
}
</style>