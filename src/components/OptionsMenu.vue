<script setup lang="ts">
import { defineEmits, ref } from 'vue';
import { Calculator, FileSpreadsheet, FileText, FileUp, BatteryCharging, Sun, CircleHelp, LogOut } from 'lucide-vue-next';
import { X } from 'lucide-vue-next';
import { electronAPI } from '../utilities/electronAPI'
import { useFocusTrap } from '../utilities/focusTrap';

const modalRef = ref<HTMLElement | null>(null);
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

function closeMenu() {
    emit('close');
}

function exit() {
    electronAPI.closeApp();
}
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
                <p class="btn-text">Calculadora</p>
            </button>

            <button id="excel-btn" class="btn option-btn" title="Exportar a hoja de cálculo de Excel"
                @click.prevent="exportExcel">
                <FileSpreadsheet id="excel-icon" class="icon" />
                <p class="btn-text">Exportar a Excel</p>
            </button>

            <button id="pdf-btn" class="btn option-btn" title="Exportar a PDF para imprimir" @click.prevent="exportPDF">
                <FileText id="pdf-icon" class="icon" />
                <p class="btn-text">Exportar a PDF</p>
            </button>

            <button id="import-btn" class="btn option-btn" title="Importar hoja de cálculo de Excel"
                @click.prevent="importExcel">
                <FileUp id="import-icon" class="icon" />
                <p class="btn-text">Importar Excel</p>
            </button>

            <button id="battery-btn" class="btn option-btn" title="Modo de ahorro de batería">
                <BatteryCharging id="battery-icon" class="icon" />
                <p class="btn-text">Modo Eco</p>
            </button>

            <button id="color-mode-btn" class="btn option-btn" title="Esquema de colores claros">
                <Sun id="color-mode-icon" class="icon" />
                <p class="btn-text">Modo Claro</p>
            </button>

            <button id="help-btn" class="btn option-btn" title="Abrir documento de ayuda">
                <CircleHelp id="help-icon" class="icon" />
                <p class="btn-text">Ayuda</p>
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
    background-color: #2d2d2d;
    color: #f2f2f2;
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
    color: #ffffff;
    padding: 0;
    margin-right: 7px;
    border: none;
}

#close-btn:hover {
    color: #ff0000;
    ;
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
    color: #d1d1d1;
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

#color-mode-btn:hover> :first-child {
    color: #FFEB3B;
}

#help-btn:hover> :first-child {
    color: #1976D2;
}

#exit-btn:hover> :first-child {
    color: #F44336;
}
</style>