<script setup lang="ts">
import { ref, computed, defineEmits } from 'vue';
import { Calculator, FileSpreadsheet, FileText, FileUp, BatteryCharging, Sun, CircleHelp, LogOut } from 'lucide-vue-next';

const emit = defineEmits(['close', 'advanced-search']);

function closeModal() {
    emit('close');
}
</script>

<template>
    <div id="modal-container" class="modal-sm">
        <h2 id="options-header">Opciones</h2>
        <div id="options-menu">
            <button id="calculator-btn" class="btn option-btn">
                <Calculator id="calculator-icon" class="icon"/>
                <p class="btn-text">Calculadora</p>
            </button>
            <button id="excel-btn" class="btn option-btn">
                <FileSpreadsheet id="excel-icon" class="icon"/>
                <p class="btn-text">Exportar a Excel</p>
            </button>
            <button id="pdf-btn" class="btn option-btn">
                <FileText id="pdf-icon" class="icon"/>
                <p class="btn-text">Exportar a PDF</p>
            </button>
            <button id="import-btn" class="btn option-btn">
                <FileUp id="import-icon" class="icon"/>
                <p class="btn-text">Importar Excel</p>
            </button>
            <button id="battery-btn" class="btn option-btn">
                <BatteryCharging id="battery-icon" class="icon"/>
                <p class="btn-text">Modo Eco</p>
            </button>
            <button id="color-mode-btn" class="btn option-btn">
                <Sun id="color-mode-icon" class="icon"/>
                <p class="btn-text">Modo Claro</p>
            </button>
            <button id="help-btn" class="btn option-btn">
                <CircleHelp id="help-icon" class="icon"/>
                <p class="btn-text">Ayuda</p>
            </button>
            <button id="exit-btn" class="btn option-btn">
                <LogOut id="exit-icon" class="icon"/>
                <p class="btn-text">Salir</p>
            </button>
        </div>
    </div>
</template>

<style scoped>
#modal-container {
    font-family: 'Roboto', sans-serif;
    font-size: 18px;
    background-color: #2d2d2d;
    color: #f2f2f2;
    text-align: center;
    padding-top: 10px;
    margin: 0 33%;
    width: 100%;
    border-radius: 5px;
}

#options-header {
    padding-top: 10px;
    font-size: 36px;
}

#options-menu {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2em;
    justify-content: center;
    align-content: center;
    align-items: center;
    padding: 15px 35px;
}

.option-btn {
    color: #d1d1d1;
}

.icon {
    width: 50px;
    height: 50px;
}

#calculator-btn:hover > :first-child {
    color: #3d3aff;
}

#excel-btn:hover > :first-child {
    color: #1D6F42;
}

#pdf-btn:hover > :first-child {
    color: #D32F2F;
}

#import-btn:hover > :first-child {
    color: #388E3C;
}

#battery-btn:hover > :first-child {
    color: #009688;
}

#color-mode-btn:hover > :first-child {
    color: #CFAD31;
}

#help-btn:hover > :first-child {
    color: #1976D2;
}

#exit-btn:hover > :first-child {
    color: #F44336;
}
</style>