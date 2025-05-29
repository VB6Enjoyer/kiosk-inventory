<script setup lang="ts">
import { defineEmits, onMounted, onUnmounted, ref } from 'vue';
import { Calculator, FileSpreadsheet, FileText, FileUp, BatteryCharging, BatteryFull, Sun, Moon, CircleHelp, LogOut } from 'lucide-vue-next';
import { X } from 'lucide-vue-next';
import { electronAPI } from '../utilities/electronAPI'
import { useFocusTrap } from '../utilities/focusTrap';
import { useEcoModeStore } from '../stores/ecoMode';
import { useToast } from 'vue-toastification';
import { useCurrentlyOpenModalStore } from '../stores/openModal';

//const currentTheme = ref<string>("");
const modalRef = ref<HTMLElement | null>(null);
const ecoMode = ref<boolean>(false);
const theme = ref<string>("");

const toast = useToast();
const ecoModeStore = useEcoModeStore();
const currentlyOpenModalStore = useCurrentlyOpenModalStore();

useFocusTrap(modalRef);

const emit = defineEmits(['close', 'export-pdf', 'export-excel', 'import-excel', 'change-theme']);

const props = defineProps<{
    currentTheme: string
}>();

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
    if (theme.value == 'dark') { // If current theme is 'dark', switch to 'light'
        theme.value = 'light';
        toast.info("Modo claro activado.");
    } else {
        theme.value = 'dark';
        toast.info("Modo oscuro activado.");
    }

    emit('change-theme', theme.value);
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
    theme.value = props.currentTheme;

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
            <button id="close-btn" class="btn" title="Cerrar menú (Esc)" @click.prevent="closeMenu">
                <X id="close-icon" />
            </button>
        </div>

        <div id="options-menu">
            <button id="calculator-btn" class="btn option-btn" title="Abrir calculadora (C)"
                @click.prevent="openCalculator">
                <Calculator id="calculator-icon" class="icon" />
                <p class="btn-text"><u>C</u>alculadora</p>
            </button>

            <button id="excel-btn" class="btn option-btn" title="Exportar a hoja de cálculo de Excel (E)"
                @click.prevent="exportExcel">
                <FileSpreadsheet id="excel-icon" class="icon" />
                <p class="btn-text">Exportar a <u>E</u>xcel</p>
            </button>

            <button id="pdf-btn" class="btn option-btn" title="Exportar a PDF para imprimir (P)"
                @click.prevent="exportPDF">
                <FileText id="pdf-icon" class="icon" />
                <p class="btn-text">Exportar a <u>P</u>DF</p>
            </button>

            <button id="import-btn" class="btn option-btn" title="Importar hoja de cálculo de Excel (I)"
                @click.prevent="importExcel">
                <FileUp id="import-icon" class="icon" />
                <p class="btn-text"><u>I</u>mportar Excel</p>
            </button>

            <button id="battery-btn" class="btn option-btn" title="Modo de ahorro de batería (M)"
                @click.prevent="toggleEcoMode">
                <BatteryCharging id="battery-charging-icon" class="eco-mode-icon icon" v-if="!ecoMode" />
                <BatteryFull id="battery-full-icon" class="eco-mode-icon icon" v-if="ecoMode" />
                <p class="btn-text"><u>M</u>odo{{ ecoMode ? " Normal" : " Eco" }}</p>
            </button>

            <button id="color-mode-btn" class="btn option-btn" title="Cambiar esquema de colores (O)"
                @click.prevent="switchTheme">
                <Sun id="sun-icon" class="color-mode-icon icon" v-if="theme == 'dark'" />
                <Moon id="moon-icon" class="color-mode-icon icon" v-if="theme == 'light'" />
                <p class="btn-text">Modo{{ theme == 'dark' ? " Clar" : " Oscur" }}<u>o</u></p>
            </button>

            <button id="help-btn" class="btn option-btn" title="Abrir documento de ayuda (A)">
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
    font-size: clamp(0.9rem, 2vw, 1.125rem);
    /* Responsive font size */
    background-color: var(--modal-background-color);
    color: var(--text-color);
    text-align: center;
    padding-top: 10px;
    margin: 0 33%;
    width: 100%;
    border-radius: 5px;
    box-sizing: border-box;
    /* Include padding in width calculation */
}

#modal-top-section {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
}

.spacer {
    width: clamp(32px, 8vw, 42px);
    /* Responsive spacer width */
}

#options-header {
    font-size: clamp(1.5rem, 5vw, 2.25rem);
    flex: 1;
    flex-shrink: 0;
    text-align: center;
    margin: 0;
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

#close-btn {
    color: var(--copy-button-hover-color);
    padding: 0;
    margin-right: 7px;
    border: none;
    box-sizing: border-box;
    flex-shrink: 0;
}

#close-btn:hover {
    color: var(--close-button-hover);
}

#close-icon {
    cursor: pointer;
    align-content: center;
    width: clamp(24px, 6vw, 32px);
    /* Responsive icon size */
    height: clamp(24px, 6vw, 32px);
    display: block;
    margin: auto;
}

#options-menu {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: clamp(2em, 8vw, 6em);
    row-gap: clamp(1.5em, 5vw, 3em);
    padding: clamp(20px, 5vw, 25px) clamp(20px, 8vw, 50px) clamp(30px, 8vw, 50px);
    justify-items: center;
}

button,
.icon {
    transition: color 0.233s;
}

.option-btn {
    color: var(--option-button);
    padding: 0;
    width: clamp(100px, 20vw, 120px);
    height: clamp(70px, 15vw, 80px);
    border: none;
    box-sizing: border-box;
}

.icon {
    width: clamp(40px, 10vw, 66px);
    /* Responsive icon size */
    height: clamp(40px, 10vw, 66px);
    margin-bottom: 4px;
    /* Added margin between icon and text */
}

.btn-text {
    font-size: clamp(0.9rem, 1.8vw, 1rem);
    text-align: center;
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

@media (max-width: 768px) {
    #modal-container {
        width: 95%;
        font-size: 0.9rem;
    }

    #options-menu {
        column-gap: 1.5em;
        row-gap: 1.5em;
        padding: 20px 15px 20px;
    }

    .option-btn {
        width: 100px;
        height: 70px;
    }

    .icon {
        width: 40px;
        height: 40px;
    }

    #close-btn {
        width: 4vw;
        margin-left: 5px;
    }

    #close-icon {
        width: clamp(12px, 3vw, 24px);
        height: clamp(12px, 3vw, 24px);
    }

    .btn-text {
        font-size: 0.75rem;
    }

    #options-header {
        font-size: 1.5rem;
    }
}

@media (max-height: 600px) {
    #modal-container {
        max-height: 95vh;
        padding-top: 5px;
    }

    #options-menu {
        padding: 15px 20px 25px;
        row-gap: 1em;
    }

    .option-btn {
        height: 60px;
        padding: 6px;
    }

    .icon {
        width: 35px;
        height: 35px;
    }

    .btn-text {
        font-size: 0.7rem;
    }

    #options-header {
        font-size: 1.3rem;
    }
}

@media (max-width: 480px) {
    #modal-container {
        width: 98%;
        padding-top: 5px;
    }

    #options-menu {
        grid-template-columns: 1fr;
        /* Single column on very small screens */
        padding: 15px 10px 25px;
        row-gap: 1em;
    }

    .option-btn {
        width: 90%;
        max-width: 200px;
        height: 60px;
        flex-direction: row;
        /* Horizontal layout on small screens */
        justify-content: flex-start;
        padding: 8px 12px;
    }

    .icon {
        width: 32px;
        height: 32px;
        margin-bottom: 0;
        margin-right: 12px;
    }

    .btn-text {
        font-size: 0.8rem;
        text-align: left;
    }
}

@media (max-height: 500px) and (orientation: landscape) {
    #modal-container {
        max-height: 98vh;
        padding-top: 2px;
    }

    #options-menu {
        grid-template-columns: repeat(4, 1fr);
        /* Four columns in landscape */
        padding: 10px 15px 20px;
        row-gap: 0.5em;
        column-gap: 1em;
    }

    .option-btn {
        height: 50px;
        padding: 4px;
    }

    .icon {
        width: 28px;
        height: 28px;
    }

    .btn-text {
        font-size: 0.65rem;
    }

    #options-header {
        font-size: 1.2rem;
    }
}
</style>